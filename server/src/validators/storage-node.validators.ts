import { parseBlobId } from './blob.validators.js'
import { badRequest } from '../utils/errors.js'

export const parseStorageBlobId = parseBlobId

export function parseStoragePayload(payload: Buffer) {
  if (payload.length === 0) throw badRequest('Empty payload')
  return payload
}
