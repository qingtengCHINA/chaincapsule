# ChainCapsule

> 链上时光胶囊 — 把你的话，封存在区块里，留给未来。

ChainCapsule 是一个部署在 BNB Smart Chain 上的去中心化应用。你可以将文字、图片或 BNB 封存为一颗链上胶囊，设定未来某个区块号解锁。在解锁之前，谁也看不到里面的内容。打开的那一刻，是一场有仪式感的动画演出。

---

## 特性

- **链上永久存储** — 内容通过 IPFS 存储，哈希写入链上合约，永久不可篡改
- **定时解锁** — 基于区块号的精确解锁机制，不到时间谁也打不开
- **附带 BNB** — 可以在胶囊里附上 BNB 红包，打开时自动到账
- **私密/公开** — 支持仅自己可见的私密胶囊，或展示在广场的公开胶囊
- **仪式感动画** — 打开胶囊时的星星爆炸 → 信件展开动画，满满的仪式感
- **星空主题 UI** — 沉浸式星空背景，你的胶囊像星星一样漂浮在宇宙中

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router) + Tailwind CSS + Framer Motion |
| Web3 | wagmi + viem + @tanstack/react-query |
| 合约 | Solidity ^0.8.20 + Hardhat + OpenZeppelin |
| 后端 | Supabase (Auth + PostgreSQL + Storage) |
| 存储 | IPFS (Pinata) |
| 链 | BNB Smart Chain (BSC Mainnet/Testnet) |
| 部署 | Vercel (前端) + BSC (合约) |
| 设计 | taste-skill 规范 (Anti-Slop) |

---

## 快速开始

### 前置条件

- Node.js >= 18
- npm >= 9
- Git
- MetaMask 或其他 Web3 钱包

### 安装

```bash
git clone https://github.com/YOUR_USERNAME/ChainCapsule.git
cd ChainCapsule
npm install
```

### 环境变量

复制 `.env.local.example` 为 `.env.local`，填入你的配置:

```bash
cp .env.local.example .env.local
```

需要的配置:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 匿名 Key
- `NEXT_PUBLIC_BSC_TESTNET_RPC` — BSC 测试网 RPC
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect 项目 ID
- `NEXT_PUBLIC_PINATA_API_KEY` / `NEXT_PUBLIC_PINATA_SECRET` — IPFS 上传

### 本地开发

```bash
npm run dev
```

打开 http://localhost:3000

### 编译 & 测试合约

```bash
npx hardhat compile
npx hardhat test
```

### 部署合约

```bash
# 测试网
npx hardhat run scripts/deploy.ts --network bscTestnet

# 主网
npx hardhat run scripts/deploy.ts --network bscMainnet
```

---

## 项目结构

```
ChainCapsule/
├── app/                  # Next.js 页面
│   ├── page.tsx          # 首页 (星空 + 我的胶囊)
│   ├── create/           # 创建胶囊
│   ├── capsule/[id]/     # 胶囊详情/打开
│   ├── plaza/            # 公开广场
│   └── profile/          # 个人主页
├── components/
│   ├── capsule/          # 胶囊核心组件
│   ├── three/            # 3D/Canvas 视觉组件
│   ├── wallet/           # 钱包连接
│   ├── ui/               # 基础 UI 组件
│   └── layout/           # 导航/页脚
├── contracts/            # Solidity 合约
├── scripts/              # 部署脚本
├── test/                 # 合约测试
├── lib/
│   ├── supabase/         # Supabase 客户端
│   ├── contracts/        # 合约 ABI & hooks
│   ├── utils/            # 工具函数
│   └── types/            # TypeScript 类型
├── supabase/             # 数据库迁移
└── public/               # 静态资源
```

---

## 网络信息

| | Mainnet | Testnet |
|---|---|---|
| ChainID | 56 | 97 |
| RPC | `https://bsc-dataseed.bnbchain.org` | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
| Explorer | https://bscscan.com | https://testnet.bscscan.com |
| 区块时间 | ~0.45s | ~3s |
| 水龙头 | — | https://testnet.bnbchain.org/faucet-smart |

---

## 核心合约接口

```solidity
// 创建胶囊
function createCapsule(
    string calldata contentHash,   // IPFS CID
    uint256 unlockBlock,           // 解锁区块号
    bool isPublic,                 // 是否公开
    address recipient              // 收件人 (address(0) = 自己)
) external payable returns (uint256);

// 打开胶囊
function openCapsule(uint256 id) external;

// 查询胶囊
function getCapsule(uint256 id) external view returns (Capsule memory);
function getBlocksUntilUnlock(uint256 id) external view returns (uint256);
function getUserCapsules(address user) external view returns (uint256[] memory);
```

---

## 设计理念

ChainCapsule 的设计遵循 [taste-skill](https://github.com/Leonxlnx/taste-skill) 规范:

- **字体**: Geist / Satoshi (禁止 Inter)
- **颜色**: 深空背景 + 单一强调色，无过度渐变
- **布局**: 非对称，呼吸感，大量留白
- **动画**: Spring Physics 驱动，禁止 linear easing
- **无 emoji**: 所有图标使用 @phosphor-icons/react
- **响应式**: CSS Grid 优先，min-h-[100dvh] 代替 h-screen

---

## 部署架构

```
GitHub (源码)
    ├── push → Vercel (前端自动部署)
    └── push → Hardhat (合约部署到 BSC)
    
Supabase (Auth + DB + Storage)
    └── Edge Functions (区块时间查询、内容索引)
```

---

## 开发路线

- [x] Phase 1: 智能合约 + 基础前端
- [ ] Phase 2: IPFS 内容存储 + 创建流程
- [ ] Phase 3: 打开动画 + 广场
- [ ] Phase 4: 私密胶囊 (端到端加密)
- [ ] Phase 5: 社交功能 (回复、分享)
- [ ] Phase 6: 多链支持 (opBNB L2)

---

## License

MIT

---

Built with ♥ on BNB Chain
