import axios, { AxiosError } from 'axios'
import { createPublicClient, defineChain, http, parseEventLogs, zeroHash, type Address, type Hex } from 'viem'
import { CONTRACT, GATEWAY } from '@/lib/constants'

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
export type OwnedBlob = BlobInfo & { contentType: string; fileName: string; contentLength: number; nodeUrls: string[] }
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

const authorizationMessage = (operation: 'upload' | 'download' | 'delete', blobId: string, nonce: string) =>
    `Mblob ${operation} authorization\nBlob ID: ${blobId}\nNonce: ${nonce}`

const api = axios.create({
    baseURL: GATEWAY.BASE_URL,
})

function serverErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AxiosError) {
        const payload = error.response?.data
        if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') return payload.error
    }
    if (error instanceof Error) return error.message
    return fallback
}

async function responseErrorMessage(response: Response, fallback: string) {
    const payload = await response.json().catch(() => null)
    if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') return payload.error
    return fallback
}

async function authorizedFetch(walletClient: NonNullable<ReturnType<typeof import('viem').createWalletClient>>, address: Address, operation: 'upload' | 'download' | 'delete', blobId: string, path: '' | '/upload' | '/download', init: RequestInit = {}) {
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
        address: CONTRACT.REGISTRY_ADDRESS, 
        abi: registryAbi, 
        functionName: 'quote', 
        args: [BigInt(file.size), 24n, 3, false],
        authorizationList: undefined
    })
    const createTxHash = await walletClient.writeContract({
         account: address, 
         chain: monadTestnet, 
         address: CONTRACT.REGISTRY_ADDRESS, 
         abi: registryAbi, 
         functionName: 'createBlob', 
         args: [fileHash, zeroHash, BigInt(file.size), 24n, 3, false],
          value: quote
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: createTxHash })
    const registryLogs = receipt.logs.filter((log) => log.address.toLowerCase() === CONTRACT.REGISTRY_ADDRESS.toLowerCase())
    const event = parseEventLogs({ abi: registryAbi, logs: registryLogs, eventName: 'BlobCreated' })[0]
    const blobId = event?.args.blobId
    if (blobId === undefined) throw new Error('The payment transaction did not create a blob record.')

    const chainBlob = await publicClient.readContract({
        address: CONTRACT.REGISTRY_ADDRESS,
        abi: registryAbi,
        functionName: 'getBlob',
        args: [blobId],
    })
    if (chainBlob.fileHash.toLowerCase() !== fileHash.toLowerCase()) {
        throw new Error(`The created blob record hash does not match the selected file hash. Expected ${fileHash}, got ${chainBlob.fileHash}.`)
    }
    const uploadBody = new Blob([fileBytes], { type: file.type || 'application/octet-stream' })
    const response = await authorizedFetch(
        walletClient, 
        address, 
        'upload', 
        blobId.toString(),
        '/upload', {
        method: 'POST',
        body: uploadBody,
        headers: {
            'x-create-tx-hash': createTxHash,
            'x-file-hash': fileHash,
            'x-file-name': encodeURIComponent(file.name),
            'content-type': uploadBody.type,
        },
    })
    if (!response.ok) throw new Error(await responseErrorMessage(response, 'Upload failed'))

    const uploaded = await response.json() as { publicId: string; transactionHash: string | null }
    return { 
        blobId: blobId.toString(), 
        publicId: uploaded.publicId, 
        transactionHash: uploaded.transactionHash
     }
}

export async function getBlob(blobId: string) {
    try {
        const response = await api.get(`/v1/blobs/${encodeURIComponent(blobId)}`)
        return response.data as BlobInfo
    } catch (error) {
        throw new Error(serverErrorMessage(error, 'Lookup failed'))
    }
}

export async function getWalletBlobs(address: Address) {
    try {
        const response = await api.get(`/v1/wallets/${address}/blobs`)
        return response.data as { owner: string; blobs: OwnedBlob[] }
    } catch (error) {
        throw new Error(serverErrorMessage(error, 'Unable to load blobs'))
    }
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

export async function deleteBlob(walletClient: NonNullable<ReturnType<typeof import('viem').createWalletClient>>, address: Address, blobId: string) {
    const response = await authorizedFetch(walletClient, address, 'delete', blobId, '', { method: 'DELETE' })
    if (!response.ok) throw new Error(await responseErrorMessage(response, 'Delete failed'))
    return response.json() as Promise<{ blobId: string; status: string }>
}

function downloadFileName(response: Response, fallback: string) {
    const disposition = response.headers.get('content-disposition')
    const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    if (encoded) {
        try {
            return decodeURIComponent(encoded)
        } catch {
            // Fall back to the plain filename below.
        }
    }
    const plain = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
    return plain || fallback
}

export async function downloadBlob(walletClient: NonNullable<ReturnType<typeof import('viem').createWalletClient>>, address: Address, blobId: string) {
    const response = await authorizedFetch(walletClient, address, 'download', blobId, '/download')
    if (!response.ok) throw new Error(await responseErrorMessage(response, 'Download failed'))
    const file = await response.blob()
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadFileName(response, `mblob-${blobId}`)
    link.click()
    URL.revokeObjectURL(url)
}
