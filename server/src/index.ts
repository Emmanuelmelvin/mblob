import { serve } from '@hono/node-server'

import { createApp } from './app.js'
import { config } from './config.js'
import { initializeDatabase } from './database.js'
import { logger } from './utils/logger.js'

await initializeDatabase()

const app = createApp()
serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, 'Mblob gateway listening')
})
