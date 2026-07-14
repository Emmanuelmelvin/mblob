import { Link } from 'wouter'
import { UploadIcon, DownloadIcon, LockClosedIcon, GlobeIcon } from '@radix-ui/react-icons'
import { CONTRACT } from '../lib/constants'

const features = [
    {
        icon: LockClosedIcon,
        title: 'Encrypted by Default',
        description: 'Files are encrypted with AES-256-GCM before leaving the gateway. Storage nodes never see the original plaintext.',
    },
    {
        icon: GlobeIcon,
        title: 'On-Chain Metadata',
        description: 'Payments, ownership, and file hashes are recorded immutably on Monad. The blockchain stores metadata only — never the file bytes.',
    },
    {
        icon: UploadIcon,
        title: 'Replicated Storage',
        description: 'Encrypted shards are distributed across three independent nodes for availability and redundancy.',
    },
]

export function Home() {
    return (
        <div className="space-y-16">
            {/* Hero */}
            <section className="pt-16 pb-8">
                <div className="max-w-2xl">
                    <h1 className="text-5xl font-bold tracking-tighter text-black mb-4">
                        Decentralized blob storage on Monad
                    </h1>
                    <p className="text-base text-neutral-500 leading-relaxed mb-8">
                        Upload encrypted files, pay on-chain via deterministic pricing, and retrieve your data
                        through a transparent, verifiable pipeline.
                    </p>
                    <div className="flex gap-4">
                        <Link
                            href="/upload"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium no-underline hover:bg-neutral-800 transition-colors"
                        >
                            <UploadIcon className="w-4 h-4" />
                            Upload a Blob
                        </Link>
                        <Link
                            href="/retrieve"
                            className="inline-flex items-center gap-2 px-6 py-3 border border-black text-sm font-medium no-underline text-black hover:bg-neutral-100 transition-colors"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Retrieve a Blob
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section>
                <div className="border-t border-black pt-10 mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-black mb-2">How it works</h2>
                    <p className="text-sm text-neutral-500">
                        Four steps from file selection to verifiable storage.
                    </p>
                </div>
                <ol className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-black divide-y md:divide-y-0 md:divide-x divide-black">
                    {[
                        ['Select & Pay', 'Choose a file. The client calculates the exact cost using the same on-chain pricing formula. You pay and create a pending blob record.'],
                        ['Upload', 'Sign an authorization message and send the file to the gateway. The backend verifies your payment and ownership.'],
                        ['Encrypt & Replicate', 'The gateway encrypts your file, splits it, and distributes shards across three storage nodes. Only then is the blob activated on-chain.'],
                        ['Retrieve', 'At any time before expiration, request your blob. The gateway fetches shards, reassembles, and decrypts the original file.'],
                    ].map(([step, detail], i) => (
                        <li key={i} className="p-6 flex flex-col">
                            <span className="text-xs font-mono text-neutral-400 mb-1">0{i + 1}</span>
                            <h3 className="text-sm font-semibold text-black mb-2">{step}</h3>
                            <p className="text-sm text-neutral-500 leading-relaxed">{detail}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Features */}
            <section className="pb-16">
                <div className="border-t border-black pt-10 mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-black mb-2">Why Mblob</h2>
                    <p className="text-sm text-neutral-500">
                        Built for transparency, security, and simplicity.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-black divide-y md:divide-y-0 md:divide-x divide-black">
                    {features.map((feature) => {
                        const Icon = feature.icon
                        return (
                            <div key={feature.title} className="p-6">
                                <Icon className="w-5 h-5 text-black mb-3" />
                                <h3 className="text-sm font-semibold text-black mb-2">{feature.title}</h3>
                                <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Links */}
            <section className="pb-16">
                <div className="border-t border-black pt-10">
                    <div className="flex flex-wrap gap-6">
                        <a
                            href="https://github.com/Emmanuelmelvin/mblob"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors no-underline"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                            Star on GitHub
                        </a>
                        <a
                            href="https://x.com/mercichidi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors no-underline"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            Created by @mercichidi
                        </a>
                    </div>
                    <p className="mt-4 text-xs text-neutral-400">
                        Built on Monad testnet (chain ID {CONTRACT.CHAIN_ID}). Contract:{' '}
                        <a
                            href={`${CONTRACT.EXPLORER_URL}/address/${CONTRACT.REGISTRY_ADDRESS}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-500 hover:text-black transition-colors"
                        >
                            {CONTRACT.REGISTRY_ADDRESS}
                        </a>
                    </p>
                </div>
            </section>
        </div>
    )
}