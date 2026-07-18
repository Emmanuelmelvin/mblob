import { 
  createPublicClient, 
  createWalletClient, 
  defineChain, 
  http, 
  isAddress, 
  type Address, 
  type Hex, 
  type PublicClient,
  type WalletClient 
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { mblobRegistryAbi } from '@/abi/mblob-registry'
import { errorContext } from '@/utils/errors'
import { config } from '@/utils/config'
import { logger } from '@/utils/logger'

type ChainBlob = {
  owner: Address
  fileHash: Hex
  encryptionMetadataHash: Hex
  storageNodesCommitment: Hex
  fileSizeBytes: bigint
  createdAt: bigint
  expiresAt: bigint
  replicationFactor: number
  deletable: boolean
  status: number
  payment: bigint
}

const transport = http(config.MONAD_RPC_URL)
const account = privateKeyToAccount(config.GATEWAY_PRIVATE_KEY)

const monadTestnet = defineChain({
  id: 10_143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [config.MONAD_RPC_URL] } }
})

export const publicClient: PublicClient<typeof transport, typeof monadTestnet> = createPublicClient({ chain: monadTestnet, transport })
export const walletClient: WalletClient<typeof transport, typeof monadTestnet, typeof account> = createWalletClient({ account, chain: monadTestnet, transport })

export async function getChainBlob(blobId: bigint): Promise<ChainBlob> {
  try {
    const blob = await publicClient.readContract({
      address: config.MBLOB_REGISTRY_ADDRESS,
      abi: mblobRegistryAbi,
      functionName: 'getBlob',
      args: [blobId]
    }) as unknown as ChainBlob

    logger.info({
      blobId: blobId.toString(),
      registryAddress: config.MBLOB_REGISTRY_ADDRESS,
      rpcUrl: config.MONAD_RPC_URL,
      chainBlob: {
        owner: blob.owner,
        fileHash: blob.fileHash,
        encryptionMetadataHash: blob.encryptionMetadataHash,
        storageNodesCommitment: blob.storageNodesCommitment,
        fileSizeBytes: blob.fileSizeBytes.toString(),
        createdAt: blob.createdAt.toString(),
        expiresAt: blob.expiresAt.toString(),
        replicationFactor: blob.replicationFactor,
        deletable: blob.deletable,
        status: blob.status,
        payment: blob.payment.toString()
      }
    }, 'Fetched blob from registry contract')

    return blob
  } catch (error) {
    logger.error({
      ...errorContext(error),
      blobId: blobId.toString(),
      registryAddress: config.MBLOB_REGISTRY_ADDRESS,
      rpcUrl: config.MONAD_RPC_URL
    }, 'Failed to fetch blob from registry contract')
    throw error
  }
}

export async function assertBlobOwner(blobId: bigint, address: string, expectedStatus?: number) {
  if (!isAddress(address)) throw new Error('Invalid wallet address')
  const blob = await getChainBlob(blobId)
  if (blob.owner.toLowerCase() !== address.toLowerCase()) throw new Error('Wallet does not own this blob')
  if (expectedStatus !== undefined && blob.status !== expectedStatus) {
    throw new Error(`Blob is not in the required status (${expectedStatus})`)
  }
  return blob
}

export async function activateBlob(blobId: bigint, nodesCommitment: Hex) {
  const hash = await walletClient.writeContract({
    address: config.MBLOB_REGISTRY_ADDRESS,
    abi: mblobRegistryAbi,
    functionName: 'activateBlob',
    args: [blobId, nodesCommitment]
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}
