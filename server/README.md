# Mblob gateway

The gateway verifies a wallet signature and on-chain blob owner, encrypts the upload with a unique AES-256-GCM data key, replicates ciphertext to three storage nodes, and calls `activateBlob` on Monad only after replication succeeds.

## Local run

1. Copy `.env.example` to `.env` and replace every secret/value marked as a placeholder.
2. Run `npm install`.
3. Run `docker compose up --build` from the repository root.

The gateway is available at `http://localhost:5000`; storage nodes are internal Docker services.

## Wallet signature format

The client signs the exact plain-text message below and sends its address, nonce, and signature as headers:

```text
Mblob upload authorization
Blob ID: 1
Nonce: unique-random-value
```

Headers:

```text
x-mblob-address: 0x...
x-mblob-nonce: unique-random-value
x-mblob-signature: 0x...
```

Use `download` in place of `upload` for retrieval and metadata requests. Each nonce can be used only once and expires after ten minutes.

## Endpoints

- `POST /v1/blobs/:blobId/upload` — signed multipart request with a `file` field.
- `GET /v1/blobs/:blobId` — signed metadata request.
- `GET /v1/blobs/:blobId/download` — signed file retrieval.
- `GET /health` — gateway health check.

The server replicates full ciphertext to three nodes for the MVP. Erasure-coded storage can replace full-ciphertext replication later without changing the on-chain contract interface.
