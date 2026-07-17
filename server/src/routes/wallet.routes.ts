import { Hono } from 'hono'

import { getWalletBlobsController } from '@/controllers/wallet.controller'

export const walletRoutes = new Hono()
    .get('/:address/blobs', getWalletBlobsController)