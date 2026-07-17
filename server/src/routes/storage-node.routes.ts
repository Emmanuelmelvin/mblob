import { Hono } from 'hono'

import { deleteStorageBlobController, getStorageBlobController, putStorageBlobController } from '@/controllers/storage-node.controller'
import { requireStorageToken } from '@/middlewares/storage-token.middleware'

export const storageNodeRoutes = new Hono()

storageNodeRoutes.use('/internal/*', requireStorageToken)
storageNodeRoutes.put('/internal/blobs/:blobId', putStorageBlobController)
storageNodeRoutes.get('/internal/blobs/:blobId', getStorageBlobController)
storageNodeRoutes.delete('/internal/blobs/:blobId', deleteStorageBlobController)