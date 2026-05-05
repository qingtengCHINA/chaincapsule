'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { Wallet, Plus, CaretDown } from '@phosphor-icons/react'
import { useUserCapsules, useCapsule, useBlocksUntilUnlock } from '@/lib/contracts/hooks'
import { truncateAddress } from '@/lib/utils/format'
import ConnectButton from '@/components/wallet/ConnectButton'
import { useI18n } from '@/lib/i18n/context'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

type TabKey = 'all' | 'locked' | 'unlocked'

function FAQItem({ item, index }: { item: { q: string; a: string }; index: number }) {
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

interface CapsuleRowProps {
  capsuleId: bigint
  tab: TabKey
}

function CapsuleRow({ capsuleId, tab }: CapsuleRowProps) {
  const { data: capsule, isLoading } = useCapsule(capsuleId)
  const { data: blocksUntilUnlock } = useBlocksUntilUnlock(capsuleId)
  const { t } = useI18n()

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
    statusLabel = t('plaza.opened')
    statusColor = 'text-zinc-400 bg-zinc-800 border-zinc-700/50'
  } else if (remaining <= 0) {
    statusLabel = t('plaza.unlocked')
    statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
  } else {
    statusLabel = t('plaza.locked')
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
            {capsule.title && (
              <span className="text-sm text-zinc-300 truncate max-w-[200px]">
                {capsule.title}
              </span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isOpened && (
              <span className="text-xs text-zinc-600 font-mono">
                {t('profile.block')} #{unlockBlock.toLocaleString()}
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
  const { t } = useI18n()
  if (ids.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
      >
        <p className="text-sm text-zinc-500">{t('profile.noCapsulesYet')}</p>
        <Link href="/create">
          <button className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 px-5 py-2.5 text-sm font-medium transition-transform active:scale-[0.98] hover:bg-zinc-200">
            <Plus size={16} weight="bold" />
            {t('create.title')}
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

function FAQSection() {
  const { t } = useI18n()

  const FAQ_ITEMS = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="border-t border-zinc-800/40 pt-12">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-200 mb-6">
          {t('profile.faq')}
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

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { data: capsuleIds, isLoading } = useUserCapsules(address)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [recipientIds, setRecipientIds] = useState<number[]>([])
  const { t } = useI18n()

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: t('profile.tab.all') },
    { key: 'locked', label: t('profile.tab.locked') },
    { key: 'unlocked', label: t('profile.tab.unlocked') },
  ]

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
              <p className="text-lg text-zinc-300 mb-2">{t('profile.connectMsg')}</p>
              <p className="text-sm text-zinc-600">{t('profile.connectDesc')}</p>
            </div>
            <ConnectButton />
          </motion.div>
        </div>
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
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-3">
              {t('profile.title')}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500 font-mono">
                {truncateAddress(address)}
              </span>
              <span className="text-xs text-zinc-700">|</span>
              <span className="text-sm text-zinc-500">
                {isLoading ? '...' : `${totalCount} ${t('profile.capsuleCount')}`}
              </span>
            </div>
          </div>

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

      {recipientIds.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 pb-8">
          <div className="border-t border-zinc-800/40 pt-8">
            <h2 className="text-lg font-medium tracking-tight text-zinc-300 mb-4">
              {t('profile.recipientTitle')}
            </h2>
            <p className="text-xs text-zinc-600 mb-4">
              {t('profile.recipientDesc')}
            </p>
            <div className="flex flex-col gap-2">
              {recipientIds.map((id) => (
                <CapsuleRow key={id} capsuleId={BigInt(id)} tab="all" />
              ))}
            </div>
          </div>
        </div>
      )}

      <FAQSection />
    </main>
  )
}
