# Mblob

**Mblob** is a decentralized blob storage protocol built on **Monad**.

It lets users upload files, pay on-chain, and have their data encrypted, replicated across independent storage nodes, and verified on the blockchain — all without relying on a centralized provider like AWS S3 or Google Cloud Storage.

## The Problem

Centralized cloud storage has a single point of failure. Providers control your data, can change pricing at any time, and users have no way to independently verify that their files haven't been tampered with. Blockchain-based storage solutions exist, but many are expensive, slow, or require users to trust a single operator.

## What Mblob does

- **On-chain payments** — Users pay exactly what the contract quotes. No hidden fees, no subscriptions.
- **Client-side encryption** — Files are SHA-256 hashed on the browser before upload. The gateway encrypts them with AES-256-GCM before they reach storage nodes.
- **Distributed replication** — Encrypted shards are spread across three independent storage nodes. No single node can read the file.
- **On-chain verification** — The file hash, owner, and storage commitment are recorded immutably on the Monad blockchain. Anyone can verify the file's integrity by comparing the on-chain hash with a locally computed one.
- **Transparent pipeline** — Every step from payment to retrieval is auditable via transaction hashes on the Monad explorer.

## What's Next — $MBLOB Token

The next major focus will be introducing **$MBLOB**, a native token that will serve as the payment currency for storage on the network. Instead of paying directly with MON, users will use $MBLOB to cover storage fees, and the token will also be used to incentivize storage node operators, creating a sustainable, token-powered economy around the protocol.

## Built for Spark Hackathon

This project was built for the **Spark Hackathon** by [Build Anything](https://buildanything.so). It demonstrates how Monad's high-throughput EVM environment enables practical, verifiable decentralized storage at a fraction of the cost of traditional solutions.

## Tech Stack

- **Blockchain**: Monad testnet (EVM-compatible), Solidity smart contract
- **Frontend**: React + Vite + viem (wallet interaction)
- **Backend**: Hono.js (gateway server), PostgreSQL (metadata)
- **Infrastructure**: Docker Compose (gateway + 3 storage nodes)

---

*Created by [@mercichidi](https://x.com/mercichidi)*