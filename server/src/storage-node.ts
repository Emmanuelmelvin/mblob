import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { config } from './config.js'

const app = new Hono()

function validBlobId(blobId: string) {
  return /^\d+$/.test(blobId)
}

function blobPath(blobId: string) {
  return path.join(config.STORAGE_DATA_DIR, `${blobId}.blob`)
}

app.use('/internal/*', async (c, next) => {
  if (c.req.header('x-storage-token') !== config.STORAGE_NODE_TOKEN) return c.text('Unauthorized', 401)
  await next()
})

app.get('/health', (c) => c.json({ ok: true, service: 'mblob-storage-node' }))

app.put('/internal/blobs/:blobId', async (c) => {
  const blobId = c.req.param('blobId')
  if (!validBlobId(blobId)) return c.text('Invalid blob ID', 400)
  const payload = Buffer.from(await c.req.arrayBuffer())
  if (payload.length === 0) return c.text('Empty payload', 400)
  await mkdir(config.STORAGE_DATA_DIR, { recursive: true })
  await writeFile(blobPath(blobId), payload)
  return c.body(null, 204)
})

app.get('/internal/blobs/:blobId', async (c) => {
  const blobId = c.req.param('blobId')
  if (!validBlobId(blobId)) return c.text('Invalid blob ID', 400)
  try {
    const payload = await readFile(blobPath(blobId))
    return c.body(payload)
  } catch {
    return c.text('Not found', 404)
  }
})

app.delete('/internal/blobs/:blobId', async (c) => {
  const blobId = c.req.param('blobId')
  if (!validBlobId(blobId)) return c.text('Invalid blob ID', 400)
  await rm(blobPath(blobId), { force: true })
  return c.body(null, 204)
})

serve({ fetch: app.fetch, port: config.STORAGE_NODE_PORT })
