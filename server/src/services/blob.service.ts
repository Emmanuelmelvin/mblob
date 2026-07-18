import { randomUUID } from 'node:crypto'

import { config } from '@/utils/config'
import { deleteStoredBlob, getStoredBlob, getStoredBlobByPublicId, getStoredBlobsByOwner, saveBlob } from '@/repositories/blob.repository'
import { verifyRequestSignature } from '@/services/auth.service'
import { activateBlob, assertBlobOwner, getChainBlob } from '@/services/chain.service'
import { decryptFromStorage, encryptForStorage, fileContentHashes, matchesFileHash } from '@/services/crypto.service'
import { deleteReplicas, replicate, retrieve } from '@/services/storage.service'
import { notFound } from '@/utils/errors'
import { logger } from '@/utils/logger'

export async function resolveBlobReference(reference: string) {
  // Public IDs are shareable aliases; numeric IDs can be used directly on-chain.
  if (/^\d+$/.test(reference)) return reference
  const stored = await getStoredBlobByPublicId(reference)
  if (!stored) throw notFound('Blob ID was not found')
  return stored.blobId
}

export async function uploadBlob(input: { blobId: string; headers: Headers; file: File; createTxHash: string | null }) {
  const owner = await verifyRequestSignature(input.headers, 'upload', input.blobId)
  const chainBlob = await assertBlobOwner(BigInt(input.blobId), owner, 0)
  const plaintext = Buffer.from(await input.file.arrayBuffer())
  const uploadedHashes = fileContentHashes(plaintext)
  const clientFileHash = input.headers.get('x-file-hash')

  logger.info({
    blobId: input.blobId,
    owner,
    chainOwner: chainBlob.owner,
    chainStatus: chainBlob.status,
    expectedFileHash: chainBlob.fileHash,
    uploadedSha256: uploadedHashes.sha256,
    uploadedKeccak256: uploadedHashes.keccak256,
    clientFileHash,
    uploadedBytes: plaintext.length,
    onChainFileSizeBytes: chainBlob.fileSizeBytes.toString(),
    fileSize: input.file.size,
    fileType: input.file.type || 'application/octet-stream',
    contentType: input.headers.get('content-type') ?? null,
    createTxHash: input.createTxHash
  }, 'Comparing uploaded file hash with on-chain blob record')

  const normalizedExpectedHash = chainBlob.fileHash.toLowerCase()
  const hashesMatch = uploadedHashes.sha256.toLowerCase() === normalizedExpectedHash || uploadedHashes.keccak256.toLowerCase() === normalizedExpectedHash

  if (!hashesMatch) {
    logger.warn({
      blobId: input.blobId,
      owner,
      chainOwner: chainBlob.owner,
      chainStatus: chainBlob.status,
      expectedFileHash: chainBlob.fileHash,
      uploadedSha256: uploadedHashes.sha256,
      uploadedKeccak256: uploadedHashes.keccak256,
      clientFileHash,
      uploadedBytes: plaintext.length,
      onChainFileSizeBytes: chainBlob.fileSizeBytes.toString(),
      fileSize: input.file.size,
      fileType: input.file.type || 'application/octet-stream',
      contentType: input.headers.get('content-type') ?? null,
      createTxHash: input.createTxHash
    }, 'Uploaded file hash did not match on-chain blob record')
    throw new Error('File hash does not match the on-chain blob record')
  }

  // Store only encrypted bytes on storage nodes; the wrapped data key stays in metadata.
  const encrypted = encryptForStorage(plaintext, config.encryptionKey)
  const replicated = await replicate(input.blobId, encrypted.ciphertext)
  const transactionHash = await activateBlob(BigInt(input.blobId), replicated.commitment)
  const publicId = `mb1_${randomUUID().replaceAll('-', '')}`

  await saveBlob({
    blobId: input.blobId,
    publicId,
    owner,
    fileHash: chainBlob.fileHash,
    wrappedDataKey: encrypted.wrappedDataKey,
    contentType: input.file.type || 'application/octet-stream',
    contentLength: plaintext.length,
    nodeUrls: replicated.nodeUrls,
    createTxHash: input.createTxHash,
    activateTxHash: transactionHash
  })

  return { blobId: input.blobId, publicId, status: 'active', transactionHash, replicas: replicated.nodeUrls.length }
}

export async function getBlob(reference: string) {
  const blobId = await resolveBlobReference(reference)
  const blob = await getChainBlob(BigInt(blobId))
  const stored = await getStoredBlob(blobId)

  return {
    blobId,
    publicId: stored?.publicId ?? null,
    owner: blob.owner,
    status: blob.status,
    fileHash: blob.fileHash,
    stored: Boolean(stored),
    createTxHash: stored?.createTxHash ?? null,
    activateTxHash: stored?.activateTxHash ?? null
  }
}

export async function getWalletBlobs(owner: string) {
  const storedBlobs = await getStoredBlobsByOwner(owner)
  const blobs = await Promise.all(storedBlobs.map(async (stored) => {
    const chainBlob = await getChainBlob(BigInt(stored.blobId))
    return {
      blobId: stored.blobId,
      publicId: stored.publicId,
      owner: chainBlob.owner,
      status: chainBlob.status,
      fileHash: chainBlob.fileHash,
      stored: true,
      contentType: stored.contentType,
      contentLength: stored.contentLength,
      nodeUrls: stored.nodeUrls,
      createTxHash: stored.createTxHash,
      activateTxHash: stored.activateTxHash
    }
  }))

  return { owner, blobs }
}

export async function downloadBlob(input: { reference: string; headers: Headers }) {
  const owner = await verifyRequestSignature(input.headers, 'download', input.reference)
  const blobId = await resolveBlobReference(input.reference)
  await assertBlobOwner(BigInt(blobId), owner, 1)
  const stored = await getStoredBlob(blobId)
  if (!stored) throw notFound('Blob has not been uploaded to storage')

  // Try available replicas before decrypting and re-checking the original file hash.
  const ciphertext = await retrieve(blobId, stored.nodeUrls)
  const plaintext = decryptFromStorage(ciphertext, stored.wrappedDataKey, config.encryptionKey)
  if (!matchesFileHash(plaintext, stored.fileHash)) {
    throw new Error('Retrieved file integrity check failed')
  }

  return { blobId, plaintext, contentType: stored.contentType }
}

export async function deleteBlob(input: { reference: string; headers: Headers }) {
  const owner = await verifyRequestSignature(input.headers, 'delete', input.reference)
  const blobId = await resolveBlobReference(input.reference)
  await assertBlobOwner(BigInt(blobId), owner, 1)
  const stored = await getStoredBlob(blobId)
  if (!stored) throw notFound('Blob has not been uploaded to storage')

  await deleteReplicas(blobId, stored.nodeUrls)
  await deleteStoredBlob(blobId)

  // TODO: Perform the mathematical computation that determines how much MON
  // should be sent back to the user based on how long the data lived on
  // storage nodes, replica count, file size, and other refund factors.
  // Refund transfers are not implemented yet.
  return { blobId, status: 'deleted' }
}
