import { Hono } from 'hono'

import { errorMiddleware } from '@/middlewares/error.middleware'
import { storageNodeHealthRoutes, storageNodeRoutes } from '@/routes/index'

export function createStorageNodeApp() {
  const app = new Hono()

  app.onError(errorMiddleware)
  app.route('/', storageNodeHealthRoutes)
  app.route('/', storageNodeRoutes)

  return app
}