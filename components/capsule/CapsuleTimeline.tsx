'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useBlockNumber } from 'wagmi'
import { formatCountdown } from '@/lib/utils/blockTime'

const BSC_BLOCK_TIME_SECONDS = 0.45

interface CapsuleTimelineProps {
  unlockBlock: number
  isOpened: boolean
  onOpen: () => void
  isPending?: boolean
}

export default function CapsuleTimeline({
  unlockBlock,
  isOpened,
  onOpen,
  isPending = false,
}: CapsuleTimelineProps) {
  const { data: currentBlock } = useBlockNumber({ watch: true })
  const current = currentBlock ? Number(currentBlock) : 0
  const blocksRemaining = unlockBlock - current
  const isUnlocked = blocksRemaining <= 0

  const totalSeconds = Math.max(0, blocksRemaining * BSC_BLOCK_TIME_SECONDS)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)

  if (isOpened) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-zinc-500">此胶囊已被打开</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-xs text-zinc-600 uppercase tracking-widest">
              距离解锁还剩
            </p>
            <p className="text-2xl font-mono text-zinc-200 tracking-tight">
              {blocksRemaining.toLocaleString()} 个区块
            </p>
            <p className="text-sm text-zinc-500">
              ≈ {days > 0 && `${days}天 `}{hours}小时
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-xs mt-4">
              <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-zinc-600"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(100, Math.max(0, 50))}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.p
              className="text-lg text-zinc-200"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              可以打开了
            </motion.p>

            <motion.button
              onClick={onOpen}
              disabled={isPending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-zinc-950 font-medium h-12 px-8 text-base active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? '打开中...' : '打开'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
