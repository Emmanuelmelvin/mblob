import postgres from 'postgres'

import { config } from '../utils/config.js'

export const sql = postgres(config.DATABASE_URL)

export type StoredBlob = {
  blobId: string
  publicId: string
  owner: string
  fileHash: string
  wrappedDataKey: string
  contentType: string
  contentLength: number
  nodeUrls: string[]
  createTxHash: string | null
  activateTxHash: string | null
}

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS stored_blobs (
      blob_id NUMERIC PRIMARY KEY,
      public_id TEXT,
      owner TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      wrapped_data_key TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_length INTEGER NOT NULL,
      node_urls JSONB NOT NULL,
      create_tx_hash TEXT,
      activate_tx_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  // Keep existing local deployments usable while adding human-shareable IDs.
  await sql`ALTER TABLE stored_blobs ADD COLUMN IF NOT EXISTS public_id TEXT`
  await sql`ALTER TABLE stored_blobs ADD COLUMN IF NOT EXISTS transaction_hash TEXT`
  await sql`ALTER TABLE stored_blobs ADD COLUMN IF NOT EXISTS create_tx_hash TEXT`
  await sql`ALTER TABLE stored_blobs ADD COLUMN IF NOT EXISTS activate_tx_hash TEXT`
  // Older deployments stored only the activation transaction under this name.
  await sql`UPDATE stored_blobs SET activate_tx_hash = transaction_hash WHERE activate_tx_hash IS NULL AND transaction_hash IS NOT NULL`
  await sql`UPDATE stored_blobs SET public_id = 'mb1_legacy_' || blob_id WHERE public_id IS NULL`
  await sql`ALTER TABLE stored_blobs ALTER COLUMN public_id SET NOT NULL`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS stored_blobs_public_id_key ON stored_blobs (public_id)`
  await sql`
    CREATE TABLE IF NOT EXISTS used_nonces (
      nonce TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `
}

export async function reserveNonce(nonce: string) {
  await sql`DELETE FROM used_nonces WHERE expires_at < NOW()`
  const inserted = await sql`
    INSERT INTO used_nonces (nonce, expires_at)
    VALUES (${nonce}, NOW() + INTERVAL '10 minutes')
    ON CONFLICT (nonce) DO NOTHING
    RETURNING nonce
  `
  return inserted.length === 1
}

export async function saveBlob(blob: StoredBlob) {
  await sql`
    INSERT INTO stored_blobs (
      blob_id, public_id, owner, file_hash, wrapped_data_key, content_type, content_length, node_urls, create_tx_hash, activate_tx_hash
    ) VALUES (
      ${blob.blobId}, ${blob.publicId}, ${blob.owner}, ${blob.fileHash}, ${blob.wrappedDataKey},
      ${blob.contentType}, ${blob.contentLength}, ${sql.json(blob.nodeUrls)}, ${blob.createTxHash}, ${blob.activateTxHash}
    )
  `
}

export async function getStoredBlob(blobId: string): Promise<StoredBlob | undefined> {
  const rows = await sql<{
    blob_id: string
    public_id: string
    owner: string
    file_hash: string
    wrapped_data_key: string
    content_type: string
    content_length: number
    node_urls: string[]
    create_tx_hash: string | null
    activate_tx_hash: string | null
  }[]>`
    SELECT blob_id, public_id, owner, file_hash, wrapped_data_key, content_type, content_length, node_urls, create_tx_hash, activate_tx_hash
    FROM stored_blobs WHERE blob_id = ${blobId}
  `
  const row = rows[0]
  if (!row) return undefined
  return {
    blobId: row.blob_id,
    publicId: row.public_id,
    owner: row.owner,
    fileHash: row.file_hash,
    wrappedDataKey: row.wrapped_data_key,
    contentType: row.content_type,
    contentLength: row.content_length,
    nodeUrls: row.node_urls,
    createTxHash: row.create_tx_hash,
    activateTxHash: row.activate_tx_hash
  }
}

export async function getStoredBlobsByOwner(owner: string): Promise<StoredBlob[]> {
  const rows = await sql<{
    blob_id: string
    public_id: string
    owner: string
    file_hash: string
    wrapped_data_key: string
    content_type: string
    content_length: number
    node_urls: string[]
    create_tx_hash: string | null
    activate_tx_hash: string | null
  }[]>`
    SELECT blob_id, public_id, owner, file_hash, wrapped_data_key, content_type, content_length, node_urls, create_tx_hash, activate_tx_hash
    FROM stored_blobs WHERE lower(owner) = lower(${owner})
    ORDER BY blob_id::numeric DESC
  `
  return rows.map((row) => ({ blobId: row.blob_id, publicId: row.public_id, owner: row.owner, fileHash: row.file_hash, wrappedDataKey: row.wrapped_data_key, contentType: row.content_type, contentLength: row.content_length, nodeUrls: row.node_urls, createTxHash: row.create_tx_hash, activateTxHash: row.activate_tx_hash }))
}

export async function getStoredBlobByPublicId(publicId: string): Promise<StoredBlob | undefined> {
  const rows = await sql<{
    blob_id: string
    public_id: string
    owner: string
    file_hash: string
    wrapped_data_key: string
    content_type: string
    content_length: number
    node_urls: string[]
    create_tx_hash: string | null
    activate_tx_hash: string | null
  }[]>`
    SELECT blob_id, public_id, owner, file_hash, wrapped_data_key, content_type, content_length, node_urls, create_tx_hash, activate_tx_hash
    FROM stored_blobs WHERE public_id = ${publicId}
  `
  const row = rows[0]
  if (!row) return undefined
  return { blobId: row.blob_id, publicId: row.public_id, owner: row.owner, fileHash: row.file_hash, wrappedDataKey: row.wrapped_data_key, contentType: row.content_type, contentLength: row.content_length, nodeUrls: row.node_urls, createTxHash: row.create_tx_hash, activateTxHash: row.activate_tx_hash }
}