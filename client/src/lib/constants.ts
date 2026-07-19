export const CONTRACT = {
    RPC_URL: 'https://testnet-rpc.monad.xyz',
    REGISTRY_ADDRESS: '0x9A1472d3117989D35FB53162C603A9509Bc06665' as `0x${string}`,
    CHAIN_ID: 10_143,
    EXPLORER_URL: 'https://testnet.monadexplorer.com',
} as const

export const GATEWAY = {
    BASE_URL: import.meta.env.DEV ? '' : '',
} as const