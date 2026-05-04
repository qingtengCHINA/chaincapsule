'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { Wallet, Plus, CaretDown } from '@phosphor-icons/react'
import { useUserCapsules, useCapsule, useBlocksUntilUnlock } from '@/lib/contracts/hooks'
import { truncateAddress } from '@/lib/utils/format'
import ConnectButton from '@/components/wallet/ConnectButton'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const CONTRACT_ADDRESS_TESTNET = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || ''

type TabKey = 'all' | 'locked' | 'unlocked'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'locked', label: '未解锁' },
  { key: 'unlocked', label: '已解锁' },
]

const FAQ_ITEMS = [
  {
    q: '网站没了，我的 BNB 还能取出来吗？',
    a: '能。合约部署在 BNB Smart Chain 区块链上，跟网站完全独立。网站只是个"遥控器"，合约才是"保险箱"。你可以直接去 BSCScan 操作：打开 testnet.bscscan.com → 搜索合约地址 → Contract → Write Contract → 连接钱包 → 调用 withdrawBnb(id) 或 reclaimBnb(id)。',
  },
  {
    q: '合约地址在哪？',
    a: `BSC Testnet: ${CONTRACT_ADDRESS_TESTNET || '未部署'}。这个地址就是合约在链上的"门牌号"，永久存在，不会消失。你可以在 BSCScan 上查看所有交易记录。`,
  },
  {
    q: '胶囊 ID 是什么？是密码吗？',
    a: '不是密码。胶囊 ID 是链上的编号（1, 2, 3...），用于定位你的胶囊。任何人都能用 ID 查看公开胶囊的信息，但只有你的钱包签名才能开胶囊和提 BNB。安全靠的是你的钱包私钥，不是 ID。但你仍然需要记住 ID 来操作你的胶囊。',
  },
  {
    q: '创建胶囊后要注意什么？',
    a: '请务必记下你的胶囊 ID（创建成功后会显示）。虽然你的钱包地址关联了所有胶囊，但直接通过 BSCScan 操作时需要输入 ID。建议截图保存或记在本地。',
  },
  {
    q: 'BNB 附加功能安全吗？',
    a: '合约使用了 OpenZeppelin 的 ReentrancyGuard 防重入攻击，withdrawBnb 和 reclaimBnb 都有 nonReentrant 保护。BNB 锁在合约里，只有创建者或指定接收人能提取。如果长期无人提取（约 365 天），创建者可以回收。合约源码开源，可在 GitHub 和 BSCScan 上审查。',
  },
  {
    q: '合约经过审计了吗？',
    a: '目前合约使用了 OpenZeppelin 标准库（Ownable, ReentrancyGuard, Pausable），有 20 个单元测试覆盖。合约源码开源在 GitHub。对于小额使用已经足够安全。未来如果项目规模增大，会考虑专业审计。',
  },
]

function FAQItem({ item, index }: { item: typeof FAQ_ITEMS[0]; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-zinc-800/40 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors pr-4">
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <CaretDown size={16} className="text-zinc-600" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-zinc-500 leading-relaxed pb-4">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded bg-zinc-800/60 ${className}`}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function CapsuleRowSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-5 w-16" />
        <SkeletonBlock className="h-5 w-20" />
      </div>
      <SkeletonBlock className="h-4 w-28" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonBlock className="h-5 w-24" />
      </div>
      <div className="flex items-center gap-3 mb-6">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-5 w-20" />
      </div>
      <div className="flex gap-1 p-1 rounded-lg bg-zinc-900/50 border border-zinc-800/50 mb-6">
        <SkeletonBlock className="flex-1 h-9 rounded-md" />
        <SkeletonBlock className="flex-1 h-9 rounded-md" />
        <SkeletonBlock className="flex-1 h-9 rounded-md" />
      </div>
      <CapsuleRowSkeleton />
      <CapsuleRowSkeleton />
      <CapsuleRowSkeleton />
    </div>
  )
}

interface CapsuleRowProps {
  capsuleId: bigint
  tab: TabKey
}

function CapsuleRow({ capsuleId, tab }: CapsuleRowProps) {
  const { data: capsule, isLoading } = useCapsule(capsuleId)
  const { data: blocksUntilUnlock } = useBlocksUntilUnlock(capsuleId)

  if (isLoading || !capsule) {
    if (tab !== 'all') return null
    return <CapsuleRowSkeleton />
  }

  const isOpened = capsule.isOpened
  const unlockBlock = Number(capsule.unlockBlock)
  const remaining = blocksUntilUnlock !== undefined ? Number(blocksUntilUnlock) : -1
  const isLocked = !isOpened && remaining > 0
  const isUnlocked = isOpened || (!isOpened && remaining <= 0)

  if (tab === 'locked' && !isLocked) return null
  if (tab === 'unlocked' && !isUnlocked) return null

  let statusLabel: string
  let statusColor: string
  if (isOpened) {
    statusLabel = '已打开'
    statusColor = 'text-zinc-400 bg-zinc-800 border-zinc-700/50'
  } else if (remaining <= 0) {
    statusLabel = '已解锁'
    statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
  } else {
    statusLabel = '未解锁'
    statusColor = 'text-amber-400/80 bg-amber-950/30 border-amber-800/30'
  }

  return (
    <motion.div whileHover={{ x: 2 }} transition={SPRING} layout>
      <Link
        href={`/capsule/${capsuleId}`}
        className="block rounded-lg border border-zinc-800/40 bg-zinc-900/30 p-4 transition-all duration-200 hover:border-zinc-700/60 hover:bg-zinc-900/50 active:scale-[0.98] group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
              #{capsuleId.toString()}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isOpened && (
              <span className="text-xs text-zinc-600 font-mono">
                区块 #{unlockBlock.toLocaleString()}
              </span>
            )}
            <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function FilteredList({ ids, tab }: { ids: readonly bigint[]; tab: TabKey }) {
  if (ids.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
      >
        <p className="text-sm text-zinc-500">还没有胶囊，创建你的第一颗</p>
        <Link href="/create">
          <button className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 px-5 py-2.5 text-sm font-medium transition-transform active:scale-[0.98] hover:bg-zinc-200">
            <Plus size={16} weight="bold" />
            创建胶囊
          </button>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {ids.map((id) => (
        <CapsuleRow key={id.toString()} capsuleId={id} tab={tab} />
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { data: capsuleIds, isLoading } = useUserCapsules(address)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [recipientIds, setRecipientIds] = useState<number[]>([])

  // Fetch capsules where user is recipient
  useEffect(() => {
    if (!address) return
    fetch(`/api/recipient-capsules?address=${address}`)
      .then(res => res.json())
      .then(data => setRecipientIds(data.capsuleIds || []))
      .catch(() => {})
  }, [address])

  if (!isConnected || !address) {
    return (
      <main className="min-h-[100dvh] bg-zinc-950">
        <div className="mx-auto max-w-2xl px-4 py-20">
          <motion.div
            className="flex flex-col items-center justify-center gap-6 text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
          >
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Wallet size={28} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-lg text-zinc-300 mb-2">连接钱包查看你的胶囊</p>
              <p className="text-sm text-zinc-600">连接钱包后，你创建的胶囊会在这里显示</p>
            </div>
            <ConnectButton />
          </motion.div>
        </div>

        {/* FAQ always visible */}
        <FAQSection />
      </main>
    )
  }

  const allIds = capsuleIds ?? []
  const totalCount = allIds.length

  return (
    <main className="min-h-[100dvh] bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-3">
              我的胶囊
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500 font-mono">
                {truncateAddress(address)}
              </span>
              <span className="text-xs text-zinc-700">|</span>
              <span className="text-sm text-zinc-500">
                {isLoading ? '...' : `${totalCount} 颗胶囊`}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="relative flex gap-1 p-1 rounded-lg bg-zinc-900/50 border border-zinc-800/50 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 px-4 py-2 text-sm rounded-md transition-colors active:scale-[0.98] ${activeTab === tab.key ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-400'}`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-md bg-zinc-800 border border-zinc-700/50"
                    transition={SPRING}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <CapsuleRowSkeleton />
              <CapsuleRowSkeleton />
              <CapsuleRowSkeleton />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={SPRING}
              >
                <FilteredList ids={allIds} tab={activeTab} />
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* Recipient capsules */}
      {recipientIds.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 pb-8">
          <div className="border-t border-zinc-800/40 pt-8">
            <h2 className="text-lg font-medium tracking-tight text-zinc-300 mb-4">
              指定给我的胶囊
            </h2>
            <p className="text-xs text-zinc-600 mb-4">
              别人指定你为领取人，你也可以打开这些胶囊并领取 BNB
            </p>
            <div className="flex flex-col gap-2">
              {recipientIds.map((id) => (
                <CapsuleRow key={id} capsuleId={BigInt(id)} tab="all" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <FAQSection />
    </main>
  )
}

function FAQSection() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="border-t border-zinc-800/40 pt-12">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-200 mb-6">
          常见问题
        </h2>
        <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/20 px-5">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
