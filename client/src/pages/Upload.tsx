import React, { useState, useRef } from 'react'
import { UploadIcon, Cross2Icon, CheckIcon } from '@radix-ui/react-icons'
import { formatBytes } from '../lib/utils'

type UploadStep = 'select' | 'calculating' | 'pay' | 'uploading' | 'done' | 'error'

export function Upload() {
    const [file, setFile] = useState<File | null>(null)
    const [step, setStep] = useState<UploadStep>('select')
    const [blobId, setBlobId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [cost, setCost] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (f) {
            setFile(f)
            setError(null)
            setStep('select')
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        const f = e.dataTransfer.files?.[0]
        if (f) {
            setFile(f)
            setError(null)
            setStep('select')
        }
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
    }

    function clearFile() {
        setFile(null)
        setStep('select')
        setError(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    // Placeholder for wallet integration (future)
    async function handleUpload() {
        if (!file) return
        setStep('calculating')
        // Simulate cost calculation
        await new Promise((r) => setTimeout(r, 800))
        setCost('0.0052 MON')
        setStep('pay')
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-black mb-2">Upload a Blob</h1>
                <p className="text-sm text-neutral-500">
                    Select a file, pay the on-chain storage fee, and upload it to the Mblob network.
                </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8 text-xs font-mono text-neutral-400">
                {['Select', 'Calculate', 'Pay', 'Upload'].map((label, i) => {
                    const stepIndex = ['select', 'calculating', 'pay', 'uploading', 'done'].indexOf(step)
                    const isActive = i <= stepIndex
                    const isCurrent = i === stepIndex
                    return (
                        <React.Fragment key={label}>
                            {i > 0 && <span className="text-neutral-300">/</span>}
                            <span className={isCurrent ? 'text-black font-semibold' : isActive ? 'text-neutral-600' : ''}>
                                {label}
                            </span>
                        </React.Fragment>
                    )
                })}
            </div>

            {/* Drop zone / file selector */}
            {step === 'select' && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-black p-12 cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                    <input
                        ref={inputRef}
                        type="file"
                        onChange={handleFileSelected}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3 text-center">
                        <UploadIcon className="w-8 h-8 text-neutral-400" />
                        <div>
                            <p className="text-sm font-medium text-black">Drop a file here or click to browse</p>
                            <p className="text-xs text-neutral-400 mt-1">Max 100 MB per blob</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected file info */}
            {file && step === 'select' && (
                <div className="mt-6 border border-black p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">{file.name}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">{formatBytes(file.size)}</p>
                        </div>
                        <button
                            onClick={clearFile}
                            className="ml-4 p-1 text-neutral-400 hover:text-black transition-colors"
                        >
                            <Cross2Icon className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={handleUpload}
                        className="mt-4 w-full px-4 py-3 bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                        Calculate Storage Cost
                    </button>
                </div>
            )}

            {/* Calculating */}
            {step === 'calculating' && (
                <div className="border border-black p-8 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin" />
                        <p className="text-sm text-neutral-500">Calculating storage cost on-chain...</p>
                    </div>
                </div>
            )}

            {/* Pay step */}
            {step === 'pay' && cost && (
                <div className="border border-black p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-black">
                        <span className="text-sm text-neutral-500">Storage Cost</span>
                        <span className="text-lg font-semibold text-black font-mono">{cost}</span>
                    </div>
                    <div className="text-xs text-neutral-400 space-y-1">
                        <p>You will be asked to confirm a transaction in your wallet.</p>
                        <p>This creates a pending blob record on Monad and returns a Blob ID.</p>
                    </div>
                    <button
                        onClick={() => {
                            setStep('uploading')
                            // Simulate upload
                            setTimeout(() => {
                                setBlobId('42')
                                setStep('done')
                            }, 2000)
                        }}
                        className="w-full px-4 py-3 bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                        Pay & Upload
                    </button>
                </div>
            )}

            {/* Uploading */}
            {step === 'uploading' && (
                <div className="border border-black p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin" />
                        <p className="text-sm text-neutral-500">Encrypting, replicating, and activating blob...</p>
                    </div>
                </div>
            )}

            {/* Done */}
            {step === 'done' && blobId && (
                <div className="border border-black p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckIcon className="w-5 h-5 text-black" />
                        <p className="text-sm font-medium text-black">Blob uploaded successfully</p>
                    </div>
                    <div className="border border-black p-3 bg-neutral-50">
                        <p className="text-xs text-neutral-400 mb-1">Blob ID</p>
                        <p className="text-sm font-mono text-black">{blobId}</p>
                    </div>
                    <p className="text-xs text-neutral-400">
                        Save this Blob ID. You will need it to retrieve your file later.
                    </p>
                    <button
                        onClick={() => {
                            setFile(null)
                            setStep('select')
                            setBlobId(null)
                            setCost(null)
                            if (inputRef.current) inputRef.current.value = ''
                        }}
                        className="w-full px-4 py-3 border border-black text-sm font-medium text-black hover:bg-neutral-100 transition-colors"
                    >
                        Upload Another File
                    </button>
                </div>
            )}

            {/* Error */}
            {step === 'error' && error && (
                <div className="border border-black p-6 bg-red-50">
                    <p className="text-sm font-medium text-red-800 mb-1">Upload failed</p>
                    <p className="text-xs text-red-600">{error}</p>
                    <button
                        onClick={() => setStep('select')}
                        className="mt-4 px-4 py-2 border border-red-800 text-sm text-red-800 hover:bg-red-100 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    )
}