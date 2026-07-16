/**
 * Format a byte size into a human-readable string.
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/** Format a Unix timestamp (in seconds) into a readable local date and time. */
export function formatUnixTimestamp(timestamp: string | number | bigint): string {
    try {
        const milliseconds = Number(BigInt(timestamp) * 1000n)
        const date = new Date(milliseconds)
        if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) return 'Invalid date'
        return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    } catch {
        return 'Invalid date'
    }
}

/**
 * Format wei into MON with up to 6 decimal places.
 */
export function formatMon(wei: bigint): string {
    const divisor = 10n ** 18n
    const whole = wei / divisor
    const fraction = wei % divisor
    const fractionStr = fraction.toString().padStart(18, '0').slice(0, 6).replace(/0+$/, '')
    return fractionStr ? `${whole}.${fractionStr} MON` : `${whole} MON`
}

/**
 * Shorten an address for display.
 */
export function shortenAddress(addr: string): string {
    if (addr.length < 10) return addr
    return addr.slice(0, 6) + '...' + addr.slice(-4)
}

/**
 * Build the contract `quote` function URL for cost estimation (read via RPC).
 */
export function quoteFunctionSignature(): string {
    // quote(uint64,uint64,uint8,bool)
    return '0x7c17b0e3'
}

/**
 * Contract ABI for the quote function
 */
export const quoteAbi = [
    {
        type: 'function',
        name: 'quote',
        inputs: [
            { name: 'fileSizeBytes', type: 'uint64', internalType: 'uint64' },
            { name: 'durationHours', type: 'uint64', internalType: 'uint64' },
            { name: 'replicationFactor', type: 'uint8', internalType: 'uint8' },
            { name: 'permanent', type: 'bool', internalType: 'bool' },
        ],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'createBlob',
        inputs: [
            { name: 'fileHash', type: 'bytes32', internalType: 'bytes32' },
            { name: 'encryptionMetadataHash', type: 'bytes32', internalType: 'bytes32' },
            { name: 'fileSizeBytes', type: 'uint64', internalType: 'uint64' },
            { name: 'durationHours', type: 'uint64', internalType: 'uint64' },
            { name: 'replicationFactor', type: 'uint8', internalType: 'uint8' },
            { name: 'permanent', type: 'bool', internalType: 'bool' },
        ],
        outputs: [{ name: 'blobId', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'payable',
    },
    {
        type: 'function',
        name: 'getBlob',
        inputs: [{ name: 'blobId', type: 'uint256', internalType: 'uint256' }],
        outputs: [
            {
                name: '',
                type: 'tuple',
                internalType: 'struct MblobRegistry.Blob',
                components: [
                    { name: 'owner', type: 'address' },
                    { name: 'fileHash', type: 'bytes32' },
                    { name: 'encryptionMetadataHash', type: 'bytes32' },
                    { name: 'storageNodesCommitment', type: 'bytes32' },
                    { name: 'fileSizeBytes', type: 'uint64' },
                    { name: 'createdAt', type: 'uint64' },
                    { name: 'expiresAt', type: 'uint64' },
                    { name: 'replicationFactor', type: 'uint8' },
                    { name: 'deletable', type: 'bool' },
                    { name: 'status', type: 'uint8' },
                    { name: 'payment', type: 'uint256' },
                ],
            },
        ],
        stateMutability: 'view',
    },
] as const
