import { CONTRACT } from '../lib/constants'

export function Docs() {
    return (
        <div className="max-w-2xl mx-auto space-y-10">
            <section>
                <h1 className="text-3xl font-bold tracking-tight text-black mb-3">Mblob Docs</h1>
                <p className="text-sm text-neutral-500 leading-relaxed">
                    Decentralized blob storage on Monad. Files are encrypted before they leave the browser, sharded across
                    three independent storage nodes, and verified on-chain via the MblobRegistry smart contract.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Architecture</h2>
                <div className="space-y-3 border border-black divide-y divide-black">
                    {[
                        ['Client', 'React + Vite + viem. Users connect their wallet, pay on-chain via createBlob(), then upload the encrypted file to the gateway.'],
                        ['Gateway', 'Hono.js server that orchestrates encryption (AES-256-GCM), replication to storage nodes, and on-chain activation. Stores metadata in PostgreSQL.'],
                        ['Storage Nodes', 'Three independent nodes that hold encrypted shards. They never see the original plaintext or encryption keys.'],
                        ['Blockchain', `MblobRegistry contract on Monad testnet (chain ID ${CONTRACT.CHAIN_ID}). Stores owner, file hash (SHA-256), status, and storage commitment — never the file bytes.`],
                    ].map(([title, desc]) => (
                        <div key={title} className="p-4">
                            <p className="text-xs font-mono text-neutral-400 mb-1">{title}</p>
                            <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Running Locally</h2>

                <div className="border border-black divide-y divide-black">
                    <div className="p-4">
                        <p className="text-xs font-mono text-neutral-400 mb-2">Prerequisites</p>
                        <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
                            <li><a href="https://getfoundry.sh" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-black">Foundry</a> (forge, cast, anvil)</li>
                            <li>Docker + Docker Compose</li>
                            <li>A browser wallet with Monad testnet added (e.g. MetaMask)</li>
                            <li>Some test MON from a Monad testnet faucet</li>
                        </ul>
                    </div>

                    <div className="p-4">
                        <p className="text-xs font-mono text-neutral-400 mb-2">1. Smart Contract</p>
                        <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                            Deploy the MblobRegistry contract to Monad testnet. From the <code className="text-xs bg-neutral-100 px-1">contract/</code> directory:
                        </p>
                        <pre className="bg-neutral-50 border border-black p-3 text-xs font-mono overflow-x-auto mb-2">
                            {`# Set environment variables (do not commit)
$env:MBLOB_GATEWAY_ADDRESS = "0xYourGatewayAddress"
$env:MBLOB_PRICE_PER_BYTE_HOUR_WEI = "1"
$env:MBLOB_MINIMUM_PRICE_WEI = "100000000000000"
$env:MBLOB_PERMANENT_STORAGE_MULTIPLIER = "1000"
$env:MBLOB_MAX_FILE_SIZE_BYTES = "104857600"
$env:MBLOB_MAX_DURATION_HOURS = "720"
$env:PRIVATE_KEY = "0xYourDeployerPrivateKey"
$env:MONAD_RPC_URL = "https://testnet-rpc.monad.xyz"

# Run tests first
forge test

# Deploy
forge script script/DeployMblob.s.sol:DeployMblob --rpc-url $env:MONAD_RPC_URL --broadcast`}
                        </pre>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            After deployment, note the deployed contract address. You will need it for the server <code className="text-xs bg-neutral-100 px-1">.env</code>.
                        </p>
                    </div>

                    <div className="p-4">
                        <p className="text-xs font-mono text-neutral-400 mb-2">2. Server & Storage Nodes</p>
                        <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                            Copy <code className="text-xs bg-neutral-100 px-1">server/.env.example</code> to <code className="text-xs bg-neutral-100 px-1">server/.env</code> and fill in all values:
                        </p>
                        <pre className="bg-neutral-50 border border-black p-3 text-xs font-mono overflow-x-auto mb-2">
                            {`PORT=3000
DATABASE_URL=postgres://mblob:mblob@postgres:5432/mblob
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MBLOB_REGISTRY_ADDRESS=0xDeployedContractAddress
GATEWAY_PRIVATE_KEY=0x...
DATA_ENCRYPTION_KEY=  (generate with: openssl rand -base64 32)
STORAGE_NODE_URLS=http://storage-node-1:4001,http://storage-node-2:4002,http://storage-node-3:4003
STORAGE_NODE_TOKEN=replace-with-a-long-random-token
MAX_UPLOAD_BYTES=26214400`}
                        </pre>
                        <p className="text-sm text-neutral-600 leading-relaxed mb-1 font-semibold">Environment variables explained:</p>
                        <ul className="text-xs text-neutral-500 space-y-1 list-disc list-inside mb-3">
                            <li><strong>DATABASE_URL</strong> — PostgreSQL connection. In Docker this points to the <code className="text-xs bg-neutral-100 px-1">postgres</code> service.</li>
                            <li><strong>MONAD_RPC_URL</strong> — RPC endpoint for Monad testnet.</li>
                            <li><strong>MBLOB_REGISTRY_ADDRESS</strong> — The deployed MblobRegistry contract address from step 1.</li>
                            <li><strong>GATEWAY_PRIVATE_KEY</strong> — Private key of the gateway wallet. This is the address that calls <code className="text-xs bg-neutral-100 px-1">activateBlob()</code>. Must match the <code className="text-xs bg-neutral-100 px-1">gateway</code> address used during contract deployment.</li>
                            <li><strong>DATA_ENCRYPTION_KEY</strong> — A 32-byte base64-encoded key for encrypting per-file data keys at rest. Generate with <code className="text-xs bg-neutral-100 px-1">openssl rand -base64 32</code>.</li>
                            <li><strong>STORAGE_NODE_URLS</strong> — Comma-separated URLs of the three storage nodes. In Docker they are internal service names.</li>
                            <li><strong>STORAGE_NODE_TOKEN</strong> — Shared secret that storage nodes use to authenticate internal requests from the gateway. Must be at least 24 characters.</li>
                        </ul>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                            Then from the repository root, run everything with Docker:
                        </p>
                        <pre className="bg-neutral-50 border border-black p-3 text-xs font-mono overflow-x-auto mt-2">
                            {`docker compose up --build`}
                        </pre>
                        <p className="text-sm text-neutral-500 leading-relaxed mt-2">
                            This starts: PostgreSQL, the gateway (port 3000), three storage nodes (internal ports 4001-4003), and the client (port 8080).
                        </p>
                    </div>

                    <div className="p-4">
                        <p className="text-xs font-mono text-neutral-400 mb-2">3. Client</p>
                        <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                            The client is served by Nginx inside Docker. Open <code className="text-xs bg-neutral-100 px-1">http://localhost:8080</code> in your browser.
                        </p>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                            For development with hot-reload, you can run the client separately:
                        </p>
                        <pre className="bg-neutral-50 border border-black p-3 text-xs font-mono overflow-x-auto mt-2">
                            {`cd client
npm install
npm run dev`}
                        </pre>
                        <p className="text-sm text-neutral-500 leading-relaxed mt-2">
                            Make sure the gateway is running on port 3000. The client proxies API requests to it via Vite's proxy configuration.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Upload Flow</h2>
                <ol className="border border-black divide-y divide-black">
                    {[
                        ['Select & Hash', 'Select a file. The client computes its SHA-256 hash (bytes32).'],
                        ['Pay On-Chain', 'Call createBlob() on the MblobRegistry contract. The exact cost is calculated via the quote() function. This creates a pending blob record (status=0) and emits a BlobCreated event containing the blobId.'],
                        ['Sign & Upload', 'Sign an authorization message and send the file to the gateway via multipart POST. Also send the create transaction hash as the x-create-tx-hash header.'],
                        ['Verify', 'Gateway checks that the wallet owns the pending blob on-chain and that the file hash matches the on-chain record.'],
                        ['Encrypt', 'Gateway encrypts the file with a random AES-256-GCM key. The key is wrapped (encrypted with the gateway key) and stored alongside the metadata.'],
                        ['Replicate', 'Gateway splits the encrypted data and distributes it across 3 storage nodes.'],
                        ['Activate', 'Gateway calls activateBlob(blobId, nodesCommitment) on-chain to mark the blob as active (status=1). This transaction hash is the activateTxHash.'],
                        ['Store & Return', 'Gateway saves all metadata (public ID, hashes, transaction hashes, node URLs) to PostgreSQL and returns the results to the user.'],
                    ].map(([step, detail], i) => (
                        <li key={i} className="p-4 flex gap-4">
                            <span className="text-xs font-mono text-neutral-400 shrink-0 w-6">0{i + 1}</span>
                            <div>
                                <p className="text-sm font-semibold text-black mb-1">{step}</p>
                                <p className="text-xs text-neutral-500 leading-relaxed">{detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Retrieve Flow</h2>
                <ol className="border border-black divide-y divide-black">
                    {[
                        ['Lookup', 'Enter a Blob ID (numeric or public ID mb1_...). The gateway fetches metadata — no authentication needed.'],
                        ['Review', 'See the owner, status, file hash (verify against your local copy), and both transaction hashes.'],
                        ['Sign to Download', 'To get the original file, sign a download authorization message. The gateway verifies on-chain ownership and that the blob is active.'],
                        ['Fetch & Decrypt', 'Gateway retrieves encrypted shards from the storage nodes, reassembles, and decrypts using the stored wrapped data key.'],
                        ['Integrity Check', 'Gateway recomputes SHA-256 of the decrypted file and compares with the on-chain file hash. If they match, the file is returned as a download.'],
                    ].map(([step, detail], i) => (
                        <li key={i} className="p-4 flex gap-4">
                            <span className="text-xs font-mono text-neutral-400 shrink-0 w-6">0{i + 1}</span>
                            <div>
                                <p className="text-sm font-semibold text-black mb-1">{step}</p>
                                <p className="text-xs text-neutral-500 leading-relaxed">{detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">API Endpoints</h2>
                <div className="space-y-4 border border-black divide-y divide-black">
                    {[
                        ['GET /health', 'Health check. Returns service status.'],
                        ['POST /v1/blobs/:blobId/upload', 'Upload a file. Requires x-mblob-address, x-mblob-signature, x-mblob-nonce, x-create-tx-hash headers. Body: multipart form with "file" field.'],
                        ['GET /v1/blobs/:blobId', 'Look up a blob. No authentication. Supports numeric ID or public ID (mb1_...).'],
                        ['GET /v1/blobs/:blobId/download', 'Download the original file. Requires wallet signature headers. Verifies on-chain ownership.'],
                    ].map(([method, desc]) => (
                        <div key={method} className="p-4">
                            <p className="text-xs font-mono text-neutral-400 mb-1">{method}</p>
                            <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Wallet Signature Format</h2>
                <div className="border border-black p-4">
                    <p className="text-sm text-neutral-600 leading-relaxed mb-2">
                        The client signs a plain-text message and sends the address, nonce, and signature as HTTP headers:
                    </p>
                    <pre className="bg-neutral-50 border border-black p-3 text-xs font-mono overflow-x-auto mb-3">
                        {`Mblob upload authorization
Blob ID: 1
Nonce: unique-random-value`}
                    </pre>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-2">Headers:</p>
                    <pre className="bg-neutral-50 border border-black p-3 text-xs font-mono overflow-x-auto mb-2">
                        {`x-mblob-address: 0xYourAddress
x-mblob-nonce: unique-random-value
x-mblob-signature: 0xSignedMessage
x-create-tx-hash: 0xCreateBlobTransactionHash`}
                    </pre>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                        Use <code className="text-xs bg-neutral-100 px-1">download</code> in place of <code className="text-xs bg-neutral-100 px-1">upload</code> for download authorization. Each nonce can be used only once and expires after ten minutes.
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Flow Diagram</h2>
                <div className="border border-black p-4">
                    <pre className="text-xs font-mono leading-relaxed overflow-x-auto">
                        {`User Browser              Gateway                 Storage Nodes           Monad
    |                       |                          |                     |
    |-- createBlob() -------|--------------------------|-------------------->|
    |  (pay MON, get blobId) |                          |                     |
    |                       |                          |                     |
    |-- upload(file) ------>|                          |                     |
    |  (signed auth)        |                          |                     |
    |                       |-- verify ownership ----->|-------------------->|
    |                       |-- encrypt & replicate -->|                     |
    |                       |                          |-- store shard ----->|
    |                       |<-- receipt --------------|                     |
    |                       |-- activateBlob() ------->|-------------------->|
    |<-- { publicId,        |                          |                     |
    |      txHashes } ------|                          |                     |
    |                       |                          |                     |
    |-- lookup(blobId) ---->|                          |                     |
    |<-- { metadata } ------|                          |                     |
    |                       |                          |                     |
    |-- download(blobId) -->|                          |                     |
    |  (signed auth)        |-- verify ownership ----->|-------------------->|
    |                       |-- fetch shard ---------->|                     |
    |                       |<-- ciphertext -----------|                     |
    |                       |-- decrypt & verify ------|                     |
    |<-- original file -----|                          |                     |`}
                    </pre>
                </div>
            </section>

            <section className="pb-16">
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Links</h2>
                <div className="flex flex-wrap gap-6 border border-black p-4">
                    <a href="https://github.com/Emmanuelmelvin/mblob" target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 hover:text-black transition-colors no-underline">
                        ⭐ GitHub — Star the project
                    </a>
                    <a href="https://x.com/mercichidi" target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 hover:text-black transition-colors no-underline">
                        𝕏 Created by @mercichidi
                    </a>
                    <a href={`${CONTRACT.EXPLORER_URL}/address/${CONTRACT.REGISTRY_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 hover:text-black transition-colors no-underline">
                        🔍 View contract on explorer
                    </a>
                </div>
            </section>
        </div>
    )
}