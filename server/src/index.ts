import { serve } from '@hono/node-server'

import { createApp } from '@/app'
import { config } from '@/utils/config'
import { initializeDatabase } from '@/repositories/database'
import { logger } from '@/utils/logger'

await initializeDatabase()

const app = createApp()
serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, 'Mblob gateway listening')
})