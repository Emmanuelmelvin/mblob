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