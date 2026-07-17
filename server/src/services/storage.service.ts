import axios from 'axios'

import { sha256Hex } from '@/services/crypto.service'
import { config } from '@/utils/config'

function headers() {
  return { 'x-storage-token': config.STORAGE_NODE_TOKEN }
}

export async function replicate(blobId: string, ciphertext: Buffer) {
  const outcomes = await Promise.all(
    config.storageNodeUrls.map(async (nodeUrl) => {
      const response = await axios.put(`${nodeUrl}/internal/blobs/${blobId}`, new Uint8Array(ciphertext), {
        headers: { ...headers(), 'content-type': 'application/octet-stream' },
        validateStatus: () => true
      })
      if (response.status < 200 || response.status >= 300) {
        const detail = (response.data as string)?.trim() ?? ''
        throw new Error(`Storage node ${nodeUrl} returned ${response.status}${detail ? `: ${detail}` : ''}`)
      }
      return nodeUrl
    })
  )

  // This commits to the ciphertext and exact node order without exposing that data on-chain.
  const commitmentInput = Buffer.from(JSON.stringify({ blobId, nodes: outcomes, ciphertextHash: sha256Hex(ciphertext) }))
  return { nodeUrls: outcomes, commitment: sha256Hex(commitmentInput) }
}

export async function retrieve(blobId: string, nodeUrls: string[]) {
  for (const nodeUrl of nodeUrls) {
    try {
      const response = await axios.get(`${nodeUrl}/internal/blobs/${blobId}`, {
        headers: headers(),
        responseType: 'arraybuffer',
        validateStatus: () => true
      })
      if (response.status < 200 || response.status >= 300) continue
      return Buffer.from(response.data as ArrayBuffer)
    } catch {
      // Try the next replica.
    }
  }
  throw new Error('No storage replica is available')
}

export async function deleteReplicas(blobId: string, nodeUrls: string[]) {
  await Promise.allSettled(
    nodeUrls.map((nodeUrl) => axios.delete(`${nodeUrl}/internal/blobs/${blobId}`, { headers: headers() }))
  )
}