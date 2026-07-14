# Mblob contract

`MblobRegistry` is the on-chain source of truth for storage pricing, payment, and blob metadata. It never stores file content, encryption keys, node URLs, or shard bytes.

## MVP contract flow

1. The client hashes and encrypts a file locally, then calculates `quote(...)`.
2. The client calls `createBlob(...)` and pays the exact native MON amount.
3. The gateway uploads encrypted data to storage nodes.
4. Once every node returns a receipt, the gateway calls `activateBlob(blobId, storageNodesCommitment)`.
5. At expiry, the cleanup worker deletes the shards and calls `markDeleted(blobId)`.

## Important choices

- `fileHash` should be the SHA-256 hash of the original file or encrypted payload; choose one convention and keep it consistent across client and server.
- `encryptionMetadataHash` commits to off-chain encryption metadata, never the encryption key itself.
- `storageNodesCommitment` is a hash of node IDs and upload receipts. The actual identifiers stay off-chain so node changes do not expose infrastructure details or consume extra gas.
- Payments are native MON for the MVP. ERC-20 payment support can be added after the upload flow works.

## Next setup step

Initialize a Foundry project in this folder, then add deployment and unit tests. The contract source is already located at `src/MblobRegistry.sol` so it matches Foundry's expected layout.
