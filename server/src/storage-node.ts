import { serve } from '@hono/node-server'

import { createStorageNodeApp } from './storage-node-app.js'
import { config } from './config.js'

const app = createStorageNodeApp()
serve({ fetch: app.fetch, port: config.STORAGE_NODE_PORT })
