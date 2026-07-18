import { isAddress } from 'viem'
import { z } from 'zod'

import { config } from '@/utils/config'
import { badRequest } from '@/utils/errors'

export const numericBlobIdSchema = z.string().regex(/^\d+$/, 'Invalid blob ID')
export const blobReferenceSchema = z.string().regex(/^(\d+|mb1_[A-Za-z0-9_]+)$/, 'Invalid blob reference')
export const walletAddressSchema = z.string().refine((value) => isAddress(value), 'Invalid wallet address')

export function parseBlobId(blobId: string | undefined) {
  if (!blobId) throw badRequest('Invalid blob ID')
  const parsed = numericBlobIdSchema.safeParse(blobId)
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid blob ID')
  return parsed.data
}

export function parseBlobReference(reference: string | undefined) {
  if (!reference) throw badRequest('Invalid blob reference')
  const parsed = blobReferenceSchema.safeParse(reference)
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid blob reference')
  return parsed.data
}

export function parseWalletAddress(address: string | undefined) {
  if (!address) throw badRequest('Invalid wallet address')
  const parsed = walletAddressSchema.safeParse(address)
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid wallet address')
  return parsed.data
}

export function parseUploadFormFile(value: File | string | null) {
  if (!(value instanceof File)) throw badRequest('Upload form must include a file field')
  return value
}

export function parseUploadFile(file: File) {
  if (file.size === 0 || file.size > config.MAX_UPLOAD_BYTES) throw badRequest('Invalid file size')
  return file
}