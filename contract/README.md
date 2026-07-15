# Mblob contract

`MblobRegistry` is the on-chain source of truth for storage pricing, payment, and blob metadata. It never stores file content, encryption keys, node URLs, or encrypted file bytes.

## MVP contract flow

1. The client hashes and encrypts a file locally, then calculates `quote(...)`.
2. The client calls `createBlob(...)` and pays the exact native MON amount.
3. The gateway uploads encrypted data to storage nodes.
4. Once every node returns a receipt, the gateway calls `activateBlob(blobId, storageNodesCommitment)`.
5. At expiry, the cleanup worker deletes the replicas and calls `markDeleted(blobId)`.

## Important choices

- `fileHash` should be the SHA-256 hash of the original file or encrypted payload; choose one convention and keep it consistent across client and server.
- `encryptionMetadataHash` commits to off-chain encryption metadata, never the encryption key itself.
- `storageNodesCommitment` is a hash of node IDs and upload receipts. The actual identifiers stay off-chain so node changes do not expose infrastructure details or consume extra gas.
- Payments are native MON for the MVP. ERC-20 payment support can be added after the upload flow works.

## Run locally

Install [Foundry](https://getfoundry.sh), then run from this directory:

```powershell
forge test
```

The project includes focused tests in `test/MblobRegistry.t.sol` and a deployment script in `script/DeployMblob.s.sol`.

## Deploy to Monad

Set the environment values in your terminal (do not commit private keys), then broadcast with your Monad RPC URL:

```powershell
$env:MBLOB_GATEWAY_ADDRESS = "0x..."
$env:MBLOB_PRICE_PER_BYTE_HOUR_WEI = "1"
$env:MBLOB_MINIMUM_PRICE_WEI = "100000000000000"
$env:MBLOB_PERMANENT_STORAGE_MULTIPLIER = "1000"
$env:MBLOB_MAX_FILE_SIZE_BYTES = "104857600"
$env:MBLOB_MAX_DURATION_HOURS = "720"
$env:PRIVATE_KEY = "..."

forge script script/DeployMblob.s.sol:DeployMblob --rpc-url $env:MONAD_RPC_URL --broadcast
```
