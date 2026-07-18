import { 
  createPublicClient, 
  createWalletClient, 
  defineChain, 
  http, 
  isAddress, 
  type Address, 
  type Hex 
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { mblobRegistryAbi } from '@/abi/mblob-registry'
import { config } from '@/utils/config'

type ChainBlob = {
  owner: Address
  fileHash: Hex
  status: number
}

const transport = http(config.MONAD_RPC_URL)
const account = privateKeyToAccount(config.GATEWAY_PRIVATE_KEY)

const monadTestnet = defineChain({
  id: 10_143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [config.MONAD_RPC_URL] } }
})

export const publicClient = createPublicClient({ chain: monadTestnet, transport })
export const walletClient = createWalletClient({ account, chain: monadTestnet, transport })

export async function getChainBlob(blobId: bigint): Promise<ChainBlob> {
  const blob = await publicClient.readContract({
    address: config.MBLOB_REGISTRY_ADDRESS,
    abi: mblobRegistryAbi,
    functionName: 'getBlob',
    args: [blobId]
  })
  return blob as unknown as ChainBlob
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