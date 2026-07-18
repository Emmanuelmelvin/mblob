import { Hono } from 'hono'

import { deleteBlobController, downloadBlobController, getBlobController, uploadBlobController } from '@/controllers/blob.controller'

export const blobRoutes = new Hono()
  .post('/:blobId/upload', uploadBlobController)
  .get('/:blobId', getBlobController)
  .get('/:blobId/download', downloadBlobController)
  .delete('/:blobId', deleteBlobController)
