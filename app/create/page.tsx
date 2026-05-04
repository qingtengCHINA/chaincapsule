'use client'

import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Lock, Rocket } from '@phosphor-icons/react'
import CapsuleForm from '@/components/capsule/CapsuleForm'
import ConnectButton from '@/components/wallet/ConnectButton'

function ConnectPrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <Lock size={32} className="text-zinc-500" weight="duotone" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight mb-2">需要连接钱包</h2>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        连接你的 Web3 钱包以创建链上时光胶囊
      </p>
      <ConnectButton />
    </motion.div>
  )
}

export default function CreatePage() {
  const { isConnected } = useAccount()

  return (
    <main className="min-h-[100dvh] bg-zinc-950 px-4 py-12">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Rocket size={20} weight="duotone" className="text-zinc-400" />
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">创建胶囊</h1>
          </div>
          <p className="text-sm text-zinc-500 mb-8 ml-[32px]">封存你的话语，留给未来的某个人</p>
        </motion.div>

        {isConnected ? <CapsuleForm /> : <ConnectPrompt />}
      </div>
    </main>
  )
}
