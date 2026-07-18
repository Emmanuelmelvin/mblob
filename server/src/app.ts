import { Hono } from 'hono'

import { accessLogMiddleware } from '@/middlewares/access.middleware'
import { apiCors } from '@/middlewares/cors.middleware'
import { errorMiddleware } from '@/middlewares/error.middleware'
import { blobRoutes, gatewayHealthRoutes, walletRoutes } from '@/routes/index'

export function createApp() {
  // Build the gateway without binding a port so routes can be tested in isolation
  const app = new Hono()

  app.onError(errorMiddleware)
  app.use('*', accessLogMiddleware)
  app.use('/v1/*', apiCors)
  app.route('/', gatewayHealthRoutes)
  app.route('/v1/blobs', blobRoutes)
  app.route('/v1/wallets', walletRoutes)

  return app
}