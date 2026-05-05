'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useBlockNumber } from 'wagmi'
import { MagnifyingGlass } from '@phosphor-icons/react'
import CapsuleCard from './CapsuleCard'

interface CapsuleData {
  id: number
  creator: string
  title: string
  contentHash: string
  unlockBlock: number
  createdAt: number
  bnbAmount: string
  isOpened: boolean
  isPublic: boolean
  recipient: string
  contentPreview?: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

function SkeletonCard() {
  return (
    <div className="break-inside-avoid mb-6">
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-24 bg-zinc-800 rounded" />
          <div className="h-4 w-16 bg-zinc-800 rounded-full" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-zinc-800 rounded" />
          <div className="h-3 w-4/5 bg-zinc-800 rounded" />
          <div className="h-3 w-3/5 bg-zinc-800 rounded" />
        </div>
        <div className="h-3 w-20 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

const filterTabs = [
  { key: 'all' as const, label: '全部' },
  { key: 'unlocked' as const, label: '已解锁' },
  { key: 'locked' as const, label: '未解锁' },
  { key: 'bnb' as const, label: '有 BNB' },
]

export default function CapsulePlaza() {
  const [capsules, setCapsules] = useState<CapsuleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | 'bnb'>('all')

  const { data: currentBlock } = useBlockNumber()

  useEffect(() => {
    fetch('/api/plaza')
      .then((res) => res.json())
      .then((data) => {
        setCapsules(data.capsules || [])
        if (data.error) setError(data.error)
        setLoading(false)
      })
      .catch((err) => {
        setError('加载失败')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="mt-8">
        <SkeletonGrid />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    )
  }

  if (capsules.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-zinc-500 text-sm mb-4">
          还没有公开的胶囊，成为第一个
        </p>
        <Link
          href="/create"
          className="inline-block px-5 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
        >
          创建胶囊
        </Link>
      </div>
    )
  }

  const blockNum = currentBlock ? Number(currentBlock) : 0

  const filtered = capsules.filter((c) => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      c.title.toLowerCase().includes(query) ||
      (c.contentPreview && c.contentPreview.toLowerCase().includes(query))

    const isUnlocked = blockNum > 0 && c.unlockBlock <= blockNum

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'unlocked' && isUnlocked) ||
      (activeFilter === 'locked' && !isUnlocked) ||
      (activeFilter === 'bnb' && parseFloat(c.bnbAmount) > 0)

    return matchesSearch && matchesFilter
  })

  return (
    <div>
      {/* Search + Filter */}
      <div className="mt-8 mb-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索胶囊标题或内容..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-3 sm:py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                activeFilter === tab.key
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-sm">没有匹配的胶囊</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="columns-1 md:columns-2 lg:columns-3 gap-6"
        >
          {filtered.map((capsule) => (
            <motion.div key={capsule.id} variants={item}>
              <CapsuleCard
                id={capsule.id}
                creator={capsule.creator}
                title={capsule.title}
                contentPreview={capsule.contentPreview || ''}
                unlockBlock={capsule.unlockBlock}
                isOpened={capsule.isOpened}
                bnbAmount={capsule.bnbAmount}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
