import type { Context } from 'hono'

import { deleteBlob, getBlob, downloadBlob, uploadBlob } from '@/services/blob.service'
import { logger } from '@/utils/logger'
import { badRequest, errorContext } from '@/utils/errors'
import { parseBlobId, parseBlobReference, parseUploadContentType, parseUploadFile, parseUploadFormFile } from '@/validators/blob.validators'

function decodeFileName(fileName: string) {
  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

export async function uploadBlobController(c: Context) {
  const blobId = parseBlobId(c.req.param('blobId'))
  const uploadContentType = parseUploadContentType(c.req.header('content-type'))

  let file: File
  if (uploadContentType.isMultipart) {
    let body: Record<string, unknown>
    try {
      body = await c.req.parseBody()
    } catch (error) {
      logger.warn(errorContext(error), 'Failed to parse multipart upload body')
      throw badRequest('Malformed multipart form data')
    }

    file = parseUploadFile(parseUploadFormFile(body['file'] ?? null))
  } else {
    const bytes = await c.req.raw.arrayBuffer()
    const fileName = c.req.header('x-file-name') || 'upload.bin'
    const decodedFileName = decodeFileName(fileName)
    file = parseUploadFile(new File([new Uint8Array(bytes)], decodedFileName, { type: uploadContentType.contentType || 'application/octet-stream' }))
  }
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

export async function deleteBlobController(c: Context) {
  const reference = parseBlobReference(c.req.param('blobId'))
  return c.json(await deleteBlob({ reference, headers: c.req.raw.headers }))
}
