import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { config } from '@/utils/config'
import { notFound } from '@/utils/errors'

function blobPath(blobId: string) {
  // All storage-node file access goes through this helper to prevent route handlers
  // from constructing paths directly.
  return path.join(config.STORAGE_DATA_DIR, `${blobId}.blob`)
}

export async function storeBlobReplica(blobId: string, payload: Buffer) {
  await mkdir(config.STORAGE_DATA_DIR, { recursive: true })
  await writeFile(blobPath(blobId), payload)
}

export async function readBlobReplica(blobId: string) {
  try {
    return await readFile(blobPath(blobId))
  } catch {
    throw notFound('Not found')
  }
}

export async function deleteBlobReplica(blobId: string) {
  await rm(blobPath(blobId), { force: true })
}