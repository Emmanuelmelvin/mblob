import { useEffect, useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, CopyIcon, DownloadIcon, ExternalLinkIcon, ReaderIcon } from '@radix-ui/react-icons'
import { downloadBlob, getOnChainBlobMetadata, getWalletBlobs, type OnChainBlobMetadata, type OwnedBlob } from '@/lib/mblob'
import { useWallet } from '@/lib/wallet'
import { formatBytes } from '@/lib/utils'
import { CONTRACT } from '@/lib/constants'
import { OnChainMetadataModal } from '@/components/OnChainMetadataModal'

export function MyBlobs() {
    const { address, connect, walletClient } = useWallet()
    const [blobs, setBlobs] = useState<OwnedBlob[]>([])
    const [expanded, setExpanded] = useState<string | null>(null)
    const [metadata, setMetadata] = useState<OnChainBlobMetadata | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function loadBlobs(nextAddress = address) {
        if (!nextAddress) return
        setLoading(true); setError(null)
        try {
            const result = await getWalletBlobs(nextAddress)
            setBlobs(result.blobs)
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Unable to load blobs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { void loadBlobs() }, [address])

    async function connectAndLoad() {
        const next = address ?? await connect()
        await loadBlobs(next)
    }

    async function showOnChain(blobId: string) {
        setError(null)
        try {
            setMetadata(await getOnChainBlobMetadata(blobId))
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Unable to retrieve on-chain metadata')
        }
    }

    async function download(publicId: string) {
        try {
            const owner = address ?? await connect()
            if (!walletClient) throw new Error('Wallet connection is not ready. Please try again.')
            await downloadBlob(walletClient, owner, publicId)
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Download failed')
        }
    }

    return <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-black mb-2">My Blobs</h1>
                <p className="text-sm text-neutral-500">List blobs stored by the connected wallet, inspect contract metadata, and download owned files.</p>
            </div>
            {address ? <button onClick={() => void loadBlobs()} className="border border-black px-4 py-2 text-sm hover:bg-neutral-100">Refresh</button> : <button onClick={() => void connectAndLoad()} className="bg-black text-white px-4 py-2 text-sm hover:bg-neutral-800">Connect wallet</button>}
        </div>

        {address && <p className="mb-4 text-xs font-mono text-neutral-400 break-all">Connected wallet: {address}</p>}
        {loading && <p className="text-sm text-neutral-500">Loading your blobs…</p>}
        {error && <div className="mb-6 border border-red-800 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {address && !loading && blobs.length === 0 && <div className="border border-black p-8 text-center text-sm text-neutral-500">No stored blobs were found for this wallet.</div>}

        <div className="space-y-4">
            {blobs.map((blob) => {
                const displayId = blob.publicId ?? blob.blobId
                const isOpen = expanded === blob.blobId
                return <div key={blob.blobId} className="border border-black">
                    <div className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-2 min-w-0">
                            <button onClick={() => setExpanded(isOpen ? null : blob.blobId)} className="flex items-start gap-2 text-left min-w-0">
                                <span className="mt-0.5">{isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}</span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold">Blob #{blob.blobId}</span>
                                    <span className="block text-xs font-mono text-neutral-500 break-all">{displayId}</span>
                                </span>
                            </button>
                            <CopyBlobId value={displayId} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={`${CONTRACT.EXPLORER_URL}/tx/${blob.createTxHash ?? blob.activateTxHash ?? ''}`} target="_blank" rel="noopener noreferrer" className="border border-black px-3 py-2 text-xs hover:bg-neutral-100 flex items-center gap-1"><ExternalLinkIcon />Explorer</a>
                            <button onClick={() => void showOnChain(blob.blobId)} className="border border-black px-3 py-2 text-xs hover:bg-neutral-100 flex items-center gap-1"><ReaderIcon />View on-chain metadata</button>
                            <button onClick={() => void download(displayId)} className="bg-black text-white px-3 py-2 text-xs hover:bg-neutral-800 flex items-center gap-1"><DownloadIcon />Download</button>
                        </div>
                    </div>
                    {isOpen && <div className="border-t border-black divide-y divide-black bg-neutral-50">
                        <Info label="Owner" value={blob.owner} />
                        <Info label="Status" value={blob.status === 1 ? 'Active' : blob.status === 2 ? 'Deleted' : 'Pending'} />
                        <Info label="Stored" value={blob.stored ? 'Yes' : 'No'} />
                        <Info label="File hash" value={blob.fileHash} />
                        <Info label="Content" value={`${blob.contentType} · ${formatBytes(blob.contentLength)}`} />
                        <Info label="Replicated node URLs" value={blob.nodeUrls.join(', ')} />
                        <Info label="Create tx hash" value={blob.createTxHash ?? 'Not recorded'} />
                        <Info label="Activate tx hash" value={blob.activateTxHash ?? 'Not recorded'} />
                    </div>}
                </div>
            })}
        </div>
        {metadata && <OnChainMetadataModal metadata={metadata} onClose={() => setMetadata(null)} />}
    </div>
}

function CopyBlobId({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)

    async function copy() {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
    }

    return <button onClick={() => void copy()} aria-label="Copy blob ID" title="Copy blob ID" className="mt-0.5 shrink-0 text-neutral-400 hover:text-black transition-colors">
        {copied ? <span className="text-xs text-black">Copied</span> : <CopyIcon className="w-4 h-4" />}
    </button>
}

function Info({ label, value }: { label: string; value: string }) {
    return <div className="p-4"><p className="text-xs font-mono text-neutral-400 mb-1 uppercase">{label}</p><p className="text-sm font-mono break-all">{value}</p></div>
}
