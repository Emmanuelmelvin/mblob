import type { Context } from 'hono'

import { getWalletBlobs } from '@/services/blob.service'
import { parseWalletAddress } from '@/validators/blob.validators'

export async function getWalletBlobsController(c: Context) {
  const owner = parseWalletAddress(c.req.param('address'))
  return c.json(await getWalletBlobs(owner))
}