import { useState } from 'react'
import { CopyIcon, DownloadIcon, ExternalLinkIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { downloadBlob, getBlob } from '../lib/mblob'
import { useWallet } from '../lib/wallet'
import { CONTRACT } from '../lib/constants'

type BlobInfo = { blobId: string; publicId: string | null; owner: string; fileHash: string; status: number; stored: boolean; createTxHash: string | null; activateTxHash: string | null }

export function Retrieve() {
    const [blobId, setBlobId] = useState('')
    const [blob, setBlob] = useState<BlobInfo | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { address, connect, walletClient } = useWallet()

    async function withWallet(action: (client: NonNullable<typeof walletClient>, owner: NonNullable<typeof address>) => Promise<void>) {
        try {
            const owner = address ?? await connect()
            if (!walletClient) throw new Error('Wallet connection is not ready. Please try again.')
            setLoading(true); setError(null)
            await action(walletClient, owner)
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Request failed') } finally { setLoading(false) }
    }

    function lookup() {
        const id = blobId.trim()
        if (!id) { setError('Enter a Blob ID.'); return }
        setLoading(true); setError(null)
        getBlob(id)
            .then(setBlob)
            .catch((reason) => setError(reason instanceof Error ? reason.message : 'Lookup failed'))
            .finally(() => setLoading(false))
    }

    const displayId = blob?.publicId ?? blob?.blobId
    return <div className="max-w-xl mx-auto"><div className="mb-8"><h1 className="text-3xl font-bold tracking-tight mb-2">Retrieve a Blob</h1><p className="text-sm text-neutral-500">Enter a Blob ID to look it up. You only need to sign when downloading the file.</p></div><div className="border border-black flex"><input value={blobId} onChange={(event) => setBlobId(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && lookup()} placeholder="Enter Blob ID (e.g. mb1_...)" className="flex-1 px-4 py-3 text-sm outline-none font-mono" /><button onClick={lookup} disabled={loading || !blobId.trim()} className="px-5 py-3 bg-black text-white text-sm disabled:bg-neutral-300 flex items-center gap-2"><MagnifyingGlassIcon />Lookup</button></div>{loading && <p className="mt-6 text-sm text-neutral-500">Looking up blob metadata…</p>}{error && <div className="mt-6 border border-red-800 bg-red-50 p-4 text-sm text-red-800">{error}</div>}{blob && <div className="mt-6 border border-black divide-y divide-black"><div className="p-4 bg-neutral-50"><p className="text-xs font-mono text-neutral-400">BLOB ID</p><Copiable value={displayId!} /></div><div className="grid grid-cols-2 divide-x divide-black"><Info label="OWNER" value={blob.owner} /><Info label="STATUS" value={blob.status === 1 ? 'Active' : 'Pending'} /></div><Info label="FILE HASH (SHA-256 of original file)" value={blob.fileHash} />{blob.createTxHash && <Info label="CREATE TX HASH" value={blob.createTxHash} isTransactionHash />}{blob.activateTxHash && <Info label="ACTIVATE TX HASH" value={blob.activateTxHash} isTransactionHash />}<div className="p-4"><button onClick={() => void withWallet((client, owner) => downloadBlob(client, owner, displayId!))} disabled={loading || !blob.stored || blob.status !== 1} className="w-full px-4 py-3 bg-black text-white text-sm flex justify-center gap-2 disabled:bg-neutral-300"><DownloadIcon />Download original file</button>{!blob.stored && <p className="mt-2 text-xs text-neutral-500">This blob has not been uploaded to storage yet.</p>}</div></div>}</div>
}

function Info({ label, value, isTransactionHash }: { label: string; value: string; isTransactionHash?: boolean }) {
    return <div className="p-4"><p className="text-xs font-mono text-neutral-400 mb-1">{label}</p>{isTransactionHash ? <TransactionHash value={value} /> : <Copiable value={value} />}</div>
}

function Copiable({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)
    async function copy() {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }
    return <div className="flex items-start gap-2"><p className="text-sm font-mono break-all flex-1">{value}</p><button onClick={copy} aria-label="Copy" className="shrink-0 mt-0.5 text-neutral-400 hover:text-black transition-colors">{copied ? <span className="text-xs">Copied</span> : <CopyIcon className="w-4 h-4" />}</button></div>
}

function TransactionHash({ value }: { value: string }) {
    const explorerUrl = `${CONTRACT.EXPLORER_URL}/tx/${value}`
    return <div className="flex items-start gap-2"><p className="text-sm font-mono break-all flex-1">{value}</p><a href={explorerUrl} target="_blank" rel="noopener noreferrer" aria-label="View on Monad explorer" className="shrink-0 mt-0.5 text-neutral-400 hover:text-black transition-colors"><ExternalLinkIcon className="w-4 h-4" /></a><CopiableButton value={value} /></div>
}

function CopiableButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)
    async function copy() {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }
    return <button onClick={copy} aria-label="Copy" className="shrink-0 mt-0.5 text-neutral-400 hover:text-black transition-colors">{copied ? <span className="text-xs">Copied</span> : <CopyIcon className="w-4 h-4" />}</button>
}