import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import pino from 'pino'

import { assertBlobOwner, activateBlob } from './chain.js'
import { config } from './config.js'
import { decryptFromStorage, encryptForStorage, sha256Hex } from './crypto.js'
import { getStoredBlob, initializeDatabase, saveBlob } from './database.js'
import { verifyRequestSignature } from './auth.js'
import { replicate, retrieve } from './storage.js'

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })
const app = new Hono()

app.use('/v1/*', cors())

app.get('/health', (c) => c.json({ ok: true, service: 'mblob-gateway' }))

app.post('/v1/blobs/:blobId/upload', async (c) => {
  const blobId = c.req.param('blobId')
  try {
    const owner = await verifyRequestSignature(c.req.raw.headers, 'upload', blobId)
    const chainBlob = await assertBlobOwner(BigInt(blobId), owner, 0)
    const form = await c.req.parseBody()
    const file = form.file
    if (!(file instanceof File)) return c.json({ error: 'Attach the file as multipart field "file"' }, 400)
    if (file.size === 0 || file.size > config.MAX_UPLOAD_BYTES) return c.json({ error: 'Invalid file size' }, 400)

    const plaintext = Buffer.from(await file.arrayBuffer())
    const fileHash = sha256Hex(plaintext)
    if (fileHash.toLowerCase() !== chainBlob.fileHash.toLowerCase()) {
      return c.json({ error: 'File hash does not match the on-chain blob record' }, 400)
    }

    const encrypted = encryptForStorage(plaintext, config.encryptionKey)
    const replicated = await replicate(blobId, encrypted.ciphertext)
    const transactionHash = await activateBlob(BigInt(blobId), replicated.commitment)
    await saveBlob({
      blobId,
      owner,
      fileHash,
      wrappedDataKey: encrypted.wrappedDataKey,
      contentType: file.type || 'application/octet-stream',
      contentLength: plaintext.length,
      nodeUrls: replicated.nodeUrls
    })

    logger.info({ blobId, transactionHash }, 'Blob uploaded and activated')
    return c.json({ blobId, status: 'active', transactionHash, replicas: replicated.nodeUrls.length }, 201)
  } catch (error) {
    logger.warn({ error, blobId }, 'Upload failed')
    return c.json({ error: error instanceof Error ? error.message : 'Upload failed' }, 400)
  }
})

app.get('/v1/blobs/:blobId', async (c) => {
  const blobId = c.req.param('blobId')
  try {
    const owner = await verifyRequestSignature(c.req.raw.headers, 'download', blobId)
    const blob = await assertBlobOwner(BigInt(blobId), owner)
    return c.json({
      blobId,
      owner: blob.owner,
      status: blob.status,
      fileHash: blob.fileHash,
      stored: Boolean(await getStoredBlob(blobId))
    })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unable to read blob' }, 400)
  }
})

app.get('/v1/blobs/:blobId/download', async (c) => {
  const blobId = c.req.param('blobId')
  try {
    const owner = await verifyRequestSignature(c.req.raw.headers, 'download', blobId)
    await assertBlobOwner(BigInt(blobId), owner, 1)
    const stored = await getStoredBlob(blobId)
    if (!stored) return c.json({ error: 'Blob has not been uploaded to storage' }, 404)

    const ciphertext = await retrieve(blobId, stored.nodeUrls)
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
    return c.json({ error: error instanceof Error ? error.message : 'Unable to download blob' }, 400)
  }
})

await initializeDatabase()
serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, 'Mblob gateway listening')
})
