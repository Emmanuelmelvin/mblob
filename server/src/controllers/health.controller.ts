import type { Context } from 'hono'

export function gatewayHealth(c: Context) {
  return c.json({ ok: true, service: 'mblob-gateway' })
}

export function storageNodeHealth(c: Context) {
  return c.json({ ok: true, service: 'mblob-storage-node' })
}