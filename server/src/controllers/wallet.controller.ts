import type { Context } from 'hono'

import { getWalletBlobs } from '../services/blob.service.js'
import { parseWalletAddress } from '../validators/blob.validators.js'

export async function getWalletBlobsController(c: Context) {
  const owner = parseWalletAddress(c.req.param('address'))
  return c.json(await getWalletBlobs(owner))
}
