# ChainCapsule — 链上时光胶囊 实施计划

> **For agentic workers:** Use superpowers:subagent-driven-development or executing-plans to implement this plan task-by-task.

**Goal:** 构建一个部署在 BNB Smart Chain 上的 dApp，让用户将文字/图片/BNB 封存为链上时光胶囊，设定未来区块解锁，打开时有仪式感动画演出。

**Architecture:** 
- 前端: Next.js 14 (App Router) + Tailwind CSS + Framer Motion + wagmi/viem
- 后端: Supabase (Auth + Database + Storage + Edge Functions)
- 链: BNB Smart Chain (BSC Mainnet ChainID 56, Testnet ChainID 97)
- 合约: Solidity ^0.8.20 + Hardhat + OpenZeppelin
- 部署: GitHub → Vercel (前端), GitHub → Hardhat (合约)
- 设计: taste-skill 规范 (Anti-Slop, 设计感优先)

---

## 文件结构

```
ChainCapsule/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # GitHub Actions: lint + test
│       └── deploy-contract.yml       # 合约部署 workflow
├── contracts/
│   ├── ChainCapsule.sol              # 主合约
│   ├── interfaces/
│   │   └── IChainCapsule.sol         # 合约接口
│   └── libraries/
│       └── CapsuleLib.sol            # 辅助库
├── scripts/
│   └── deploy.ts                     # Hardhat 部署脚本
├── test/
│   └── ChainCapsule.test.ts          # 合约单元测试
├── hardhat.config.ts                 # Hardhat 配置
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 根布局 (Providers, 字体, 全局样式)
│   ├── page.tsx                      # 首页: 星空 + 我的胶囊
│   ├── create/
│   │   └── page.tsx                  # 创建胶囊页
│   ├── capsule/[id]/
│   │   └── page.tsx                  # 胶囊详情/打开页
│   ├── plaza/
│   │   └── page.tsx                  # 广场: 公开已解锁胶囊
│   └── profile/
│       └── page.tsx                  # 个人主页
├── components/
│   ├── ui/                           # 基础 UI 组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Skeleton.tsx
│   ├── capsule/                      # 胶囊核心组件
│   │   ├── CapsuleCard.tsx           # 胶沫卡片 (星空漂浮效果)
│   │   ├── CapsuleForm.tsx           # 创建表单
│   │   ├── CapsuleTimeline.tsx       # 倒计时/时间线
│   │   ├── OpenAnimation.tsx         # 打开胶囊动画 (星星爆炸→信件展开)
│   │   └── CapsulePlaza.tsx          # 广场列表
│   ├── three/                        # 3D/Canvas 组件
│   │   ├── StarField.tsx             # 星空背景 (Three.js / Canvas)
│   │   └── ParticleExplosion.tsx     # 粒子爆炸效果
│   ├── wallet/
│   │   ├── ConnectButton.tsx         # 钱包连接按钮
│   │   └── WalletProvider.tsx        # wagmi Provider
│   └── layout/
│       ├── Navbar.tsx                # 导航栏
│       └── Footer.tsx                # 页脚
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 浏览器端 Supabase client
│   │   ├── server.ts                 # 服务端 Supabase client
│   │   └── middleware.ts             # Auth 中间件
│   ├── contracts/
│   │   ├── abi.ts                    # 合约 ABI
│   │   ├── addresses.ts              # 合约地址 (mainnet/testnet)
│   │   └── hooks.ts                  # wagmi hooks (封装合约调用)
│   ├── utils/
│   │   ├── blockTime.ts              # 区块数 ↔ 时间转换
│   │   ├── format.ts                 # 格式化工具
│   │   └── encryption.ts             # 加密/解密 (私密胶囊)
│   └── types/
│       └── capsule.ts                # TypeScript 类型定义
├── supabase/
│   ├── migrations/                   # 数据库迁移
│   │   └── 001_create_tables.sql
│   └── config.toml                   # Supabase 配置
├── public/
│   ├── favicon.ico
│   └── images/
├── styles/
│   └── globals.css                   # Tailwind 全局样式
├── .env.local.example                # 环境变量模板
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 核心数据结构

### 智能合约 (ChainCapsule.sol)

```solidity
struct Capsule {
    uint256 id;
    address creator;           // 创建者
    string contentHash;        // IPFS 内容哈希 (文字/图片)
    uint256 unlockBlock;       // 解锁区块号
    uint256 createdAt;         // 创建时间
    uint256 bnbAmount;         // 附带的 BNB (可选)
    bool isOpened;             // 是否已打开
    bool isPublic;             // 是否公开到广场
    address recipient;         // 收件人 (address(0) = 自己)
}

mapping(uint256 => Capsule) public capsules;
uint256 public capsuleCount;

event CapsuleCreated(uint256 indexed id, address indexed creator, uint256 unlockBlock, bool isPublic);
event CapsuleOpened(uint256 indexed id, address indexed opener, uint256 timestamp);
```

### Supabase 数据库

```sql
-- 胶囊元数据缓存 (链上数据的快照，加速查询)
CREATE TABLE capsules (
    id BIGINT PRIMARY KEY,                    -- 链上 capsule ID
    creator_address TEXT NOT NULL,
    recipient_address TEXT,
    content_hash TEXT,                        -- IPFS CID
    unlock_block BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    bnb_amount_wei TEXT,                      -- 存为字符串避免精度丢失
    is_opened BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    content_preview TEXT,                     -- 解锁后的文字预览 (前100字)
    metadata JSONB DEFAULT '{}'::jsonb,       -- 额外元数据
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户档案
CREATE TABLE profiles (
    wallet_address TEXT PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    capsule_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_capsules_creator ON capsules(creator_address);
CREATE INDEX idx_capsules_unlock ON capsules(unlock_block) WHERE NOT is_opened;
CREATE INDEX idx_capsules_public ON capsules(is_public, unlock_block) WHERE is_public AND is_opened;
```

---

## Task 1: 项目初始化 + 工具链

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.gitignore`, `.env.local.example`

- [ ] **Step 1: 初始化 Next.js 项目**

```bash
cd /Users/qingteng/Downloads/项目代码_Projects/我的制作/ChainCapsule
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install wagmi viem@2.x @tanstack/react-query framer-motion @supabase/supabase-js @phosphor-icons/react zustand
npm install -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

- [ ] **Step 3: 创建 .env.local.example**

```env
# BNB Chain
NEXT_PUBLIC_BSC_MAINNET_RPC=https://bsc-dataseed.bnbchain.org
NEXT_PUBLIC_BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545
NEXT_PUBLIC_CHAIN_ID=97

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# IPFS (Pinata)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

- [ ] **Step 4: 创建 .gitignore 并初始化 Git**

```bash
git init
```

.gitignore 内容:
```
node_modules/
.next/
.env.local
.env*.local
out/
*.tsbuildinfo
cache/
artifacts/
typechain-types/
supabase/.temp/
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: initialize ChainCapsule project with Next.js + Hardhat"
```

---

## Task 2: Hardhat 配置 + 智能合约

**Files:**
- Create: `hardhat.config.ts`, `contracts/ChainCapsule.sol`, `contracts/interfaces/IChainCapsule.sol`, `scripts/deploy.ts`, `test/ChainCapsule.test.ts`

- [ ] **Step 1: 配置 hardhat.config.ts**

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    bscTestnet: {
      url: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 97,
    },
    bscMainnet: {
      url: process.env.NEXT_PUBLIC_BSC_MAINNET_RPC || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 56,
    },
  },
  etherscan: {
    apiKey: { bscTestnet: process.env.BSCSCAN_API_KEY || "", bsc: process.env.BSCSCAN_API_KEY || "" },
  },
};

export default config;
```

- [ ] **Step 2: 编写 ChainCapsule.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ChainCapsule is Ownable, ReentrancyGuard, Pausable {
    struct Capsule {
        uint256 id;
        address creator;
        string contentHash;       // IPFS CID
        uint256 unlockBlock;
        uint256 createdAt;
        uint256 bnbAmount;
        bool isOpened;
        bool isPublic;
        address recipient;
    }

    uint256 public capsuleCount;
    mapping(uint256 => Capsule) public capsules;
    mapping(address => uint256[]) public userCapsules;

    uint256 public constant MIN_BNB = 0.001 ether;
    uint256 public constant MAX_CONTENT_LENGTH = 10000; // IPFS hash max length

    event CapsuleCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed recipient,
        uint256 unlockBlock,
        bool isPublic,
        uint256 bnbAmount
    );
    event CapsuleOpened(uint256 indexed id, address indexed opener, uint256 bnbWithdrawn);
    event BNBWithdrawn(address indexed to, uint256 amount);

    error CapsuleAlreadyOpened();
    error CapsuleNotReady();
    error NotAuthorized();
    error InvalidContent();
    error InvalidUnlockBlock();
    error InsufficientBNB();
    error WithdrawFailed();

    modifier onlyCapsuleCreator(uint256 _id) {
        if (msg.sender != capsules[_id].creator) revert NotAuthorized();
        _;
    }

    modifier capsuleExists(uint256 _id) {
        require(_id < capsuleCount, "Capsule does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createCapsule(
        string calldata _contentHash,
        uint256 _unlockBlock,
        bool _isPublic,
        address _recipient
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        if (bytes(_contentHash).length == 0 || bytes(_contentHash).length > MAX_CONTENT_LENGTH)
            revert InvalidContent();
        if (_unlockBlock <= block.number) revert InvalidUnlockBlock();

        uint256 id = capsuleCount++;
        uint256 bnbAmount = msg.value;

        capsules[id] = Capsule({
            id: id,
            creator: msg.sender,
            contentHash: _contentHash,
            unlockBlock: _unlockBlock,
            createdAt: block.timestamp,
            bnbAmount: bnbAmount,
            isOpened: false,
            isPublic: _isPublic,
            recipient: _recipient
        });

        userCapsules[msg.sender].push(id);

        emit CapsuleCreated(id, msg.sender, _recipient, _unlockBlock, _isPublic, bnbAmount);
        return id;
    }

    function openCapsule(uint256 _id) external nonReentrant capsuleExists(_id) {
        Capsule storage c = capsules[_id];
        if (c.isOpened) revert CapsuleAlreadyOpened();
        if (block.number < c.unlockBlock) revert CapsuleNotReady();

        address opener = msg.sender;
        if (opener != c.creator && opener != c.recipient && c.recipient != address(0)) {
            revert NotAuthorized();
        }

        c.isOpened = true;

        uint256 bnbToSend = c.bnbAmount;
        if (bnbToSend > 0) {
            c.bnbAmount = 0;
            (bool success, ) = payable(opener).call{value: bnbToSend}("");
            if (!success) revert WithdrawFailed();
        }

        emit CapsuleOpened(_id, opener, bnbToSend);
    }

    function getCapsule(uint256 _id) external view capsuleExists(_id) returns (Capsule memory) {
        return capsules[_id];
    }

    function getUserCapsules(address _user) external view returns (uint256[] memory) {
        return userCapsules[_user];
    }

    function getBlocksUntilUnlock(uint256 _id) external view capsuleExists(_id) returns (uint256) {
        Capsule storage c = capsules[_id];
        if (block.number >= c.unlockBlock) return 0;
        return c.unlockBlock - block.number;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    receive() external payable {}
}
```

- [ ] **Step 3: 编写测试**

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("ChainCapsule", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const ChainCapsule = await ethers.getContractFactory("ChainCapsule");
    const capsule = await ChainCapsule.deploy();
    return { capsule, owner, user1, user2 };
  }

  it("should create a capsule", async function () {
    const { capsule, user1 } = await loadFixture(deployFixture);
    const currentBlock = await ethers.provider.getBlockNumber();
    const unlockBlock = currentBlock + 100;

    await expect(
      capsule.connect(user1).createCapsule("QmTestHash123", unlockBlock, true, ethers.ZeroAddress, {
        value: ethers.parseEther("0.01"),
      })
    ).to.emit(capsule, "CapsuleCreated");

    const data = await capsule.getCapsule(0);
    expect(data.creator).to.equal(user1.address);
    expect(data.contentHash).to.equal("QmTestHash123");
    expect(data.isPublic).to.be.true;
  });

  it("should fail to open before unlock block", async function () {
    const { capsule, user1 } = await loadFixture(deployFixture);
    const currentBlock = await ethers.provider.getBlockNumber();
    await capsule.connect(user1).createCapsule("QmHash", currentBlock + 1000, false, ethers.ZeroAddress);

    await expect(capsule.connect(user1).openCapsule(0)).to.be.revertedWithCustomError(capsule, "CapsuleNotReady");
  });

  it("should return correct blocks until unlock", async function () {
    const { capsule, user1 } = await loadFixture(deployFixture);
    const currentBlock = await ethers.provider.getBlockNumber();
    const unlockBlock = currentBlock + 500;
    await capsule.connect(user1).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress);

    const remaining = await capsule.getBlocksUntilUnlock(0);
    expect(remaining).to.be.closeTo(500n, 5n);
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
npx hardhat test
```

Expected: 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ChainCapsule smart contract with tests"
```

---

## Task 3: Supabase 数据库设置

**Files:**
- Create: `supabase/migrations/001_create_tables.sql`, `supabase/config.toml`
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: 创建数据库迁移**

`supabase/migrations/001_create_tables.sql`:
```sql
CREATE TABLE IF NOT EXISTS profiles (
    wallet_address TEXT PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    capsule_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capsules (
    id BIGINT PRIMARY KEY,
    creator_address TEXT NOT NULL,
    recipient_address TEXT,
    content_hash TEXT,
    unlock_block BIGINT NOT NULL,
    created_at_chain TIMESTAMPTZ NOT NULL,
    bnb_amount_wei TEXT DEFAULT '0',
    is_opened BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    content_preview TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caps_creator ON capsules(creator_address);
CREATE INDEX IF NOT EXISTS idx_caps_unlock ON capsules(unlock_block) WHERE NOT is_opened;
CREATE INDEX IF NOT EXISTS idx_caps_public ON capsules(is_public, created_at_chain DESC) WHERE is_public;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.jwt()->>'sub' = wallet_address);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.jwt()->>'sub' = wallet_address);

CREATE POLICY "Public capsules readable" ON capsules FOR SELECT USING (is_public = true OR creator_address = auth.jwt()->>'sub');
CREATE POLICY "Authenticated can insert capsules" ON capsules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creator can update own capsules" ON capsules FOR UPDATE USING (creator_address = auth.jwt()->>'sub');
```

- [ ] **Step 2: 创建 Supabase client**

`lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

`lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Supabase database schema and client setup"
```

---

## Task 4: 前端 — 钱包连接 + Providers

**Files:**
- Create: `components/wallet/WalletProvider.tsx`, `components/wallet/ConnectButton.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: WalletProvider (wagmi + RainbowKit 或自定义)**

`components/wallet/WalletProvider.tsx`:
```typescript
"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() =>
    createConfig({
      chains: [bscTestnet, bsc],
      transports: { [bscTestnet.id]: http(), [bsc.id]: http() },
    })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
```

- [ ] **Step 2: ConnectButton (极简设计，遵循 taste-skill)**

```typescript
"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, SignOut } from "@phosphor-icons/react";

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-full border border-zinc-800
                   bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-all duration-300
                   active:scale-[0.98]"
      >
        <span className="font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <SignOut size={14} weight="bold" />
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-full
                 bg-white text-zinc-950 font-medium
                 hover:bg-zinc-100 transition-all duration-300
                 active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
    >
      <Wallet size={16} weight="bold" />
      连接钱包
    </button>
  );
}
```

- [ ] **Step 3: 更新 app/layout.tsx 包裹 Provider**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add wallet connection with wagmi provider"
```

---

## Task 5: 前端 — 星空背景 + 首页

**Files:**
- Create: `components/three/StarField.tsx`, `components/layout/Navbar.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: StarField (Canvas 2D 星空，不用 Three.js 减少 bundle)**

使用 Canvas 2D 画星空粒子，跟随鼠标微动，性能好且视觉效果强。

- [ ] **Step 2: Navbar (极简，左侧 Logo，右侧 ConnectButton)**

遵循 taste-skill: 不用 Inter 字体，用 Geist 或 Satoshi；不用 emoji；z-index 系统化。

- [ ] **Step 3: 首页布局**

非居中 Hero (taste-skill: ANTI-CENTER BIAS)，左对齐文案 + 右侧漂浮胶囊视觉。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add starfield background, navbar, and home page layout"
```

---

## Task 6: 前端 — 创建胶囊页

**Files:**
- Create: `components/capsule/CapsuleForm.tsx`, `app/create/page.tsx`
- Create: `lib/contracts/hooks.ts`, `lib/contracts/abi.ts`, `lib/contracts/addresses.ts`
- Create: `lib/utils/blockTime.ts`

- [ ] **Step 1: 合约 ABI 和地址配置**

从编译产物提取 ABI，地址从环境变量读取。

- [ ] **Step 2: wagmi hooks 封装**

```typescript
// lib/contracts/hooks.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CHAIN_CAPSULE_ABI } from "./abi";
import { getContractAddress } from "./addresses";

export function useCreateCapsule() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const create = (contentHash: string, unlockBlock: bigint, isPublic: boolean, bnbAmount: string) => {
    writeContract({
      address: getContractAddress(),
      abi: CHAIN_CAPSULE_ABI,
      functionName: "createCapsule",
      args: [contentHash, unlockBlock, isPublic, "0x0000000000000000000000000000000000000000"],
      value: parseEther(bnbAmount),
    });
  };

  return { create, isPending, isConfirming, isSuccess, txHash: hash };
}
```

- [ ] **Step 3: CapsuleForm 组件**

表单: 内容输入(文字)、解锁时间选择(日期→区块号转换)、是否公开、可选 BNB 金额。
遵循 taste-skill: Label 在 input 上方，helper text 存在，error text 在下方。

- [ ] **Step 4: 创建页面整合**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add capsule creation form with contract integration"
```

---

## Task 7: 前端 — 胶囊详情/打开页

**Files:**
- Create: `components/capsule/CapsuleTimeline.tsx`, `components/capsule/OpenAnimation.tsx`
- Create: `app/capsule/[id]/page.tsx`

- [ ] **Step 1: CapsuleTimeline (倒计时组件)**

显示: 距离解锁还剩 XX 个区块 ≈ XX 天 XX 小时。
解锁后: 显示 "可以打开" 按钮，带呼吸动画。

- [ ] **Step 2: OpenAnimation (核心仪式感动画)**

Framer Motion 实现:
1. 点击 "打开" → 胶囊震动
2. 胶囊碎裂 → 粒子向外扩散
3. 信件从中心缓缓展开
4. 内容淡入

遵循 taste-skill: Spring Physics, no linear easing, AnimatePresence。

- [ ] **Step 3: 胶囊详情页**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add capsule detail page with opening animation"
```

---

## Task 8: 前端 — 广场页

**Files:**
- Create: `components/capsule/CapsuleCard.tsx`, `components/capsule/CapsulePlaza.tsx`
- Create: `app/plaza/page.tsx`

- [ ] **Step 1: CapsuleCard (漂浮胶囊卡片)**

卡片带微悬浮动画 (taste-skill: perpetual micro-interactions)。
显示: 创建者地址缩写、解锁时间、公开留言预览。

- [ ] **Step 2: 广场页 (Masonry 布局)**

Masonry 瀑布流展示公开胶囊，点击进入详情。
遵循 taste-skill: NO 3-Column equal cards, use masonry/zigzag。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add capsule plaza with masonry layout"
```

---

## Task 9: Supabase Auth (签名登录) + 个人页

**Files:**
- Create: `app/profile/page.tsx`
- Modify: `lib/supabase/client.ts`

- [ ] **Step 1: 钱包签名登录 Supabase**

使用 Supabase 的 `signInWithPassword` 或自定义 Edge Function 验证钱包签名。

- [ ] **Step 2: 个人页 (我的胶囊列表)**

展示用户创建的所有胶囊，按状态分类 (未解锁/已解锁/已打开)。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add wallet-based auth and profile page"
```

---

## Task 10: GitHub + Vercel 部署

- [ ] **Step 1: 创建 GitHub 仓库**

```bash
cd /Users/qingteng/Downloads/项目代码_Projects/我的制作/ChainCapsule
gh repo create ChainCapsule --public --source=. --remote=origin --push
```

- [ ] **Step 2: 配置 Vercel**

在 Vercel Dashboard 导入 GitHub 仓库，设置环境变量:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_BSC_TESTNET_RPC
- NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

- [ ] **Step 3: 部署合约到 BSC Testnet**

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

- [ ] **Step 4: 更新合约地址，push 触发 Vercel 自动部署**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure deployment pipeline"
```

---

## Task 11: README 撰写

- [ ] **Step 1: 编写 README.md** (见项目根目录)

---

## 技术参考

### BNB Chain 网络参数
| | Mainnet | Testnet |
|---|---|---|
| ChainID | 56 | 97 |
| RPC | https://bsc-dataseed.bnbchain.org | https://data-seed-prebsc-1-s1.bnbchain.org:8545 |
| Explorer | https://bscscan.com | https://testnet.bscscan.com |
| Block Time | ~0.45s | ~3s |
| Faucet | - | https://testnet.bnbchain.org/faucet-smart |

### taste-skill 设计规范摘要
- 字体: Geist / Satoshi / Cabinet Grotesk (禁止 Inter)
- 颜色: 最多1个强调色，饱和度 < 80%，禁止紫色渐变
- 布局: 禁止居中 Hero，使用非对称布局
- 动画: Spring Physics，禁止 linear easing
- 性能: 只用 transform/opacity 做动画，禁止 top/left/width/height
- 响应式: min-h-[100dvh] 代替 h-screen
- Grid: 用 CSS Grid 代替 flex 百分比计算

---

## 风险与注意事项

1. **区块时间估算**: BSC 出块 ~0.45s，但用户输入的是日期，需要可靠的时间↔区块转换
2. **IPFS 上传**: 使用 Pinata 或 NFT.Storage，需要处理上传失败和重试
3. **私密胶囊加密**: 使用接收者公钥加密内容，只有接收者能解密
4. **Gas 估算**: createCapsule 需要合理的 gas limit 设置
5. **合约升级**: 当前设计不可升级，如需升级考虑使用 Proxy 模式

---

## 执行选项

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — 每个 Task 分配一个独立子代理，任务间审查，快速迭代
2. **Inline Execution** — 在当前会话逐个执行，带检查点审查

选择哪种方式？
