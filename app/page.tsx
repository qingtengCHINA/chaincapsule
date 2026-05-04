'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import StarField from '@/components/three/StarField'
import Button from '@/components/ui/Button'
import { ArrowRight, HourglassSimple } from '@phosphor-icons/react'

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
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          animationDuration: '6s',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          transform: 'scale(1.5)',
        }}
      />
      {/* Main orb */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), rgba(255,255,255,0.03) 50%, transparent 70%)',
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute inset-8 rounded-full border border-white/[0.06]"
      />
      {/* Core light */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          animationDuration: '4s',
          animationDelay: '1s',
          boxShadow: '0 0 120px 40px rgba(255,255,255,0.03), inset 0 0 60px rgba(255,255,255,0.05)',
        }}
      />
      {/* Capsule icon in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <HourglassSimple size={48} weight="thin" className="text-white/20" />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <StarField />

      <main className="relative z-10">
        {/* Hero */}
        <section className="min-h-[100dvh] flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-12 lg:gap-20">

              {/* Left: text */}
              <div>
                <motion.div
                  custom={0}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="mb-4"
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-[11px] tracking-widest uppercase text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    BNB Smart Chain
                  </span>
                </motion.div>

                <motion.h1
                  custom={1}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="text-[clamp(2.8rem,8vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.04em]"
                  style={{ fontFamily: 'var(--font-en), var(--font-cn), system-ui' }}
                >
                  <span className="block text-white">Chain</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                    Capsule
                  </span>
                </motion.h1>

                <motion.p
                  custom={2}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="mt-6 text-lg md:text-xl text-zinc-400 leading-relaxed max-w-md"
                  style={{ fontFamily: 'var(--font-cn), system-ui' }}
                >
                  把你的话，封存在区块里，<br />
                  <span className="text-zinc-300">留给未来。</span>
                </motion.p>

                <motion.div
                  custom={3}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="mt-10 flex items-center gap-4"
                >
                  <Link href="/create">
                    <Button size="lg" className="group">
                      创建胶囊
                      <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <Link href="/plaza">
                    <Button variant="secondary" size="lg">探索广场</Button>
                  </Link>
                </motion.div>

                {/* Stats */}
                <motion.div
                  custom={4}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="mt-16 flex gap-10"
                >
                  {[
                    { label: '链上永久存储', value: '∞' },
                    { label: 'BNB Chain 低 Gas', value: '~$0.03' },
                    { label: '隐私加密', value: 'E2E' },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-en)' }}>
                        {stat.value}
                      </div>
                      <div className="text-[11px] text-zinc-600 tracking-wide mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right: orb */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="hidden lg:flex items-center justify-center"
              >
                <GlowOrb />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 我的胶囊 */}
        <section className="px-6 md:px-12 lg:px-20 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="border-t border-zinc-800/50 pt-12">
              <h2 className="text-lg font-medium tracking-tight text-zinc-300">
                我的胶囊
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                连接钱包后，你创建的胶囊会在这里显示。
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
