import React from 'react'
import { Link, useRoute } from 'wouter'
import { UploadIcon, DownloadIcon, HomeIcon, ReaderIcon } from '@radix-ui/react-icons'
import { useWallet } from '../lib/wallet'

const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/upload', label: 'Upload', icon: UploadIcon },
    { href: '/retrieve', label: 'Retrieve', icon: DownloadIcon },
    { href: '/docs', label: 'Docs', icon: ReaderIcon },
] as const

export function Layout({ children }: { children: React.ReactNode }) {
    const { address, connect } = useWallet()
    const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null
    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            {/* Header */}
            <header className="border-b border-black">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 no-underline text-black" aria-label="Mblob home">
                        <img src="/mblob.png" alt="Mblob" className="h-9 w-9 rounded-lg object-cover" />
                        <span className="text-lg font-semibold tracking-tight">mblob</span>
                    </Link>
                    <nav className="flex items-center gap-8">
                        {navItems.map((item) => {
                            const [isActive] = useRoute(item.href)
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 text-sm font-medium no-underline transition-colors ${isActive
                                        ? 'text-black'
                                        : 'text-neutral-400 hover:text-black'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                        <button
                            onClick={() => void connect().catch((error) => window.alert(error instanceof Error ? error.message : 'Unable to connect wallet'))}
                            className="border border-black px-3 py-1.5 text-xs font-mono font-medium hover:bg-neutral-100"
                        >
                            {shortAddress ?? 'Connect wallet'}
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-black">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between text-xs text-neutral-400">
                    <span>Mblob &mdash; Decentralized Blob Storage on Monad</span>
                    <span className="font-mono">v0.1.0</span>
                </div>
            </footer>
        </div>
    )
}
