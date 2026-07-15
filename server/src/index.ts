import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import pino from 'pino'
import { randomUUID } from 'node:crypto'

import { assertBlobOwner, activateBlob, getChainBlob } from './chain.js'
import { config } from './config.js'
import { decryptFromStorage, encryptForStorage, sha256Hex } from './crypto.js'
import { getStoredBlob, getStoredBlobByPublicId, getStoredBlobsByOwner, initializeDatabase, saveBlob } from './database.js'
import { verifyRequestSignature } from './auth.js'
import { replicate, retrieve } from './storage.js'

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })
const app = new Hono()

function errorContext(error: unknown) {
  if (error instanceof Error) return { err: error, errorName: error.name, errorMessage: error.message, errorStack: error.stack }
  return { errorMessage: String(error), errorValue: error }
}

async function resolveBlobReference(reference: string) {
  if (/^\d+$/.test(reference)) return reference
  const stored = await getStoredBlobByPublicId(reference)
  if (!stored) throw new Error('Blob ID was not found')
  return stored.blobId
}

app.use('/v1/*', cors())

app.get('/health', (c) => c.json({ ok: true, service: 'mblob-gateway' }))

app.post('/v1/blobs/:blobId/upload', async (c) => {
  const blobId = c.req.param('blobId')
  let stage = 'authenticate request'
  try {
    const owner = await verifyRequestSignature(c.req.raw.headers, 'upload', blobId)
    const createTxHash = c.req.header('x-create-tx-hash') ?? null
    stage = 'verify on-chain ownership'
    const chainBlob = await assertBlobOwner(BigInt(blobId), owner, 0)
    stage = 'parse uploaded file'
    const form = await c.req.parseBody()
    const file = form.file
    if (!(file instanceof File)) return c.json({ error: 'Attach the file as multipart field "file"' }, 400)
    if (file.size === 0 || file.size > config.MAX_UPLOAD_BYTES) return c.json({ error: 'Invalid file size' }, 400)

    const plaintext = Buffer.from(await file.arrayBuffer())
    stage = 'verify file hash'
    const fileHash = sha256Hex(plaintext)
    if (fileHash.toLowerCase() !== chainBlob.fileHash.toLowerCase()) {
      return c.json({ error: 'File hash does not match the on-chain blob record' }, 400)
    }

    stage = 'encrypt file'
    const encrypted = encryptForStorage(plaintext, config.encryptionKey)
    stage = 'replicate encrypted file'
    const replicated = await replicate(blobId, encrypted.ciphertext)
    stage = 'activate blob on-chain'
    const activateTxHash = await activateBlob(BigInt(blobId), replicated.commitment)
    stage = 'save blob metadata'
    const publicId = `mb1_${randomUUID().replaceAll('-', '')}`
    await saveBlob({
      blobId,
      publicId,
      owner,
      fileHash,
      wrappedDataKey: encrypted.wrappedDataKey,
      contentType: file.type || 'application/octet-stream',
      contentLength: plaintext.length,
      nodeUrls: replicated.nodeUrls,
      createTxHash,
      activateTxHash
    })

    logger.info({ blobId, publicId, activateTxHash, replicas: replicated.nodeUrls.length }, 'Blob uploaded and activated')
    return c.json({ blobId, publicId, status: 'active', createTxHash, activateTxHash, replicas: replicated.nodeUrls.length }, 201)
  } catch (error) {
    logger.warn({ ...errorContext(error), blobId, stage }, 'Upload failed')
    return c.json({ error: error instanceof Error ? error.message : 'Upload failed' }, 400)
  }
})

app.get('/v1/blobs/:blobId', async (c) => {
  const blobReference = c.req.param('blobId')
  let stage = 'resolve blob ID'
  try {
    const blobId = await resolveBlobReference(blobReference)
    stage = 'read on-chain blob'
    const blob = await getChainBlob(BigInt(blobId))
    stage = 'read stored metadata'
    const stored = await getStoredBlob(blobId)
    return c.json({
      blobId,
      publicId: stored?.publicId ?? null,
      owner: blob.owner,
      status: blob.status,
      fileHash: blob.fileHash,
      stored: Boolean(stored),
      createTxHash: stored?.createTxHash ?? null,
      activateTxHash: stored?.activateTxHash ?? null
    })
  } catch (error) {
    logger.warn({ ...errorContext(error), blobReference, stage }, 'Blob lookup failed')
    return c.json({ error: error instanceof Error ? error.message : 'Unable to read blob' }, 400)
  }
})


app.get('/v1/wallets/:address/blobs', async (c) => {
  const owner = c.req.param('address')
  let stage = 'read stored blobs by owner'
  try {
    const storedBlobs = await getStoredBlobsByOwner(owner)
    const blobs = await Promise.all(storedBlobs.map(async (stored) => {
      const chainBlob = await getChainBlob(BigInt(stored.blobId))
      return {
        blobId: stored.blobId,
        publicId: stored.publicId,
        owner: chainBlob.owner,
        status: chainBlob.status,
        fileHash: chainBlob.fileHash,
        stored: true,
        contentType: stored.contentType,
        contentLength: stored.contentLength,
        nodeUrls: stored.nodeUrls,
        createTxHash: stored.createTxHash,
        activateTxHash: stored.activateTxHash
      }
    }))
    return c.json({ owner, blobs })
  } catch (error) {
    logger.warn({ ...errorContext(error), owner, stage }, 'Wallet blob lookup failed')
    return c.json({ error: error instanceof Error ? error.message : 'Unable to read wallet blobs' }, 400)
  }
})

app.get('/v1/blobs/:blobId/download', async (c) => {
  const blobReference = c.req.param('blobId')
  let stage = 'authenticate request'
  try {
    const owner = await verifyRequestSignature(c.req.raw.headers, 'download', blobReference)
    stage = 'resolve blob ID'
    const blobId = await resolveBlobReference(blobReference)
    stage = 'verify on-chain ownership'
    await assertBlobOwner(BigInt(blobId), owner, 1)
    stage = 'read stored metadata'
    const stored = await getStoredBlob(blobId)
    if (!stored) return c.json({ error: 'Blob has not been uploaded to storage' }, 404)

    stage = 'retrieve encrypted replica'
    const ciphertext = await retrieve(blobId, stored.nodeUrls)
    stage = 'decrypt file'
    const plaintext = decryptFromStorage(ciphertext, stored.wrappedDataKey, config.encryptionKey)
    if (sha256Hex(plaintext).toLowerCase() !== stored.fileHash.toLowerCase()) {
      throw new Error('Retrieved file integrity check failed')
    }
    c.header('content-type', stored.contentType)
    c.header('content-length', String(plaintext.length))
    c.header('content-disposition', `attachment; filename="mblob-${blobId}"`)
    const body = plaintext.buffer.slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength) as ArrayBuffer
    return new Response(body, { headers: c.res.headers })
  } catch (error) {
    logger.warn({ ...errorContext(error), blobReference, stage }, 'Blob download failed')
    return c.json({ error: error instanceof Error ? error.message : 'Unable to download blob' }, 400)
  }
})

await initializeDatabase()
serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, 'Mblob gateway listening')
})