import React, { useState } from 'react'
import { Link, useRoute } from 'wouter'
import { UploadIcon, DownloadIcon, HomeIcon, ReaderIcon, ExitIcon, HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons'
import { useWallet } from '../lib/wallet'

const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/upload', label: 'Upload', icon: UploadIcon },
    { href: '/retrieve', label: 'Retrieve', icon: DownloadIcon },
    { href: '/docs', label: 'Docs', icon: ReaderIcon },
] as const

export function Layout({ children }: { children: React.ReactNode }) {
    const { address, connect, disconnect } = useWallet()
    const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            {/* Header */}
            <header className="border-b border-black">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 no-underline text-black" aria-label="Mblob home">
                        <img src="/mblob.png" alt="Mblob" className="h-9 w-9 rounded-lg object-cover" />
                        <span className="text-lg font-semibold tracking-tight">mblob</span>
                    </Link>

                    {/* Desktop navigation */}
                    <div className="hidden md:flex items-center gap-8">
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
                        {address ? (
                            <div className="flex items-center gap-2">
                                <span className="border border-black px-3 py-1.5 text-xs font-mono font-medium">{shortAddress}</span>
                                <button
                                    onClick={disconnect}
                                    aria-label="Disconnect wallet"
                                    className="border border-black px-2 py-1.5 text-xs font-mono font-medium hover:bg-neutral-100 flex items-center gap-1"
                                >
                                    <ExitIcon className="w-3.5 h-3.5" />
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => void connect().catch((error) => window.alert(error instanceof Error ? error.message : 'Unable to connect wallet'))}
                                className="border border-black px-3 py-1.5 text-xs font-mono font-medium hover:bg-neutral-100"
                            >
                                Connect wallet
                            </button>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle navigation menu"
                        className="md:hidden border border-black p-2"
                    >
                        {menuOpen ? <Cross1Icon className="w-4 h-4" /> : <HamburgerMenuIcon className="w-4 h-4" />}
                    </button>
                </div>

                {/* Mobile dropdown */}
                {menuOpen && (
                    <div className="md:hidden border-t border-black bg-white">
                        <div className="px-6 py-4 flex flex-col gap-3">
                            {navItems.map((item) => {
                                const [isActive] = useRoute(item.href)
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`flex items-center gap-2 text-sm font-medium no-underline transition-colors ${isActive
                                            ? 'text-black'
                                            : 'text-neutral-400 hover:text-black'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                            <hr className="border-black" />
                            {address ? (
                                <div className="flex flex-col gap-2">
                                    <span className="border border-black px-3 py-1.5 text-xs font-mono font-medium text-center">{shortAddress}</span>
                                    <button
                                        onClick={() => { disconnect(); setMenuOpen(false) }}
                                        className="border border-black px-3 py-1.5 text-xs font-mono font-medium hover:bg-neutral-100 flex items-center justify-center gap-1"
                                    >
                                        <ExitIcon className="w-3.5 h-3.5" />
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { void connect().catch((error) => window.alert(error instanceof Error ? error.message : 'Unable to connect wallet')); setMenuOpen(false) }}
                                    className="border border-black px-3 py-1.5 text-xs font-mono font-medium hover:bg-neutral-100"
                                >
                                    Connect wallet
                                </button>
                            )}
                        </div>
                    </div>
                )}
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