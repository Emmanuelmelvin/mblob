import { parseBlobId } from '@/validators/blob.validators'
import { badRequest } from '@/utils/errors'

export const parseStorageBlobId = parseBlobId

export function parseStoragePayload(payload: Buffer) {
  if (payload.length === 0) throw badRequest('Empty payload')
  return payload
}