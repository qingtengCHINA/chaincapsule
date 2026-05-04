'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatEther } from 'viem'
import { Coin } from '@phosphor-icons/react'

interface CapsuleCardProps {
  id: number
  creator: string
  contentPreview: string
  unlockBlock: number
  isOpened: boolean
  bnbAmount: string
}

function truncateAddress(addr: string): string {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function BlockCountdown({ unlockBlock }: { unlockBlock: number }) {
  // Approximate: BSC block ~3s, show estimated remaining time
  // We estimate current block from timestamp heuristic
  // For display, just show the unlock block number as reference
  return (
    <span className="text-xs text-zinc-500 font-mono">
      #{unlockBlock.toLocaleString()}
    </span>
  )
}

export default function CapsuleCard({
  id,
  creator,
  contentPreview,
  unlockBlock,
  isOpened,
  bnbAmount,
}: CapsuleCardProps) {
  const bnbValue = bnbAmount ? parseFloat(formatEther(BigInt(bnbAmount))) : 0

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="break-inside-avoid mb-6"
    >
      <Link href={`/capsule/${id}`} className="block group">
        <div
          className="
            rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-5
            transition-all duration-200
            hover:border-zinc-700/70 hover:bg-zinc-900/60
            hover:shadow-[0_0_20px_rgba(113,113,122,0.08)]
            active:scale-[0.98]
          "
        >
          {/* Header: creator + status */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-500 font-mono tracking-wide">
              {truncateAddress(creator)}
            </span>
            {isOpened ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                已解锁
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-500 border border-zinc-800/50 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
                <BlockCountdown unlockBlock={unlockBlock} />
              </span>
            )}
          </div>

          {/* Content preview */}
          <p className="text-sm text-zinc-300 leading-relaxed mb-4 line-clamp-3">
            {contentPreview?.length > 80
              ? `${contentPreview.slice(0, 80)}...`
              : contentPreview || '加密内容'}
          </p>

          {/* Footer: BNB amount */}
          {bnbValue > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Coin size={14} weight="fill" className="text-zinc-600" />
              <span className="font-mono">{bnbValue.toFixed(4)} BNB</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
