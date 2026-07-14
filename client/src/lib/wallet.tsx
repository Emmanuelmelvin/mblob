import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createWalletClient, custom, getAddress, type Address } from 'viem'
import { monadTestnet } from './mblob'

type Eip1193Provider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on?: (event: string, listener: (...args: unknown[]) => void) => void
    removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

type WalletContextValue = {
    address: Address | null
    connect: () => Promise<Address>
    disconnect: () => void
    walletClient: ReturnType<typeof createWalletClient> | null
}

const WalletContext = createContext<WalletContextValue | null>(null)

function provider(): Eip1193Provider | null {
    return (window as Window & { ethereum?: Eip1193Provider }).ethereum ?? null
}

async function ensureMonad(wallet: Eip1193Provider) {
    const chainId = `0x${monadTestnet.id.toString(16)}`
    try {
        await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] })
    } catch (error) {
        if ((error as { code?: number }).code !== 4902) throw error
        await wallet.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId,
                chainName: monadTestnet.name,
                nativeCurrency: monadTestnet.nativeCurrency,
                rpcUrls: monadTestnet.rpcUrls.default.http,
            }],
        })
    }
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<Address | null>(null)
    const wallet = provider()
    const walletClient = useMemo(
        () => wallet ? createWalletClient({ chain: monadTestnet, transport: custom(wallet) }) : null,
        [wallet],
    )

    const connect = useCallback(async () => {
        if (!wallet) throw new Error('No browser wallet found. Install or unlock MetaMask, then try again.')
        await ensureMonad(wallet)
        const accounts = await wallet.request({ method: 'eth_requestAccounts' }) as string[]
        if (!accounts[0]) throw new Error('No wallet account was selected.')
        const selected = getAddress(accounts[0])
        setAddress(selected)
        return selected
    }, [wallet])

    const disconnect = useCallback(() => {
        setAddress(null)
    }, [])

    useEffect(() => {
        if (!wallet?.on) return
        const handleAccountsChanged = (accounts: unknown) => {
            const next = (accounts as string[])[0]
            setAddress(next ? getAddress(next) : null)
        }
        wallet.on('accountsChanged', handleAccountsChanged)
        return () => wallet.removeListener?.('accountsChanged', handleAccountsChanged)
    }, [wallet])

    return <WalletContext.Provider value={{ address, connect, disconnect, walletClient }}>{children}</WalletContext.Provider>
}

export function useWallet() {
    const value = useContext(WalletContext)
    if (!value) throw new Error('useWallet must be used within WalletProvider')
    return value
}