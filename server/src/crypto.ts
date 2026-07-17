import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { keccak256, toHex } from 'viem'

const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export function sha256Hex(input: Buffer): `0x${string}` {
  return `0x${createHash('sha256').update(input).digest('hex')}`
}

export function keccak256Hex(input: Buffer): `0x${string}` {
  return keccak256(toHex(input))
}

export function fileContentHashes(input: Buffer) {
  return {
    sha256: sha256Hex(input),
    keccak256: keccak256Hex(input)
  }
}

export function matchesFileHash(input: Buffer, expectedHash: string) {
  const normalizedExpected = expectedHash.toLowerCase()
  return Object.values(fileContentHashes(input)).some((hash) => hash.toLowerCase() === normalizedExpected)
}

function seal(plaintext: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext])
}

function open(payload: Buffer, key: Buffer): Buffer {
  if (payload.length <= IV_LENGTH + AUTH_TAG_LENGTH) throw new Error('Invalid encrypted payload')
  const iv = payload.subarray(0, IV_LENGTH)
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

export function encryptForStorage(plaintext: Buffer, masterKey: Buffer) {
  const dataKey = randomBytes(32)
  return {
    ciphertext: seal(plaintext, dataKey),
    wrappedDataKey: seal(dataKey, masterKey).toString('base64')
  }
}

export function decryptFromStorage(ciphertext: Buffer, wrappedDataKey: string, masterKey: Buffer) {
  const dataKey = open(Buffer.from(wrappedDataKey, 'base64'), masterKey)
  return open(ciphertext, dataKey)
}
