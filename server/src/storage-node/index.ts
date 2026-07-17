import { serve } from '@hono/node-server'

import { createStorageNodeApp } from '@/storage-node/app'
import { config } from '@/utils/config'

const app = createStorageNodeApp()
serve({ fetch: app.fetch, port: config.STORAGE_NODE_PORT })