export const CONTRACT = {
    RPC_URL: 'https://testnet-rpc.monad.xyz',
    REGISTRY_ADDRESS: '0xBe67Af35e0E46443F0c85209497a780143CE9e4B' as `0x${string}`,
    CHAIN_ID: 10_143,
    EXPLORER_URL: 'https://testnet.monadexplorer.com',
} as const

export const GATEWAY = {
    BASE_URL: import.meta.env.DEV ? '' : '',
} as const