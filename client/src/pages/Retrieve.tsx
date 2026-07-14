import { useState } from 'react'
import { DownloadIcon, MagnifyingGlassIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons'

type RetrieveStep = 'idle' | 'fetching' | 'done' | 'error'

export function Retrieve() {
    const [blobId, setBlobId] = useState('')
    const [step, setStep] = useState<RetrieveStep>('idle')
    const [error, setError] = useState<string | null>(null)
    const [blobInfo, setBlobInfo] = useState<{
        blobId: string
        owner: string
        fileHash: string
        status: string
        size: string
    } | null>(null)

    async function handleLookup() {
        const id = blobId.trim()
        if (!id) return
        setStep('fetching')
        setError(null)

        // Simulate a lookup for now
        await new Promise((r) => setTimeout(r, 1200))

        // Mock response
        setBlobInfo({
            blobId: id,
            owner: '0x742d...44a8',
            fileHash: '0x1a2b...3c4d',
            status: 'Active',
            size: '2.4 MB',
        })
        setStep('done')
    }

    function handleDownload() {
        // Placeholder for actual download flow (future)
        setStep('fetching')
        setTimeout(() => {
            setStep('done')
        }, 1500)
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-black mb-2">Retrieve a Blob</h1>
                <p className="text-sm text-neutral-500">
                    Enter a Blob ID to look up metadata and download the original file.
                </p>
            </div>

            {/* Search */}
            <div className="border border-black">
                <div className="flex items-stretch">
                    <input
                        type="text"
                        value={blobId}
                        onChange={(e) => setBlobId(e.target.value)}
                        placeholder="Enter Blob ID (e.g. 42)"
                        className="flex-1 px-4 py-3 text-sm border-0 outline-none text-black placeholder-neutral-400 font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    />
                    <button
                        onClick={handleLookup}
                        disabled={step === 'fetching' || !blobId.trim()}
                        className="px-5 py-3 bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                        Lookup
                    </button>
                </div>
            </div>

            {/* Fetching */}
            {step === 'fetching' && (
                <div className="border border-black p-8 text-center mt-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin" />
                        <p className="text-sm text-neutral-500">Fetching blob metadata from Monad...</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {step === 'done' && blobInfo && (
                <div className="mt-6 space-y-6">
                    {/* Metadata card */}
                    <div className="border border-black divide-y divide-black">
                        <div className="p-4 bg-neutral-50">
                            <p className="text-xs font-mono text-neutral-400 mb-1">BLOB ID</p>
                            <p className="text-sm font-mono text-black">{blobInfo.blobId}</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-black">
                            <div className="p-4">
                                <p className="text-xs font-mono text-neutral-400 mb-1">OWNER</p>
                                <p className="text-sm font-mono text-black">{blobInfo.owner}</p>
                            </div>
                            <div className="p-4">
                                <p className="text-xs font-mono text-neutral-400 mb-1">STATUS</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-black rounded-none" />
                                    <p className="text-sm font-mono text-black">{blobInfo.status}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-black">
                            <div className="p-4">
                                <p className="text-xs font-mono text-neutral-400 mb-1">FILE HASH</p>
                                <p className="text-sm font-mono text-black truncate">{blobInfo.fileHash}</p>
                            </div>
                            <div className="p-4">
                                <p className="text-xs font-mono text-neutral-400 mb-1">FILE SIZE</p>
                                <p className="text-sm font-mono text-black">{blobInfo.size}</p>
                            </div>
                        </div>
                    </div>

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="w-full px-4 py-3 bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download File
                    </button>

                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <CheckIcon className="w-3 h-3" />
                        <span>You must be the blob owner to download. Wallet verification is required.</span>
                    </div>
                </div>
            )}

            {/* Error */}
            {step === 'error' && error && (
                <div className="border border-black p-4 bg-red-50 mt-6">
                    <div className="flex items-start gap-2">
                        <Cross2Icon className="w-4 h-4 text-red-800 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800 mb-1">Lookup failed</p>
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStep('idle')}
                        className="mt-3 px-4 py-2 border border-red-800 text-xs text-red-800 hover:bg-red-100 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Info text when idle */}
            {step === 'idle' && (
                <div className="mt-8 border border-black p-4">
                    <p className="text-xs font-semibold text-black mb-2">About Retrieval</p>
                    <ul className="text-xs text-neutral-500 space-y-1.5">
                        <li>• Blob IDs are returned to you after a successful upload.</li>
                        <li>• Only the original owner can download a blob.</li>
                        <li>• The gateway verifies ownership via wallet signature.</li>
                        <li>• Expired or deleted blobs cannot be retrieved.</li>
                    </ul>
                </div>
            )}
        </div>
    )
}
