'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { formatEther } from 'viem'
import { Coin, ArrowLeft } from '@phosphor-icons/react'
import Link from 'next/link'
import { useCapsule, useBlocksUntilUnlock, useOpenCapsule } from '@/lib/contracts/hooks'
import { truncateAddress, formatBNB } from '@/lib/utils/format'
import CapsuleTimeline from '@/components/capsule/CapsuleTimeline'
import OpenAnimation from '@/components/capsule/OpenAnimation'

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 }

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded bg-zinc-800/60 ${className}`}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12">
      <div className="flex flex-col gap-6">
        {/* Back button skeleton */}
        <SkeletonBlock className="h-4 w-20" />

        {/* Header */}
        <div className="flex flex-col gap-3">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-4 w-32" />
        </div>

        {/* Info cards */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-6 flex flex-col gap-4">
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-32" />
          </div>
          <div className="border-t border-zinc-800/50" />
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
          <div className="border-t border-zinc-800/50" />
          <div className="flex justify-between">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="flex flex-col items-center gap-3 py-8">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
      </div>
    </div>
  )
}

function formatDate(timestamp: bigint | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
  if (ts === 0) return '--'
  return new Date(ts * 1000).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function CapsulePage() {
  const params = useParams()
  const capsuleId = params?.id ? BigInt(params.id as string) : BigInt(0)

  const { data: capsule, isLoading, isError } = useCapsule(capsuleId)
  const { data: blocksUntilUnlock } = useBlocksUntilUnlock(capsuleId)
  const { openCapsule, isPending, isSuccess } = useOpenCapsule()

  const [content, setContent] = useState<string | null>(null)
  const [isFetchingContent, setIsFetchingContent] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const isOpened = capsule ? capsule.isOpened : false
  const unlockBlock = capsule ? Number(capsule.unlockBlock) : 0
  const contentHash = capsule ? capsule.contentHash : ''

  // Fetch content from IPFS when capsule is opened
  const fetchContent = useCallback(async (cid: string) => {
    if (!cid) return
    setIsFetchingContent(true)
    setContentError(null)
    try {
      const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`)
      if (!res.ok) throw new Error('获取内容失败')
      const data = await res.json()
      setContent(data.content || data)
    } catch {
      setContentError('无法获取胶囊内容')
    } finally {
      setIsFetchingContent(false)
    }
  }, [])

  // Fetch content when capsule is already opened
  useEffect(() => {
    if (isOpened && contentHash && !content) {
      fetchContent(contentHash)
    }
  }, [isOpened, contentHash, content, fetchContent])

  // Handle openCapsule transaction success
  useEffect(() => {
    if (isSuccess && contentHash) {
      fetchContent(contentHash)
    }
  }, [isSuccess, contentHash, fetchContent])

  const handleOpen = () => {
    if (isOpened) {
      // Already opened, just show content
      setShowAnimation(true)
      if (contentHash && !content) {
        fetchContent(contentHash)
      }
    } else {
      openCapsule(capsuleId)
    }
  }

  // Trigger animation when content is fetched after opening
  useEffect(() => {
    if ((isSuccess || isOpened) && content && !showAnimation) {
      setShowAnimation(true)
    }
  }, [isSuccess, isOpened, content, showAnimation])

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-[100dvh] bg-zinc-950">
        <LoadingSkeleton />
      </main>
    )
  }

  // Error state
  if (isError || !capsule) {
    return (
      <main className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <p className="text-lg text-zinc-300">胶囊未找到</p>
          <p className="text-sm text-zinc-600">该胶囊不存在或已被销毁</p>
          <Link
            href="/plaza"
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors active:scale-[0.98]"
          >
            返回广场
          </Link>
        </motion.div>
      </main>
    )
  }

  const bnbValue = capsule.bnbAmount
    ? parseFloat(formatEther(capsule.bnbAmount))
    : 0

  return (
    <main className="min-h-[100dvh] bg-zinc-950">
      {/* Open animation overlay */}
      <OpenAnimation
        isOpen={showAnimation && !!content}
        content={content || ''}
        onComplete={() => {
          // Animation complete, page shows content inline too
        }}
      />

      <motion.div
        className="w-full max-w-lg mx-auto px-4 py-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
      >
        {/* Back link */}
        <Link
          href="/plaza"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-400 transition-colors mb-8 active:scale-[0.98]"
        >
          <ArrowLeft size={14} />
          <span>返回广场</span>
        </Link>

        {/* Capsule info header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-zinc-100 tracking-tight mb-1">
            胶囊 #{capsule.id.toString()}
          </h1>
          <p className="text-sm text-zinc-600 font-mono">
            {truncateAddress(capsule.creator)}
          </p>
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-6 mb-8">
          <div className="flex flex-col gap-0">
            <InfoRow label="创建者" value={truncateAddress(capsule.creator)} mono />
            <Divider />
            <InfoRow label="创建时间" value={formatDate(capsule.createdAt)} />
            <Divider />
            <InfoRow label="解锁区块" value={`#${unlockBlock.toLocaleString()}`} mono />
            <Divider />
            <InfoRow
              label="状态"
              value={isOpened ? '已打开' : '未打开'}
              valueClass={isOpened ? 'text-zinc-300' : 'text-zinc-500'}
            />
            {capsule.isPublic && (
              <>
                <Divider />
                <InfoRow label="可见性" value="公开" />
              </>
            )}
            {bnbValue > 0 && (
              <>
                <Divider />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-600">BNB</span>
                  <div className="flex items-center gap-1.5">
                    <Coin size={14} weight="fill" className="text-zinc-600" />
                    <span className="text-sm text-zinc-300 font-mono">
                      {bnbValue.toFixed(4)} BNB
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content or Timeline */}
        <AnimatePresence mode="wait">
          {content ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={SPRING}
            >
              <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/60 p-8">
                {/* Letter header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-xs text-zinc-500 font-mono">C</span>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider">
                      Time Capsule
                    </p>
                    <p className="text-xs text-zinc-700">
                      {formatDate(capsule.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Letter content */}
                <p className="text-base leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  {content}
                </p>
              </div>
            </motion.div>
          ) : isFetchingContent ? (
            <motion.div
              key="fetching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-12"
            >
              <motion.div
                className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-zinc-600">获取胶囊内容中...</p>
            </motion.div>
          ) : contentError ? (
            <motion.div
              key="content-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-12"
            >
              <p className="text-sm text-red-400">{contentError}</p>
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={SPRING}
            >
              <CapsuleTimeline
                unlockBlock={unlockBlock}
                isOpened={isOpened}
                onOpen={handleOpen}
                isPending={isPending}
              />

              {/* Transaction status */}
              <AnimatePresence>
                {isPending && (
                  <motion.div
                    className="flex flex-col items-center gap-2 mt-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={SPRING}
                  >
                    <p className="text-xs text-zinc-600">
                      请在钱包中确认交易...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  )
}

function InfoRow({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string
  value: string
  mono?: boolean
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-zinc-600">{label}</span>
      <span
        className={`text-sm text-zinc-300 ${mono ? 'font-mono' : ''} ${valueClass || ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-zinc-800/50" />
}
