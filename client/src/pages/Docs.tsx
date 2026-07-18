import { CONTRACT } from '@/lib/constants'

export function Docs() {
    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <section>
                <h1 className="text-3xl font-bold tracking-tight text-black mb-3">Mblob Docs</h1>
                <p className="text-sm text-neutral-500 leading-relaxed">
                    Mblob stores user files through a Monad registry contract, a gateway, PostgreSQL metadata, and three storage nodes. The current implementation hashes files in the browser, accepts payment on-chain, encrypts files in the gateway, and replicates the full encrypted ciphertext to every configured storage node.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Current Architecture</h2>
                <div className="space-y-3 border border-black divide-y divide-black">
                    {[
                        ['Client', 'React + Vite + viem. Users connect a wallet, hash the original file, pay with createBlob(), sign upload/download authorizations, and call the gateway.'],
                        ['Gateway', 'Hono.js server. It verifies signatures and nonces, checks on-chain ownership/status, receives the plaintext upload, validates the hash, encrypts with AES-256-GCM, replicates full ciphertext, activates on-chain, and stores metadata.'],
                        ['Storage Nodes', 'Three internal nodes store complete encrypted replicas. They receive ciphertext only and are authenticated with a shared internal storage token.'],
                        ['PostgreSQL', 'Stores off-chain metadata: public ID, owner, file hash, wrapped data key, content details, node URLs, and transaction hashes.'],
                        ['Blockchain', `MblobRegistry on Monad testnet (chain ID ${CONTRACT.CHAIN_ID}). Stores owner, file hash, status, size, expiry, payment, and storage commitment — never file bytes.`],
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
                        ['Select & Hash', 'The browser reads the selected file and computes SHA-256 of the original plaintext bytes.'],
                        ['Quote & Pay', 'The client calls quote(fileSize, 24 hours, replication factor 3, temporary storage) and sends the exact native MON amount to createBlob().'],
                        ['Pending Record', 'The registry assigns the next numeric blobId, stores owner=msg.sender, fileHash, size, expiry, replication factor, status=Pending, and payment, then emits BlobCreated.'],
                        ['Contract-local ID', 'blobId is public and incrementing, but it is not a Sui-style global object. It is meaningful together with the MblobRegistry contract address and is owned by the payer wallet recorded in the blob.'],
                        ['Sign Upload', 'After extracting blobId from the registry transaction receipt and confirming getBlob(blobId).fileHash matches the selected file hash, the browser signs: Mblob upload authorization / Blob ID / Nonce, then sends the cached plaintext file bytes as the raw request body with signature headers and x-file-hash to the gateway.'],
                        ['Verify', 'The gateway verifies the signature, reserves the nonce to prevent replay, checks that the signer owns the pending on-chain blob, and confirms the uploaded file hash matches the on-chain fileHash.'],
                        ['Encrypt', 'The gateway encrypts the uploaded plaintext with AES-256-GCM using a random per-file data key, then wraps that data key with the server master encryption key.'],
                        ['Replicate', 'The gateway sends the same full encrypted ciphertext to each configured storage node. The current MVP does not split data or use erasure coding.'],
                        ['Activate', 'After every replica accepts the ciphertext, the gateway hashes the ordered node list plus ciphertext hash into a storage commitment and calls activateBlob().'],
                        ['Persist Metadata', 'The gateway stores publicId, owner, fileHash, wrappedDataKey, content type/length, node URLs, createTxHash, and activateTxHash in PostgreSQL, then returns the IDs and transaction hashes to the client.'],
                    ].map(([step, detail], i) => (
                        <li key={step} className="p-4 flex gap-4">
                            <span className="text-xs font-mono text-neutral-400 shrink-0 w-6">{String(i + 1).padStart(2, '0')}</span>
                            <div>
                                <p className="text-sm font-semibold text-black mb-1">{step}</p>
                                <p className="text-xs text-neutral-500 leading-relaxed">{detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Retrieve & My Blobs Flow</h2>
                <ol className="border border-black divide-y divide-black">
                    {[
                        ['Lookup', 'Anyone can look up a numeric blobId or public mb1_ ID through the gateway and see owner, status, file hash, stored flag, and transaction hashes.'],
                        ['On-chain Metadata', 'The UI can also call MblobRegistry.getBlob(blobId) with the numeric ID to show the canonical contract metadata in a modal.'],
                        ['My Blobs', 'The My Blobs tab asks the gateway for records whose stored owner matches the connected wallet, then lets the owner expand local metadata, inspect on-chain metadata, or download.'],
                        ['Sign Download', 'Downloads require a wallet signature: Mblob download authorization / Blob ID / Nonce. The gateway verifies the signature and that the signer owns an Active on-chain blob.'],
                        ['Fetch Replica', 'The gateway tries the stored node URLs in order and returns the first available encrypted replica.'],
                        ['Decrypt & Verify', 'The gateway unwraps the data key, decrypts the file, recomputes SHA-256 of the plaintext, compares it with the stored file hash, and returns the original file only if integrity passes.'],
                    ].map(([step, detail], i) => (
                        <li key={step} className="p-4 flex gap-4">
                            <span className="text-xs font-mono text-neutral-400 shrink-0 w-6">{String(i + 1).padStart(2, '0')}</span>
                            <div>
                                <p className="text-sm font-semibold text-black mb-1">{step}</p>
                                <p className="text-xs text-neutral-500 leading-relaxed">{detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Payments</h2>
                <div className="border border-black p-4 text-sm text-neutral-600 leading-relaxed space-y-3">
                    <p>The gateway does not directly collect payment. The user pays native MON into the MblobRegistry contract when calling createBlob().</p>
                    <p>The contract recomputes the required quote and rejects transactions where msg.value does not exactly match the required amount. Funds remain in the contract until the contract owner withdraws them.</p>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Wallet Signature Format</h2>
                <div className="border border-black p-4">
                    <p className="text-sm text-neutral-600 leading-relaxed mb-2">The client signs a plain-text authorization and sends address, nonce, and signature headers:</p>
                    <pre className="bg-neutral-50 border border-black p-3 text-xs font-mono overflow-x-auto mb-3">{`Mblob upload authorization
Blob ID: 1
Nonce: unique-random-value`}</pre>
                    <p className="text-xs text-neutral-500 leading-relaxed">Use <code className="text-xs bg-neutral-100 px-1">download</code> instead of <code className="text-xs bg-neutral-100 px-1">upload</code> for file retrieval. Each nonce can be used only once and expires after ten minutes.</p>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold tracking-tight text-black mb-3">Flow Diagram</h2>
                <div className="border border-black p-4">
                    <pre className="text-xs font-mono leading-relaxed overflow-x-auto">{`User Browser              Gateway                 Storage Nodes           Monad
    |                       |                          |                     |
    |-- quote/createBlob() --|--------------------------|-------------------->|
    |  pay MON, get blobId  |                          |                     |
    |-- signed raw upload -->|                          |                     |
    |  plaintext file bytes |                          |                     |
    |                       |-- verify owner/status -->|-------------------->|
    |                       |-- hash check             |                     |
    |                       |-- AES-GCM encrypt        |                     |
    |                       |-- replicate ciphertext ->|                     |
    |                       |                          |-- store replica    |
    |                       |-- activateBlob() ------->|-------------------->|
    |<-- publicId + tx hashes|                          |                     |
    |                       |                          |                     |
    |-- lookup ------------>|                          |                     |
    |<-- gateway metadata --|                          |                     |
    |-- getBlob(blobId) ----|--------------------------|-------------------->|
    |<-- on-chain metadata -|                          |                     |
    |-- signed download --->|                          |                     |
    |                       |-- verify owner/status -->|-------------------->|
    |                       |-- fetch replica -------->|                     |
    |                       |<-- ciphertext -----------|                     |
    |                       |-- decrypt + verify       |                     |
    |<-- original file -----|                          |                     |`}</pre>
                </div>
            </section>
        </div>
    )
}
