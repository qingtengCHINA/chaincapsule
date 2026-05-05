# ChainCapsule ⏳

> 把你的话，封存在区块里，留给未来。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![BNB Smart Chain](https://img.shields.io/badge/Chain-BSC%20Smart%20Chain-yellow)](https://www.bnbchain.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity)](https://soliditylang.org)

**[English](./README.md)**

## 简介

ChainCapsule 是一个部署在 **BNB Smart Chain** 上的去中心化时光胶囊 dApp。用户可以将文字内容加密存储在 IPFS 上，并在链上设定一个基于区块号的未来时间点作为"解锁时间"。只有到达指定区块后，胶囊才能被打开——确保任何人（包括创建者和平台）在指定时间前都无法访问内容。

## 功能特性

- 🔒 **时间锁** — 基于区块号的精确时间锁定，智能合约层面强制执行
- 🌐 **IPFS 存储** — 内容去中心化存储在 IPFS (Pinata)，永不丢失、不可篡改
- 💰 **BNB 附加** — 可向胶囊存入 BNB，开胶囊后提取
- 👤 **指定领取人** — 可指定特定钱包地址领取，也可以公开给所有人
- 🔐 **客户端加密** — AES-256-GCM 端到端加密保护内容隐私
- 🏛️ **公开广场** — 浏览所有公开的时光胶囊，感受跨越时间的对话
- 📱 **响应式设计** — 完美适配移动端和桌面端
- 🌍 **多语言支持** — 中文、英文、日文、韩文、俄文、法文、德文

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 (App Router) + Tailwind CSS + Framer Motion |
| Web3 | wagmi v2 + viem + WalletConnect |
| 智能合约 | Solidity ^0.8.20 + OpenZeppelin |
| 存储 | IPFS (Pinata) |
| 数据库 | Supabase (PostgreSQL) |
| 网络 | BNB Smart Chain (Testnet / Mainnet) |
| 部署 | Vercel (前端) + Hardhat (合约) |

## 智能合约

**合约地址 (BSC Testnet v4):**
```
0x5C2628Af3e202E0715bC4Cf320610C4156047912
```

### 核心函数

| 函数 | 说明 |
|------|------|
| `createCapsule()` | 创建时光胶囊（可附带 BNB） |
| `openCapsule(id)` | 到达解锁区块后打开胶囊 |
| `withdrawBnb(id)` | 领取人提取胶囊中的 BNB |
| `reclaimBnb(id)` | 创建者在 ~365 天后回收无人领取的 BNB |

### 安全特性

- ✅ OpenZeppelin `ReentrancyGuard` 防重入攻击
- ✅ OpenZeppelin `Pausable` 紧急暂停机制
- ✅ Checks-Effects-Interactions 模式
- ✅ 自定义错误 (Custom Errors) 节省 Gas
- ✅ 20 个单元测试全覆盖

## 本地开发

```bash
# 安装依赖
npm install

# 启动本地 Hardhat 节点
npx hardhat node

# 部署合约到本地
npx hardhat run scripts/deploy.ts --network localhost

# 运行合约测试
npx hardhat test

# 启动前端开发服务器
npm run dev
```

### 环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_BSC_TESTNET_RPC=https://bsc-testnet-rpc.publicnode.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
PINATA_API_KEY=***
PINATA_SECRET_KEY=your_p...cret
```

## 项目结构

```
ChainCapsule/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由 (广场, IPFS, 评论, 点赞)
│   ├── capsule/[id]/      # 胶囊详情页
│   ├── create/            # 创建页
│   ├── plaza/             # 广场页
│   ├── profile/           # 个人页
│   ├── whitepaper/        # 技术白皮书
│   └── terms/             # 服务条款
├── components/            # React 组件
│   ├── capsule/           # 胶囊相关组件
│   ├── layout/            # 布局 (Navbar, Footer)
│   ├── ui/                # UI 组件 (语言切换, 按钮)
│   └── wallet/            # 钱包连接
├── lib/                   # 工具库
│   ├── contracts/         # 合约 ABI 和地址
│   ├── i18n/              # 国际化 (7 种语言)
│   ├── supabase/          # Supabase 客户端
│   └── utils/             # 工具函数
├── contracts/             # Solidity 智能合约
├── test/                  # 合约测试
└── scripts/               # 部署脚本
```

## 路线图

| 阶段 | 时间 | 目标 |
|------|------|------|
| Phase 1 | 2026 Q1-Q2 | BSC 测试网上线、核心功能、安全测试 |
| Phase 2 | 2026 Q3 | BSC 主网部署、安全审计、DappBay 上线 |
| Phase 3 | 2026 Q4 | 多链支持 (Ethereum, Polygon)、社交功能 |
| Phase 4 | 2027 Q1 | NFT 胶囊、DAO 治理、API 开放 |

## 开源协议

MIT License

## 作者

Made by [QingTeng Studio](https://qingtengstudio.com)

---

*用 ❤️ 在 BNB Smart Chain 上构建*
