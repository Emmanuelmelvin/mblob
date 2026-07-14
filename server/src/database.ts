import postgres from 'postgres'

import { config } from './config.js'

export const sql = postgres(config.DATABASE_URL)

export type StoredBlob = {
  blobId: string
  owner: string
  fileHash: string
  wrappedDataKey: string
  contentType: string
  contentLength: number
  nodeUrls: string[]
}

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS stored_blobs (
      blob_id NUMERIC PRIMARY KEY,
      owner TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      wrapped_data_key TEXT NOT NULL,
      content_type TEXT NOT NULL,
      content_length INTEGER NOT NULL,
      node_urls JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
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
      blob_id, owner, file_hash, wrapped_data_key, content_type, content_length, node_urls
    ) VALUES (
      ${blob.blobId}, ${blob.owner}, ${blob.fileHash}, ${blob.wrappedDataKey},
      ${blob.contentType}, ${blob.contentLength}, ${sql.json(blob.nodeUrls)}
    )
  `
}

export async function getStoredBlob(blobId: string): Promise<StoredBlob | undefined> {
  const rows = await sql<{
    blob_id: string
    owner: string
    file_hash: string
    wrapped_data_key: string
    content_type: string
    content_length: number
    node_urls: string[]
  }[]>`
    SELECT blob_id, owner, file_hash, wrapped_data_key, content_type, content_length, node_urls
    FROM stored_blobs WHERE blob_id = ${blobId}
  `
  const row = rows[0]
  if (!row) return undefined
  return {
    blobId: row.blob_id,
    owner: row.owner,
    fileHash: row.file_hash,
    wrappedDataKey: row.wrapped_data_key,
    contentType: row.content_type,
    contentLength: row.content_length,
    nodeUrls: row.node_urls
  }
}
