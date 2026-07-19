export const CONTRACT = {
    RPC_URL: 'https://testnet-rpc.monad.xyz',
    REGISTRY_ADDRESS: '0xd752eb79D2b12436A319dEeeF69407425cbe54a9' as `0x${string}`,
    CHAIN_ID: 10_143,
    EXPLORER_URL: 'https://testnet.monadexplorer.com',
} as const

export const GATEWAY = {
    BASE_URL: import.meta.env.DEV ? '' : '',
} as const