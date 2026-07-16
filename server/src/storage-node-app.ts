import { Hono } from 'hono'

import { errorMiddleware } from './middlewares/error.middleware.js'
import { storageNodeHealthRoutes, storageNodeRoutes } from './routes/index.js'

export function createStorageNodeApp() {
  const app = new Hono()

  app.onError(errorMiddleware)
  app.route('/', storageNodeHealthRoutes)
  app.route('/', storageNodeRoutes)

  return app
}
