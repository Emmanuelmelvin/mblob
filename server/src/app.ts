import { Hono } from 'hono'

import { apiCors } from './middlewares/cors.middleware.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { blobRoutes, gatewayHealthRoutes, walletRoutes } from './routes/index.js'

export function createApp() {
  // Build the gateway without binding a port so routes can be tested in isolation.
  const app = new Hono()

  app.onError(errorMiddleware)
  app.use('/v1/*', apiCors)
  app.route('/', gatewayHealthRoutes)
  app.route('/v1/blobs', blobRoutes)
  app.route('/v1/wallets', walletRoutes)

  return app
}
