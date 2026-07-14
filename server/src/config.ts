import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  MONAD_RPC_URL: z.string().url(),
  MBLOB_REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  GATEWAY_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  DATA_ENCRYPTION_KEY: z.string().min(1),
  STORAGE_NODE_URLS: z.string().min(1),
  STORAGE_NODE_TOKEN: z.string().min(24),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().max(104_857_600).default(26_214_400),
  STORAGE_NODE_PORT: z.coerce.number().int().positive().default(4001),
  STORAGE_DATA_DIR: z.string().default('./data')
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const encryptionKey = Buffer.from(parsed.data.DATA_ENCRYPTION_KEY, 'base64')
if (encryptionKey.length !== 32) {
  throw new Error('DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
}

export const config = {
  ...parsed.data,
  MBLOB_REGISTRY_ADDRESS: parsed.data.MBLOB_REGISTRY_ADDRESS as `0x${string}`,
  GATEWAY_PRIVATE_KEY: parsed.data.GATEWAY_PRIVATE_KEY as `0x${string}`,
  encryptionKey,
  storageNodeUrls: parsed.data.STORAGE_NODE_URLS.split(',').map((url) => url.trim()).filter(Boolean)
}
