import { useEffect } from 'react'
import type { OnChainBlobMetadata } from '@/lib/mblob'
import { formatUnixTimestamp } from '@/lib/utils'

const statusLabel = (status: number) => status === 1 ? 'Active' : status === 2 ? 'Deleted' : 'Pending'

export function OnChainMetadataModal({ metadata, onClose }: { metadata: OnChainBlobMetadata; onClose: () => void }) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    const rows = [
        ['Owner', metadata.owner],
        ['Status', `${statusLabel(metadata.status)} (${metadata.status})`],
        ['File hash', metadata.fileHash],
        ['Encryption metadata hash', metadata.encryptionMetadataHash],
        ['Storage nodes commitment', metadata.storageNodesCommitment],
        ['File size bytes', metadata.fileSizeBytes],
        ['Created at', formatUnixTimestamp(metadata.createdAt)],
        ['Expires at', metadata.expiresAt === '0' ? 'Permanent / no expiry' : formatUnixTimestamp(metadata.expiresAt)],
        ['Replication factor', String(metadata.replicationFactor)],
        ['Deletable', metadata.deletable ? 'Yes' : 'No'],
        ['Payment wei', metadata.payment],
    ] as const

    return <div onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }} className="fixed inset-0 z-50 bg-black/50 px-4 py-8 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="On-chain blob metadata">
        <div className="bg-white border border-black max-w-2xl w-full max-h-[85vh] overflow-auto">
            <div className="border-b border-black p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-mono text-neutral-400">MblobRegistry.getBlob()</p>
                    <h2 className="text-xl font-bold tracking-tight">On-chain Blob Metadata</h2>
                </div>
                <button onClick={onClose} className="border border-black px-3 py-1.5 text-sm hover:bg-neutral-100">Close</button>
            </div>
            <div className="divide-y divide-black">
                {rows.map(([label, value]) => <div key={label} className="p-4">
                    <p className="text-xs font-mono text-neutral-400 mb-1 uppercase">{label}</p>
                    <p className="text-sm font-mono break-all">{value}</p>
                </div>)}
            </div>
        </div>
    </div>
}
