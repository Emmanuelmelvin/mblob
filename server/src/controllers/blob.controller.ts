import type { Context } from 'hono'

import { getBlob, downloadBlob, uploadBlob } from '@/services/blob.service'
import { badRequest } from '@/utils/errors'
import { logger } from '@/utils/logger'
import { parseBlobId, parseBlobReference, parseUploadFile, parseUploadFormFile } from '@/validators/blob.validators'

export async function uploadBlobController(c: Context) {
  const blobId = parseBlobId(c.req.param('blobId'))
  const form = await c.req.formData()
  const file = parseUploadFile(parseUploadFormFile(form.get('file')))
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