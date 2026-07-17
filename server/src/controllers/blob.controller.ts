import type { Context } from 'hono'

import { getBlob, downloadBlob, uploadBlob } from '../services/blob.service.js'
import { logger } from '../utils/logger.js'
import { parseBlobId, parseBlobReference, parseUploadFile } from '../validators/blob.validators.js'

export async function uploadBlobController(c: Context) {
  const blobId = parseBlobId(c.req.param('blobId'))
  const body = await c.req.arrayBuffer()
  const fileName = decodeURIComponent(c.req.header('x-file-name') ?? `mblob-${blobId}`)
  const file = parseUploadFile(new File([body], fileName, { type: c.req.header('content-type') ?? 'application/octet-stream' }))
  const result = await uploadBlob({
    blobId,
    headers: c.req.raw.headers,
    file,
    createTxHash: c.req.header('x-create-tx-hash') ?? null
  })

  logger.info({ blobId, publicId: result.publicId, transactionHash: result.transactionHash, replicas: result.replicas }, 'Blob uploaded and activated')
  return c.json(result, 201)
}

export async function getBlobController(c: Context) {
  const reference = parseBlobReference(c.req.param('blobId'))
  return c.json(await getBlob(reference))
}

export async function downloadBlobController(c: Context) {
  const reference = parseBlobReference(c.req.param('blobId'))
  const { blobId, plaintext, contentType } = await downloadBlob({ reference, headers: c.req.raw.headers })

  c.header('content-type', contentType)
  c.header('content-length', String(plaintext.length))
  c.header('content-disposition', `attachment; filename="mblob-${blobId}"`)
  const body = plaintext.buffer.slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength) as ArrayBuffer
  return new Response(body, { headers: c.res.headers })
}
