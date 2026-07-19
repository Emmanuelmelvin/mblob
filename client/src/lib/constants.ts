export const CONTRACT = {
    RPC_URL: 'https://testnet-rpc.monad.xyz',
    REGISTRY_ADDRESS: '0xE01CB95C7f62831389b288b87770238D75C6C3ef' as `0x${string}`,
    CHAIN_ID: 10_143,
    EXPLORER_URL: 'https://testnet.monadexplorer.com',
} as const

export const GATEWAY = {
    BASE_URL: import.meta.env.DEV ? '' : '',
} as const