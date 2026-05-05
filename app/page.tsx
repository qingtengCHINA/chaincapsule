'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import StarField from '@/components/three/StarField'
import Button from '@/components/ui/Button'
import { ArrowRight, HourglassSimple, Plus } from '@phosphor-icons/react'
import { useUserCapsules, useCapsule, useBlocksUntilUnlock } from '@/lib/contracts/hooks'
import { useI18n } from '@/lib/i18n/context'

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: 0.15 + i * 0.12,
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  }),
}

function GlowOrb() {
  return (
    <div className="relative h-56 w-56 md:h-80 md:w-80">
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          animationDuration: '6s',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          transform: 'scale(1.5)',
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), rgba(255,255,255,0.03) 50%, transparent 70%)',
        }}
      />
      <div className="absolute inset-8 rounded-full border border-white/[0.06]" />
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          animationDuration: '4s',
          animationDelay: '1s',
          boxShadow: '0 0 120px 40px rgba(255,255,255,0.03), inset 0 0 60px rgba(255,255,255,0.05)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <HourglassSimple size={48} weight="thin" className="text-white/20" />
      </div>
    </div>
  )
}

function CapsuleMini({ capsuleId }: { capsuleId: bigint }) {
  const { data: capsule } = useCapsule(capsuleId)
  const { data: blocksUntilUnlock } = useBlocksUntilUnlock(capsuleId)
  const { t } = useI18n()

  if (!capsule) return null

  const isOpened = capsule.isOpened
  const remaining = blocksUntilUnlock !== undefined ? Number(blocksUntilUnlock) : -1
  let status = t('plaza.locked')
  let color = 'text-amber-400/80 bg-amber-950/30 border-amber-800/30'
  if (isOpened) {
    status = t('plaza.opened')
    color = 'text-zinc-400 bg-zinc-800 border-zinc-700/50'
  } else if (remaining <= 0) {
    status = t('plaza.unlocked')
    color = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
  }

  return (
    <Link
      href={`/capsule/${capsuleId}`}
      className="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-900/30 px-4 py-3 hover:border-zinc-700/60 hover:bg-zinc-900/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
          #{capsuleId.toString()}
        </span>
        {capsule.title && <span className="text-xs text-zinc-400 truncate max-w-[120px]">{capsule.title}</span>}
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${color}`}>
          {status}
        </span>
      </div>
      <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function MyCapsulesSection() {
  const { address, isConnected } = useAccount()
  const { data: capsuleIds, isLoading } = useUserCapsules(address)
  const { t } = useI18n()

  if (!isConnected) {
    return (
      <section className="px-6 md:px-12 lg:px-20 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="border-t border-zinc-800/50 pt-12">
            <h2 className="text-lg font-medium tracking-tight text-zinc-300">
              {t('profile.title')}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {t('profile.connect')}
            </p>
          </div>
        </div>
      </section>
    )
  }

  const ids = capsuleIds ?? []

  return (
    <section className="px-6 md:px-12 lg:px-20 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="border-t border-zinc-800/50 pt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium tracking-tight text-zinc-300">
                {t('profile.title')}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {isLoading ? t('common.loading') : `${ids.length} ${t('home.capsules')}`}
              </p>
            </div>
            <Link href="/create">
              <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                <Plus size={14} />
                {t('nav.create')}
              </button>
            </Link>
          </div>

          {ids.length === 0 ? (
            <p className="text-sm text-zinc-600 py-8">
              {t('profile.noCapsules')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ids.slice(0, 6).map((id) => (
                <CapsuleMini key={id.toString()} capsuleId={id} />
              ))}
            </div>
          )}

          {ids.length > 6 && (
            <Link href="/profile" className="inline-block mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              {t('home.viewAll')} →
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { t } = useI18n()

  return (
    <>
      <StarField />

      <main className="relative z-10">
        {/* Hero */}
        <section className="min-h-[100dvh] flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-12 lg:gap-20">
              <div>
                <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp} className="mb-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-[11px] tracking-widest uppercase text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    BNB Smart Chain
                  </span>
                </motion.div>

                <motion.h1 custom={1} initial="hidden" animate="show" variants={fadeUp}
                  className="text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.04em]"
                  style={{ fontFamily: 'var(--font-en), var(--font-cn), system-ui' }}
                >
                  <span className="block text-white">Chain</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">Capsule</span>
                </motion.h1>

                <motion.p custom={2} initial="hidden" animate="show" variants={fadeUp}
                  className="mt-6 text-lg md:text-xl text-zinc-400 leading-relaxed max-w-md"
                  style={{ fontFamily: 'var(--font-cn), system-ui' }}
                >
                  {t('home.subtitle')}
                </motion.p>

                <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp} className="mt-10 flex items-center gap-4">
                  <Link href="/create">
                    <Button size="lg" className="group">
                      {t('home.cta')}
                      <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/plaza">
                    <Button variant="secondary" size="lg">{t('home.explore')}</Button>
                  </Link>
                </motion.div>

                <motion.div custom={4} initial="hidden" animate="show" variants={fadeUp} className="mt-16 flex gap-10">
                  {[
                    { label: t('home.stat.permanent'), value: '∞' },
                    { label: t('home.stat.lowGas'), value: '~$0.03' },
                    { label: t('home.stat.ipfs'), value: 'IPFS' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-en)' }}>{stat.value}</div>
                      <div className="text-[11px] text-zinc-600 tracking-wide mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp} className="hidden lg:flex items-center justify-center">
                <GlowOrb />
              </motion.div>
            </div>
          </div>
        </section>

        {/* My Capsules */}
        <MyCapsulesSection />
      </main>
    </>
  )
}
