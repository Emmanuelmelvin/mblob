import { useRef, useState } from 'react'
import { CheckIcon, CopyIcon, Cross2Icon, ExternalLinkIcon, UploadIcon } from '@radix-ui/react-icons'
import { formatBytes } from '../lib/utils'
import { uploadBlob } from '../lib/mblob'
import { useWallet } from '../lib/wallet'
import { CONTRACT } from '../lib/constants'

type UploadStep = 'select' | 'paying' | 'uploading' | 'done' | 'error'

export function Upload() {
    const [file, setFile] = useState<File | null>(null)
    const [step, setStep] = useState<UploadStep>('select')
    const [blobId, setBlobId] = useState<string | null>(null)
    const [publicId, setPublicId] = useState<string | null>(null)
    const [transactionHash, setTransactionHash] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const { address, connect, walletClient } = useWallet()

    function selectFile(next: File | undefined) {
        if (!next) return
        setFile(next)
        setStep('select')
        setError(null)
    }

    async function handleUpload() {
        if (!file) return
        try {
            const connectedAddress = address ?? await connect()
            if (!walletClient) throw new Error('Wallet connection is not ready. Please click Upload again.')
            setError(null)
            setStep('paying')
            // The contract accepts the payment and creates a pending blob before bytes leave the browser.
            const result = await uploadBlob(walletClient, connectedAddress, file)
            setStep('uploading')
            setBlobId(result.blobId)
            setPublicId(result.publicId)
            setTransactionHash(result.transactionHash)
            setStep('done')
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Upload failed')
            setStep('error')
        }
    }

    return <div className="max-w-xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-black mb-2">Upload a Blob</h1>
            <p className="text-sm text-neutral-500">Select a file, approve the exact on-chain payment, then authorize the encrypted upload.</p>
        </div>

        {step === 'select' && <>
            <div onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]) }} onDragOver={(event) => event.preventDefault()} onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-black p-12 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input ref={inputRef} type="file" onChange={(event) => selectFile(event.target.files?.[0])} className="hidden" />
                <div className="flex flex-col items-center gap-3 text-center"><UploadIcon className="w-8 h-8 text-neutral-400" /><div><p className="text-sm font-medium text-black">Drop a file here or click to browse</p><p className="text-xs text-neutral-400 mt-1">Max 25 MB per blob</p></div></div>
            </div>
            {file && <div className="mt-6 border border-black p-4"><div className="flex justify-between gap-4"><div><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-neutral-400 mt-0.5">{formatBytes(file.size)}</p></div><button onClick={() => setFile(null)} aria-label="Clear selected file"><Cross2Icon /></button></div><button onClick={() => void handleUpload()} className="mt-4 w-full px-4 py-3 bg-black text-white text-sm font-medium hover:bg-neutral-800">Pay & Upload</button></div>}
        </>}

        {step === 'paying' && <Status message="Confirm the payment in your wallet, then wait for Monad to confirm the transaction." />}
        {step === 'uploading' && <Status message="Sign the upload authorization in your wallet. The gateway is encrypting and replicating your file." />}
        {step === 'done' && blobId && <div className="border border-black p-6 space-y-4"><div className="flex items-center gap-3"><CheckIcon className="w-5 h-5" /><p className="text-sm font-medium">Blob uploaded and activated</p></div><div className="border border-black p-3 bg-neutral-50"><p className="text-xs text-neutral-400 mb-1">BLOB ID — save this value</p><Copiable value={publicId!} /></div>{transactionHash && <div className="border border-black p-3 bg-neutral-50"><p className="text-xs text-neutral-400 mb-1">TRANSACTION HASH</p><TransactionHash value={transactionHash} /></div>}<button onClick={() => { setFile(null); setBlobId(null); setPublicId(null); setTransactionHash(null); setStep('select') }} className="w-full px-4 py-3 border border-black text-sm font-medium hover:bg-neutral-100">Upload another file</button></div>}
        {step === 'error' && <div className="border border-red-800 p-6 bg-red-50"><p className="text-sm font-medium text-red-800">Upload failed</p><p className="mt-1 text-xs text-red-700">{error}</p><button onClick={() => setStep('select')} className="mt-4 px-4 py-2 border border-red-800 text-sm text-red-800">Try again</button></div>}
    </div>
}

function Status({ message }: { message: string }) {
    return <div className="border border-black p-8 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin" /><p className="text-sm text-neutral-500">{message}</p></div></div>
}

function Copiable({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)
    async function copy() {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }
    return <div className="flex items-start gap-2"><div className="flex-1 min-w-0 truncate text-sm font-mono">{value}</div><button onClick={copy} aria-label="Copy" className="shrink-0 mt-0.5 text-neutral-400 hover:text-black transition-colors">{copied ? <span className="text-xs">Copied</span> : <CopyIcon className="w-4 h-4" />}</button></div>
}

function TransactionHash({ value }: { value: string }) {
    const explorerUrl = `${CONTRACT.EXPLORER_URL}/tx/${value}`
    return <div className="flex items-start gap-2"><div className="flex-1 min-w-0 truncate text-sm font-mono">{value}</div><a href={explorerUrl} target="_blank" rel="noopener noreferrer" aria-label="View on Monad explorer" className="shrink-0 mt-0.5 text-neutral-400 hover:text-black transition-colors"><ExternalLinkIcon className="w-4 h-4" /></a><CopiableButton value={value} /></div>
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