'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CapsuleCard from './CapsuleCard'

interface CapsuleData {
  id: number
  creator_address: string
  content_preview: string
  unlock_block: number
  is_opened: boolean
  bnb_amount_wei: string
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
      type: 'spring',
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

export default function CapsulePlaza() {
  const [capsules, setCapsules] = useState<CapsuleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('capsules')
      .select('id, creator_address, content_preview, unlock_block, is_opened, bnb_amount_wei')
      .eq('is_public', true)
      .order('created_at_chain', { ascending: false })
      .limit(50)
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setCapsules(data || [])
        }
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
        <p className="text-sm text-zinc-500">加载失败: {error}</p>
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
          className="
            inline-block px-5 py-2 text-sm rounded-lg
            border border-zinc-700 text-zinc-300
            hover:bg-zinc-800 hover:border-zinc-600
            transition-colors
          "
        >
          创建胶囊
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mt-8 columns-1 md:columns-2 lg:columns-3 gap-6"
    >
      {capsules.map((capsule) => (
        <motion.div key={capsule.id} variants={item}>
          <CapsuleCard
            id={capsule.id}
            creator={capsule.creator_address}
            contentPreview={capsule.content_preview}
            unlockBlock={capsule.unlock_block}
            isOpened={capsule.is_opened}
            bnbAmount={capsule.bnb_amount_wei}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
