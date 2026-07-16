import type { Context } from 'hono'

import { deleteBlobReplica, readBlobReplica, storeBlobReplica } from '../services/storage-node.service.js'
import { parseStorageBlobId, parseStoragePayload } from '../validators/storage-node.validators.js'

export async function putStorageBlobController(c: Context) {
  const blobId = parseStorageBlobId(c.req.param('blobId'))
  const payload = parseStoragePayload(Buffer.from(await c.req.arrayBuffer()))
  await storeBlobReplica(blobId, payload)
  return c.body(null, 204)
}

export async function getStorageBlobController(c: Context) {
  const blobId = parseStorageBlobId(c.req.param('blobId'))
  return c.body(await readBlobReplica(blobId))
}

export async function deleteStorageBlobController(c: Context) {
  const blobId = parseStorageBlobId(c.req.param('blobId'))
  await deleteBlobReplica(blobId)
  return c.body(null, 204)
}
