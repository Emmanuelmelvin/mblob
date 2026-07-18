import { isAddress, verifyMessage, type Address, type Hex } from 'viem'

import { reserveNonce } from '@/repositories/database'

const messageFor = (operation: 'upload' | 'download' | 'delete', blobId: string, nonce: string) =>
  `Mblob ${operation} authorization\nBlob ID: ${blobId}\nNonce: ${nonce}`

export async function verifyRequestSignature(
  headers: Headers,
  operation: 'upload' | 'download' | 'delete',
  blobId: string
): Promise<Address> {
  const address = headers.get('x-mblob-address')
  const signature = headers.get('x-mblob-signature')
  const nonce = headers.get('x-mblob-nonce')
  if (!address || !signature || !nonce || !isAddress(address)) throw new Error('Missing or invalid wallet signature headers')

  const verified = await verifyMessage({
    address,
    message: messageFor(operation, blobId, nonce),
    signature: signature as Hex
  })
  if (!verified) throw new Error('Invalid wallet signature')
  if (!(await reserveNonce(nonce))) throw new Error('Authorization nonce has already been used')
  return address
}

export { messageFor }