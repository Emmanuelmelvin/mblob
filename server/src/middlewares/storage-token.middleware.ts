import { createMiddleware } from 'hono/factory'

import { config } from '@/utils/config'
import { unauthorized } from '@/utils/errors'

export const requireStorageToken = createMiddleware(async (c, next) => {
  if (c.req.header('x-storage-token') !== config.STORAGE_NODE_TOKEN) throw unauthorized('Unauthorized')
  await next()
})