# ChainCapsule ⏳

> Seal your words in the blockchain, for the future.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![BNB Smart Chain](https://img.shields.io/badge/Chain-BSC%20Smart%20Chain-yellow)](https://www.bnbchain.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](https://soliditylang.org)

**[中文文档](./README.zh-CN.md)**

## Overview

ChainCapsule is a decentralized time capsule dApp deployed on **BNB Smart Chain**. Users can encrypt and store text content on IPFS, setting a future block number as the "unlock time" on-chain. Capsules can only be opened after the target block is reached — ensuring no one, including the creator and the platform, can access the content before the specified time.

## Features

- 🔒 **Time Lock** — Precise block-based time locking via smart contract enforcement
- 🌐 **IPFS Storage** — Content stored decentrally on IPFS (Pinata) — never lost, never tampered
- 💰 **BNB Attached** — Attach BNB to capsules for the future recipient to claim
- 👤 **Designated Recipient** — Specify a wallet address or leave public for anyone
- 🔐 **Client-Side Encryption** — AES-256-GCM end-to-end encryption for privacy
- 🏛️ **Public Plaza** — Browse all public time capsules — conversations across time
- 📱 **Responsive Design** — Pixel-perfect on mobile and desktop
- 🌍 **Multi-Language** — Chinese, English, Japanese, Korean, Russian, French, German

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + Framer Motion |
| Web3 | wagmi v2 + viem + WalletConnect |
| Smart Contract | Solidity ^0.8.20 + OpenZeppelin |
| Storage | IPFS (Pinata) |
| Database | Supabase (PostgreSQL) |
| Network | BNB Smart Chain (Testnet / Mainnet) |
| Deployment | Vercel (frontend) + Hardhat (contracts) |

## Smart Contract

**Contract Address (BSC Testnet v4):**
```
0x5C2628Af3e202E0715bC4Cf320610C4156047912
```

### Core Functions

| Function | Description |
|----------|-------------|
| `createCapsule()` | Create a time capsule (optionally attach BNB) |
| `openCapsule(id)` | Open a capsule after the unlock block is reached |
| `withdrawBnb(id)` | Recipient withdraws BNB from the capsule |
| `reclaimBnb(id)` | Creator reclaims unclaimed BNB after ~365 days |

### Security

- ✅ OpenZeppelin `ReentrancyGuard` — prevents reentrancy attacks
- ✅ OpenZeppelin `Pausable` — emergency pause mechanism
- ✅ Checks-Effects-Interactions pattern
- ✅ Custom Errors for gas efficiency
- ✅ 20 unit tests with full coverage

## Getting Started

```bash
# Install dependencies
npm install

# Start local Hardhat node
npx hardhat node

# Deploy contract locally
npx hardhat run scripts/deploy.ts --network localhost

# Run contract tests
npx hardhat test

# Start dev server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
PINATA_API_KEY=***
PINATA_SECRET_KEY=your_p...cret
```

## Project Structure

```
ChainCapsule/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (plaza, IPFS, comments, likes)
│   ├── capsule/[id]/      # Capsule detail page
│   ├── create/            # Create page
│   ├── plaza/             # Public plaza
│   ├── profile/           # User profile
│   ├── whitepaper/        # Technical whitepaper
│   └── terms/             # Terms of service
├── components/            # React components
│   ├── capsule/           # Capsule-related components
│   ├── layout/            # Layout (Navbar, Footer)
│   ├── ui/                # UI components (LanguageSwitcher, Button)
│   └── wallet/            # Wallet connection
├── lib/                   # Utilities
│   ├── contracts/         # ABI and addresses
│   ├── i18n/              # Internationalization (7 languages)
│   ├── supabase/          # Supabase client
│   └── utils/             # Helpers
├── contracts/             # Solidity smart contracts
├── test/                  # Contract tests
└── scripts/               # Deployment scripts
```

## Roadmap

| Phase | Timeline | Goals |
|-------|----------|-------|
| Phase 1 | 2026 Q1-Q2 | BSC testnet, core features, security testing |
| Phase 2 | 2026 Q3 | BSC mainnet, security audit, DappBay listing |
| Phase 3 | 2026 Q4 | Multi-chain (Ethereum, Polygon), social features |
| Phase 4 | 2027 Q1 | NFT capsules, DAO governance, open API |

## License

MIT License

## Author

Made by [QingTeng Studio](https://qingtengstudio.com)

---

*Built with ❤️ on BNB Smart Chain*
