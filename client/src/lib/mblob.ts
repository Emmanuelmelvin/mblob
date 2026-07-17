import { createPublicClient, defineChain, http, parseEventLogs, zeroHash, type Address, type Hex } from 'viem'
import { CONTRACT, GATEWAY } from './constants'

export const monadTestnet = defineChain({
    id: CONTRACT.CHAIN_ID,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: [CONTRACT.RPC_URL] } },
})

export const registryAbi = [
    { type: 'function', name: 'quote', stateMutability: 'view', inputs: [{ name: 'fileSizeBytes', type: 'uint64' }, { name: 'durationHours', type: 'uint64' }, { name: 'replicationFactor', type: 'uint8' }, { name: 'permanent', type: 'bool' }], outputs: [{ type: 'uint256' }] },
    { type: 'function', name: 'createBlob', stateMutability: 'payable', inputs: [{ name: 'fileHash', type: 'bytes32' }, { name: 'encryptionMetadataHash', type: 'bytes32' }, { name: 'fileSizeBytes', type: 'uint64' }, { name: 'durationHours', type: 'uint64' }, { name: 'replicationFactor', type: 'uint8' }, { name: 'permanent', type: 'bool' }], outputs: [{ name: 'blobId', type: 'uint256' }] },
    { type: 'function', name: 'getBlob', stateMutability: 'view', inputs: [{ name: 'blobId', type: 'uint256' }], outputs: [{ type: 'tuple', components: [{ name: 'owner', type: 'address' }, { name: 'fileHash', type: 'bytes32' }, { name: 'encryptionMetadataHash', type: 'bytes32' }, { name: 'storageNodesCommitment', type: 'bytes32' }, { name: 'fileSizeBytes', type: 'uint64' }, { name: 'createdAt', type: 'uint64' }, { name: 'expiresAt', type: 'uint64' }, { name: 'replicationFactor', type: 'uint8' }, { name: 'deletable', type: 'bool' }, { name: 'status', type: 'uint8' }, { name: 'payment', type: 'uint256' }] }] },
    { type: 'event', name: 'BlobCreated', inputs: [{ name: 'blobId', indexed: true, type: 'uint256' }, { name: 'owner', indexed: true, type: 'address' }, { name: 'fileHash', indexed: true, type: 'bytes32' }, { name: 'expiresAt', indexed: false, type: 'uint64' }, { name: 'payment', indexed: false, type: 'uint256' }] },
] as const

export const publicClient = createPublicClient({ chain: monadTestnet, transport: http(CONTRACT.RPC_URL) })


export type BlobInfo = { blobId: string; publicId: string | null; owner: string; fileHash: string; status: number; stored: boolean; createTxHash: string | null; activateTxHash: string | null }
export type OwnedBlob = BlobInfo & { contentType: string; contentLength: number; nodeUrls: string[] }
export type OnChainBlobMetadata = {
    owner: string
    fileHash: string
    encryptionMetadataHash: string
    storageNodesCommitment: string
    fileSizeBytes: string
    createdAt: string
    expiresAt: string
    replicationFactor: number
    deletable: boolean
    status: number
    payment: string
}

export const bytes32Hash = async (file: File | ArrayBuffer): Promise<Hex> => {
    const bytes = file instanceof File ? await file.arrayBuffer() : file
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return `0x${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}` as Hex
}

const authorizationMessage = (operation: 'upload' | 'download', blobId: string, nonce: string) =>
    `Mblob ${operation} authorization\nBlob ID: ${blobId}\nNonce: ${nonce}`

async function authorizedFetch(walletClient: NonNullable<ReturnType<typeof import('viem').createWalletClient>>, address: Address, operation: 'upload' | 'download', blobId: string, path: '' | '/upload' | '/download', init: RequestInit = {}) {
    const nonce = crypto.randomUUID()
    const signature = await walletClient.signMessage({ account: address, message: authorizationMessage(operation, blobId, nonce) })
    const headers = new Headers(init.headers)
    headers.set('x-mblob-address', address)
    headers.set('x-mblob-signature', signature)
    headers.set('x-mblob-nonce', nonce)
    return fetch(`${GATEWAY.BASE_URL}/v1/blobs/${blobId}${path}`, { ...init, headers })
}

export async function uploadBlob(walletClient: NonNullable<ReturnType<typeof import('viem').createWalletClient>>, address: Address, file: File) {
    const fileBytes = await file.arrayBuffer()
    const fileHash = await bytes32Hash(fileBytes)
    const quote = await publicClient.readContract({
        address: CONTRACT.REGISTRY_ADDRESS, abi: registryAbi, functionName: 'quote', args: [BigInt(file.size), 24n, 3, false],
        authorizationList: undefined
    })
    const createTxHash = await walletClient.writeContract({ account: address, chain: monadTestnet, address: CONTRACT.REGISTRY_ADDRESS, abi: registryAbi, functionName: 'createBlob', args: [fileHash, zeroHash, BigInt(file.size), 24n, 3, false], value: quote })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: createTxHash })
    const event = parseEventLogs({ abi: registryAbi, logs: receipt.logs, eventName: 'BlobCreated' })[0]
    const blobId = event?.args.blobId
    if (blobId === undefined) throw new Error('The payment transaction did not create a blob record.')

    const nonce = crypto.randomUUID()
    const signature = await walletClient.signMessage({ account: address, message: authorizationMessage('upload', blobId.toString(), nonce) })
    const headers = new Headers()
    headers.set('x-mblob-address', address)
    headers.set('x-mblob-signature', signature)
    headers.set('x-mblob-nonce', nonce)
    headers.set('x-create-tx-hash', createTxHash)
    headers.set('x-file-name', encodeURIComponent(file.name))

    // Keep using the bytes captured before wallet signing. Some mobile browsers/wallets
    // can lose access to the original File handle after the transaction/signature flow.
    const uploadBody = new FormData()
    uploadBody.set('file', new Blob([fileBytes], { type: file.type || 'application/octet-stream' }), file.name)
    const response = await fetch(`${GATEWAY.BASE_URL}/v1/blobs/${blobId.toString()}/upload`, { method: 'POST', body: uploadBody, headers })
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Upload failed')
    const uploaded = await response.json() as { publicId: string; transactionHash: string | null }
    return { blobId: blobId.toString(), publicId: uploaded.publicId, transactionHash: uploaded.transactionHash }
}

export async function getBlob(blobId: string) {
    const response = await fetch(`${GATEWAY.BASE_URL}/v1/blobs/${blobId}`)
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Unable to retrieve blob')
    return response.json() as Promise<BlobInfo>
}

export async function getWalletBlobs(address: Address) {
    const response = await fetch(`${GATEWAY.BASE_URL}/v1/wallets/${address}/blobs`)
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Unable to retrieve wallet blobs')
    return response.json() as Promise<{ owner: string; blobs: OwnedBlob[] }>
}

export async function getOnChainBlobMetadata(blobId: string): Promise<OnChainBlobMetadata> {
    if (!/^\d+$/.test(blobId)) throw new Error('On-chain metadata requires the numeric blob ID.')
    const blob = await publicClient.readContract({
        address: CONTRACT.REGISTRY_ADDRESS,
        abi: registryAbi,
        functionName: 'getBlob',
        args: [BigInt(blobId)],
    })
    return {
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
        payment: blob.payment.toString(),
    }
}

export async function downloadBlob(walletClient: NonNullable<ReturnType<typeof import('viem').createWalletClient>>, address: Address, blobId: string) {
    const response = await authorizedFetch(walletClient, address, 'download', blobId, '/download')
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Download failed')
    const file = await response.blob()
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `mblob-${blobId}`
    link.click()
    URL.revokeObjectURL(url)
}