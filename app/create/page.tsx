'use client'

import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Lock, Rocket } from '@phosphor-icons/react'
import CapsuleForm from '@/components/capsule/CapsuleForm'
import ConnectButton from '@/components/wallet/ConnectButton'
import { useI18n } from '@/lib/i18n/context'

function ConnectPrompt() {
  const { t } = useI18n()
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
      <h2 className="text-xl font-semibold tracking-tight mb-2">{t('create.needWallet')}</h2>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        {t('create.needWalletDesc')}
      </p>
      <ConnectButton />
    </motion.div>
  )
}

export default function CreatePage() {
  const { isConnected } = useAccount()
  const { t } = useI18n()

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
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{t('create.title')}</h1>
          </div>
          <p className="text-sm text-zinc-500 mb-8 ml-[32px]">{t('create.desc')}</p>
        </motion.div>

        {isConnected ? <CapsuleForm /> : <ConnectPrompt />}
      </div>
    </main>
  )
}
