import { sha256Hex } from './crypto.js'

import { config } from './config.js'

function headers() {
  return { 'x-storage-token': config.STORAGE_NODE_TOKEN }
}

export async function replicate(blobId: string, ciphertext: Buffer) {
  const outcomes = await Promise.all(
    config.storageNodeUrls.map(async (nodeUrl) => {
      const response = await fetch(`${nodeUrl}/internal/blobs/${blobId}`, {
        method: 'PUT',
        headers: { ...headers(), 'content-type': 'application/octet-stream' },
        body: new Uint8Array(ciphertext)
      })
      if (!response.ok) {
        const detail = (await response.text()).trim()
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
      const response = await fetch(`${nodeUrl}/internal/blobs/${blobId}`, { headers: headers() })
      if (!response.ok) continue
      return Buffer.from(await response.arrayBuffer())
    } catch {
      // Try the next replica.
    }
  }
  throw new Error('No storage replica is available')
}

export async function deleteReplicas(blobId: string, nodeUrls: string[]) {
  await Promise.allSettled(
    nodeUrls.map((nodeUrl) => fetch(`${nodeUrl}/internal/blobs/${blobId}`, { method: 'DELETE', headers: headers() }))
  )
}
