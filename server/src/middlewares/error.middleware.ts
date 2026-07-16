import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { ApiError, errorContext } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export const errorMiddleware: ErrorHandler = (error, c) => {
  const status = error instanceof ApiError ? error.status : 400
  const message = error instanceof Error ? error.message : 'Request failed'

  logger.warn({ ...errorContext(error), path: c.req.path, method: c.req.method, status }, 'Request failed')
  return c.json({ error: message }, status as ContentfulStatusCode)
}
