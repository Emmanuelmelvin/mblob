import { Hono } from 'hono'

import { downloadBlobController, getBlobController, uploadBlobController } from '@/controllers/blob.controller'

export const blobRoutes = new Hono()
  .post('/:blobId/upload', uploadBlobController)
  .get('/:blobId', getBlobController)
  .get('/:blobId/download', downloadBlobController)