import { Hono } from 'hono'

import { gatewayHealth, storageNodeHealth } from '../controllers/health.controller.js'

export const gatewayHealthRoutes = new Hono().get('/health', gatewayHealth)
export const storageNodeHealthRoutes = new Hono().get('/health', storageNodeHealth)
