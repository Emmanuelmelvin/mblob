import { Link } from 'wouter'
import { UploadIcon, DownloadIcon, LockClosedIcon, GlobeIcon } from '@radix-ui/react-icons'

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
        </div>
    )
}
