'use client'

import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n/context'

const sectionDelay = 0.1

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: sectionDelay }}
      className="mb-16"
    >
      <h2 className="text-xl font-semibold text-white mb-6 tracking-tight">{title}</h2>
      <div className="space-y-4 text-[14px] leading-[1.8] text-zinc-400">
        {children}
      </div>
    </motion.section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-medium text-zinc-200 mb-3">{title}</h3>
      <div className="space-y-3 text-[14px] leading-[1.8] text-zinc-400">
        {children}
      </div>
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2.5 px-3 text-zinc-300 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.03]">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-3 text-zinc-400">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function WhitepaperPage() {
  const { t, locale } = useI18n()

  if (locale !== 'zh') {
    return <WhitepaperEN />
  }

  return (
    <main className="min-h-screen bg-[#060608]">
      <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 mb-6">
            <span className="text-[11px] text-zinc-500">Technical Whitepaper</span>
            <span className="text-[11px] text-zinc-600">v1.0</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            ChainCapsule 白皮书
          </h1>
          <p className="text-zinc-500 text-sm">
            链上时光胶囊 — 基于 BNB Smart Chain 的去中心化时间锁定协议
          </p>
          <div className="mt-6 flex items-center gap-4 text-[12px] text-zinc-600">
            <span>版本 1.0</span>
            <span>·</span>
            <span>2026 年 5 月</span>
            <span>·</span>
            <span>BNB Smart Chain</span>
          </div>
        </motion.div>

        {/* Abstract */}
        <Section title="摘要">
          <p>
            ChainCapsule 是一个部署在 BNB Smart Chain 上的去中心化时光胶囊协议。用户可以将文字内容加密存储在 IPFS 上，
            并在链上设定一个基于区块号的未来时间点作为"解锁时间"。只有到达指定区块后，胶囊才能被打开。
          </p>
          <p>
            本协议解决了数字时代"时间胶囊"的核心信任问题：传统的时间胶囊依赖于中心化机构的保管，
            而 ChainCapsule 利用区块链的不可篡改性和智能合约的自动执行特性，确保胶囊内容在到达指定时间前
            任何人都无法访问——包括创建者本人和平台运营方。
          </p>
        </Section>

        {/* Problem */}
        <Section title="1. 问题陈述">
          <p>
            在数字化时代，人们越来越依赖中心化平台来存储和管理个人信息。然而，这些平台存在以下根本性问题：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong className="text-zinc-300">信任依赖</strong>：用户必须信任平台不会提前查看、篡改或删除内容</li>
            <li><strong className="text-zinc-300">单点故障</strong>：中心化服务器可能宕机、被攻击或关停</li>
            <li><strong className="text-zinc-300">时间控制缺失</strong>：没有密码学层面的时间锁定机制</li>
            <li><strong className="text-zinc-300">数据主权</strong>：用户不真正拥有自己的数据</li>
          </ul>
        </Section>

        {/* Solution */}
        <Section title="2. 解决方案">
          <p>
            ChainCapsule 通过以下技术组合解决上述问题：
          </p>

          <SubSection title="2.1 区块号时间锁">
            <p>
              利用区块链的区块号作为时间锚点。由于 BSC 平均出块时间为 3 秒，
              我们可以将目标时间转换为预估区块号，实现精确的时间锁定。
              智能合约在合约层面强制执行此限制——未到达目标区块号时，
              <code className="text-emerald-400/80 bg-emerald-400/[0.06] px-1.5 py-0.5 rounded text-[12px]">openCapsule()</code> 函数将 revert。
            </p>
          </SubSection>

          <SubSection title="2.2 IPFS 去中心化存储">
            <p>
              胶囊内容通过 Pinata 上传至 IPFS，返回的 CID（Content Identifier）作为内容的唯一指纹存储在链上。
              IPFS 的内容寻址特性确保：相同内容永远对应相同 CID，任何篡改都会导致 CID 变化。
            </p>
          </SubSection>

          <SubSection title="2.3 客户端端到端加密">
            <p>
              对于私密胶囊，内容在浏览器端使用 AES-256-GCM 算法加密后再上传至 IPFS。
              加密密钥通过 URL fragment（#key=xxx）传递给指定领取人，fragment 不会被发送到服务器，
              确保只有拥有密钥的人才能解密内容。
            </p>
          </SubSection>
        </Section>

        {/* Architecture */}
        <Section title="3. 系统架构">
          <Table
            headers={['层级', '技术选型', '职责']}
            rows={[
              ['前端', 'Next.js 15 + Tailwind CSS', '用户界面、钱包连接、客户端加密'],
              ['Web3 层', 'wagmi v2 + viem', '区块链交互、交易签名、事件监听'],
              ['智能合约', 'Solidity ^0.8.20', '核心业务逻辑、时间锁、BNB 管理'],
              ['存储层', 'IPFS (Pinata)', '去中心化内容存储'],
              ['数据库', 'Supabase (PostgreSQL)', '评论、点赞等社交功能'],
              ['部署', 'Vercel + Hardhat', '前端部署、合约编译部署'],
            ]}
          />
        </Section>

        {/* Smart Contract */}
        <Section title="4. 智能合约设计">
          <SubSection title="4.1 数据结构">
            <pre className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 text-[12px] text-zinc-400 overflow-x-auto">
{`struct Capsule {
    address creator;        // 创建者地址
    address recipient;      // 领取人地址 (0x0 = 公开)
    string ipfsCid;         // IPFS 内容标识符
    uint256 targetBlock;    // 解锁区块号
    uint256 bnbValue;       // 附加的 BNB 金额
    bool isOpened;          // 是否已打开
    bool exists;            // 是否存在
}`}
            </pre>
          </SubSection>

          <SubSection title="4.2 核心函数">
            <Table
              headers={['函数', '访问控制', '说明']}
              rows={[
                ['createCapsule()', 'Public', '创建时光胶囊，可附带 BNB'],
                ['openCapsule(id)', 'Public / Recipient', '到达解锁区块后打开胶囊'],
                ['withdrawBnb(id)', 'Recipient', '提取胶囊中的 BNB'],
                ['reclaimBnb(id)', 'Creator', '创建者在 ~365 天后回收无人领取的 BNB'],
                ['getCapsule(id)', 'View', '查询胶囊信息'],
                ['getCapsuleCount()', 'View', '获取胶囊总数'],
              ]}
            />
          </SubSection>

          <SubSection title="4.3 安全机制">
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-zinc-300">ReentrancyGuard</strong>：OpenZeppelin 防重入攻击保护</li>
              <li><strong className="text-zinc-300">Pausable</strong>：紧急暂停机制，合约所有者可在紧急情况下暂停所有操作</li>
              <li><strong className="text-zinc-300">Checks-Effects-Interactions</strong>：严格遵循状态变更优先于外部调用的安全模式</li>
              <li><strong className="text-zinc-300">Custom Errors</strong>：使用自定义错误替代 require 字符串，节省 Gas</li>
              <li><strong className="text-zinc-300">Ownable</strong>：关键管理功能仅限合约所有者</li>
            </ul>
          </SubSection>
        </Section>

        {/* Token Economics */}
        <Section title="5. 经济模型">
          <p>
            ChainCapsule 本身不发行代币。经济模型基于 BNB 的原生价值转移：
          </p>
          <Table
            headers={['场景', 'BNB 流向', '说明']}
            rows={[
              ['创建胶囊（附带 BNB）', 'Creator → Contract', 'BNB 锁定在合约中'],
              ['打开胶囊（有 recipient）', 'Contract → Recipient', '指定领取人提取 BNB'],
              ['打开胶囊（无 recipient）', 'Contract → Creator', '创建者回收 BNB'],
              ['超时回收（~365 天）', 'Contract → Creator', '无人领取时创建者可回收'],
            ]}
          />
          <p>
            平台不收取任何手续费，所有 BNB 流转完全在用户之间进行。合约仅作为可信的第三方托管。
          </p>
        </Section>

        {/* Gas Optimization */}
        <Section title="6. Gas 优化">
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>使用 <code className="text-emerald-400/80 bg-emerald-400/[0.06] px-1.5 py-0.5 rounded text-[12px]">mapping</code> 替代数组存储胶囊数据，O(1) 访问</li>
            <li>自定义错误（Custom Errors）替代 require 字符串，节省部署和运行 Gas</li>
            <li>紧凑的结构体布局，减少存储槽使用</li>
            <li>事件（Events）用于链下索引，避免额外存储</li>
            <li><code className="text-emerald-400/80 bg-emerald-400/[0.06] px-1.5 py-0.5 rounded text-[12px]">immutable</code> 变量减少 SLOAD 操作</li>
          </ul>
        </Section>

        {/* Roadmap */}
        <Section title="7. 路线图">
          <Table
            headers={['阶段', '时间', '目标']}
            rows={[
              ['Phase 1', '2026 Q1-Q2', 'BSC 测试网上线、核心功能完成、安全测试'],
              ['Phase 2', '2026 Q3', 'BSC 主网部署、安全审计、DappBay 上线'],
              ['Phase 3', '2026 Q4', '多链支持 (Ethereum, Polygon)、社交功能增强'],
              ['Phase 4', '2027 Q1', 'NFT 胶囊、DAO 治理、API 开放'],
            ]}
          />
        </Section>

        {/* Security */}
        <Section title="8. 安全审计">
          <p>
            ChainCapsule 合约经过以下安全措施验证：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>20 个单元测试全覆盖，包括边界条件和异常路径</li>
            <li>Slither 静态分析无高危漏洞</li>
            <li>遵循 OpenZeppelin 安全最佳实践</li>
            <li>计划进行第三方专业安全审计</li>
          </ul>
        </Section>

        {/* Disclaimer */}
        <Section title="9. 免责声明">
          <p className="text-zinc-500 text-[13px]">
            本白皮书仅供参考，不构成任何投资建议。ChainCapsule 是一个开源的去中心化应用，
            用户使用前应充分了解区块链技术和智能合约的风险。部署在测试网上的合约地址仅用于开发测试，
            主网合约地址将在安全审计完成后公布。
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white/[0.04] text-center">
          <p className="text-[12px] text-zinc-600">
            © 2026 ChainCapsule · QingTeng Studio
          </p>
          <p className="text-[11px] text-zinc-700 mt-1">
            Built on BNB Smart Chain
          </p>
        </div>
      </div>
    </main>
  )
}

function WhitepaperEN() {
  return (
    <main className="min-h-screen bg-[#060608]">
      <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 mb-6">
            <span className="text-[11px] text-zinc-500">Technical Whitepaper</span>
            <span className="text-[11px] text-zinc-600">v1.0</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            ChainCapsule Whitepaper
          </h1>
          <p className="text-zinc-500 text-sm">
            On-Chain Time Capsule — A Decentralized Time-Lock Protocol on BNB Smart Chain
          </p>
          <div className="mt-6 flex items-center gap-4 text-[12px] text-zinc-600">
            <span>Version 1.0</span>
            <span>·</span>
            <span>May 2026</span>
            <span>·</span>
            <span>BNB Smart Chain</span>
          </div>
        </motion.div>

        <Section title="Abstract">
          <p>
            ChainCapsule is a decentralized time capsule protocol deployed on BNB Smart Chain. Users can encrypt and store text content on IPFS, setting a future block number as the &quot;unlock time&quot; on-chain. Capsules can only be opened after the target block is reached.
          </p>
          <p>
            This protocol solves the core trust problem of digital time capsules: traditional time capsules rely on centralized institutions for custody, while ChainCapsule leverages blockchain immutability and smart contract automation to ensure capsule contents remain inaccessible to anyone — including the creator and the platform — until the specified time.
          </p>
        </Section>

        <Section title="1. Problem Statement">
          <p>In the digital age, people increasingly rely on centralized platforms to store personal information. These platforms have fundamental issues:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong className="text-zinc-300">Trust Dependency</strong>: Users must trust platforms not to view, tamper with, or delete content prematurely</li>
            <li><strong className="text-zinc-300">Single Point of Failure</strong>: Centralized servers can crash, be attacked, or shut down</li>
            <li><strong className="text-zinc-300">No Time Control</strong>: No cryptographic time-lock mechanism exists</li>
            <li><strong className="text-zinc-300">Data Sovereignty</strong>: Users don&apos;t truly own their data</li>
          </ul>
        </Section>

        <Section title="2. Solution">
          <SubSection title="2.1 Block Number Time Lock">
            <p>
              Leveraging blockchain block numbers as time anchors. With BSC averaging 3-second block times, we convert target times to estimated block numbers for precise time locking. The smart contract enforces this at the contract level — <code className="text-emerald-400/80 bg-emerald-400/[0.06] px-1.5 py-0.5 rounded text-[12px]">openCapsule()</code> reverts if the target block hasn&apos;t been reached.
            </p>
          </SubSection>
          <SubSection title="2.2 IPFS Decentralized Storage">
            <p>
              Capsule content is uploaded to IPFS via Pinata. The returned CID (Content Identifier) is stored on-chain as the unique fingerprint. IPFS content-addressing ensures identical content always maps to the same CID — any tampering changes the CID.
            </p>
          </SubSection>
          <SubSection title="2.3 Client-Side End-to-End Encryption">
            <p>
              For private capsules, content is encrypted with AES-256-GCM in the browser before uploading to IPFS. The encryption key is shared via URL fragment (#key=xxx), which is never sent to the server, ensuring only key holders can decrypt.
            </p>
          </SubSection>
        </Section>

        <Section title="3. System Architecture">
          <Table
            headers={['Layer', 'Technology', 'Responsibility']}
            rows={[
              ['Frontend', 'Next.js 15 + Tailwind CSS', 'UI, wallet connection, client-side encryption'],
              ['Web3', 'wagmi v2 + viem', 'Blockchain interaction, tx signing, event listening'],
              ['Smart Contract', 'Solidity ^0.8.20', 'Core logic, time lock, BNB management'],
              ['Storage', 'IPFS (Pinata)', 'Decentralized content storage'],
              ['Database', 'Supabase (PostgreSQL)', 'Comments, likes — social features'],
              ['Deployment', 'Vercel + Hardhat', 'Frontend deploy, contract compilation & deploy'],
            ]}
          />
        </Section>

        <Section title="4. Smart Contract Design">
          <SubSection title="4.1 Data Structure">
            <pre className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 text-[12px] text-zinc-400 overflow-x-auto">
{`struct Capsule {
    address creator;        // Creator address
    address recipient;      // Recipient (0x0 = public)
    string ipfsCid;         // IPFS Content Identifier
    uint256 targetBlock;    // Unlock block number
    uint256 bnbValue;       // Attached BNB amount
    bool isOpened;          // Whether opened
    bool exists;            // Whether exists
}`}
            </pre>
          </SubSection>
          <SubSection title="4.2 Security Mechanisms">
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-zinc-300">ReentrancyGuard</strong>: OpenZeppelin reentrancy protection</li>
              <li><strong className="text-zinc-300">Pausable</strong>: Emergency pause mechanism</li>
              <li><strong className="text-zinc-300">Checks-Effects-Interactions</strong>: State changes before external calls</li>
              <li><strong className="text-zinc-300">Custom Errors</strong>: Gas-efficient error handling</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="5. Economic Model">
          <p>ChainCapsule does not issue tokens. The economic model is based on native BNB value transfer:</p>
          <Table
            headers={['Scenario', 'BNB Flow', 'Description']}
            rows={[
              ['Create (with BNB)', 'Creator → Contract', 'BNB locked in contract'],
              ['Open (with recipient)', 'Contract → Recipient', 'Designated recipient withdraws'],
              ['Open (no recipient)', 'Contract → Creator', 'Creator reclaims BNB'],
              ['Timeout (~365 days)', 'Contract → Creator', 'Creator can reclaim unclaimed BNB'],
            ]}
          />
          <p>The platform charges no fees — all BNB transfers occur peer-to-peer. The contract serves only as a trusted escrow.</p>
        </Section>

        <Section title="6. Roadmap">
          <Table
            headers={['Phase', 'Timeline', 'Goals']}
            rows={[
              ['Phase 1', '2026 Q1-Q2', 'BSC testnet launch, core features, security testing'],
              ['Phase 2', '2026 Q3', 'BSC mainnet deployment, security audit, DappBay listing'],
              ['Phase 3', '2026 Q4', 'Multi-chain (Ethereum, Polygon), enhanced social features'],
              ['Phase 4', '2027 Q1', 'NFT capsules, DAO governance, open API'],
            ]}
          />
        </Section>

        <Section title="7. Disclaimer">
          <p className="text-zinc-500 text-[13px]">
            This whitepaper is for informational purposes only and does not constitute investment advice. ChainCapsule is an open-source decentralized application. Users should fully understand the risks of blockchain technology and smart contracts before use.
          </p>
        </Section>

        <div className="mt-20 pt-8 border-t border-white/[0.04] text-center">
          <p className="text-[12px] text-zinc-600">© 2026 ChainCapsule · QingTeng Studio</p>
          <p className="text-[11px] text-zinc-700 mt-1">Built on BNB Smart Chain</p>
        </div>
      </div>
    </main>
  )
}
