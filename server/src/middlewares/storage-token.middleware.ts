import { createMiddleware } from 'hono/factory'

import { config } from '../utils/config.js'
import { unauthorized } from '../utils/errors.js'

export const requireStorageToken = createMiddleware(async (c, next) => {
  if (c.req.header('x-storage-token') !== config.STORAGE_NODE_TOKEN) throw unauthorized('Unauthorized')
  await next()
})
