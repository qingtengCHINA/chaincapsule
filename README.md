# ChainCapsule ⏳

链上时光胶囊 — 把你的话，封存在区块里，留给未来。

## 简介

ChainCapsule 是一个部署在 **BNB Smart Chain** 上的去中心化时光胶囊 dApp。用户可以将文字内容加密存储在 IPFS 上，并在链上设定一个未来区块号作为"解锁时间"。只有到达指定区块后，胶囊才能被打开。

## 功能特性

- 🔒 **时间锁**：基于区块号的精确时间锁定
- 🌐 **IPFS 存储**：内容去中心化存储在 IPFS (Pinata)
- 💰 **BNB 附加**：可向胶囊存入 BNB，开胶囊后提取
- 👤 **指定领取人**：可指定特定钱包地址领取胶囊
- 🏛️ **公开广场**：浏览所有公开的时光胶囊
- 🔐 **客户端加密**：AES-256-GCM 加密保护内容隐私
- 📱 **响应式设计**：完美适配移动端和桌面端

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 (App Router) + Tailwind CSS + Framer Motion |
| Web3 | wagmi v2 + viem + WalletConnect |
| 智能合约 | Solidity ^0.8.20 + OpenZeppelin |
| 存储 | IPFS (Pinata) |
| 网络 | BNB Smart Chain (Testnet / Mainnet) |
| 部署 | Vercel (前端) + Hardhat (合约) |

## 智能合约

合约地址 (BSC Testnet):
```
0xc9b1Fa78E1eFB25674444abD761a9a23a4Ab38Ea
```

### 核心函数

| 函数 | 说明 |
|------|------|
| `createCapsule()` | 创建时光胶囊 (可附带 BNB) |
| `openCapsule()` | 到达解锁区块后打开胶囊 |
| `withdrawBnb()` | 提取胶囊中的 BNB |
| `reclaimBnb()` | 创建者在 ~365 天后回收无人领取的 BNB |

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
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

## 项目结构

```
ChainCapsule/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── capsule/[id]/      # 胶囊详情页
│   ├── create/            # 创建页
│   ├── plaza/             # 广场页
│   └── profile/           # 个人页
├── components/            # React 组件
│   ├── capsule/           # 胶囊相关组件
│   ├── layout/            # 布局组件 (Navbar, Footer)
│   ├── ui/                # 通用 UI 组件
│   └── wallet/            # 钱包连接组件
├── contracts/             # Solidity 智能合约
├── lib/                   # 工具库
│   ├── contracts/         # 合约 ABI 和地址
│   ├── crypto.ts          # 客户端加密工具
│   └── utils/             # 工具函数
├── test/                  # 合约测试
└── scripts/               # 部署脚本
```

## 开源协议

MIT License

## 作者

Made by [QingTengStudio](https://qingtengstudio.com)
