import type { MiddlewareHandler } from 'hono'

function clientIp(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || '-'
  return headers.get('x-real-ip') ?? '-'
}

function accessDate(now: Date) {
  const day = String(now.getUTCDate()).padStart(2, '0')
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getUTCMonth()]
  const year = now.getUTCFullYear()
  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')
  const seconds = String(now.getUTCSeconds()).padStart(2, '0')
  return `${day}/${month}/${year}:${hours}:${minutes}:${seconds} +0000`
}

function localTime(now: Date) {
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' })
}

export const accessLogMiddleware: MiddlewareHandler = async (c, next) => {
  await next()

  const now = new Date()
  const ip = clientIp(c.req.raw.headers)
  const method = c.req.method
  const target = new URL(c.req.url).pathname + new URL(c.req.url).search
  const protocol = c.req.raw.headers.get('x-forwarded-proto')?.toUpperCase() === 'HTTPS' ? 'HTTPS' : 'HTTP'
  const status = c.res.status
  const bytes = c.res.headers.get('content-length') ?? '-'

  console.log(`[${localTime(now)}] ${ip} - - [${accessDate(now)}] "${method} ${target} ${protocol}/1.1" ${status} ${bytes}`)
}
