'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '@/components/three/StarField';
import Button from '@/components/ui/Button';

const stagger = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      type: 'spring' as const,
      stiffness: 120,
      damping: 20,
    },
  }),
};

function GlowOrb() {
  return (
    <div className="relative h-48 w-48 md:h-72 md:w-72">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-4 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 50%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          animationDuration: '4s',
          boxShadow: '0 0 80px 20px rgba(255,255,255,0.04)',
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <StarField />

      <main className="relative z-10">
        {/* Hero */}
        <section className="min-h-[100dvh] flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
            <div className="flex items-center justify-between gap-12">
              {/* Left: text content */}
              <div className="max-w-xl">
                <motion.h1
                  custom={0}
                  initial="hidden"
                  animate="show"
                  variants={stagger}
                  className="text-5xl md:text-7xl font-semibold tracking-tighter"
                >
                  ChainCapsule
                </motion.h1>

                <motion.p
                  custom={1}
                  initial="hidden"
                  animate="show"
                  variants={stagger}
                  className="mt-4 text-lg md:text-xl text-zinc-400 leading-relaxed"
                >
                  把你的话，封存在区块里，留给未来。
                </motion.p>

                <motion.div
                  custom={2}
                  initial="hidden"
                  animate="show"
                  variants={stagger}
                  className="mt-8 flex items-center gap-3"
                >
                  <Link href="/create">
                    <Button size="lg">创建胶囊</Button>
                  </Link>
                  <Link href="/plaza">
                    <Button variant="secondary" size="lg">探索广场</Button>
                  </Link>
                </motion.div>
              </div>

              {/* Right: floating capsule orb */}
              <motion.div
                custom={1}
                initial="hidden"
                animate="show"
                variants={stagger}
                className="hidden md:flex items-center justify-center flex-shrink-0"
              >
                <GlowOrb />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 我的胶囊 placeholder */}
        <section className="min-h-[40vh] px-6 md:px-10 pb-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-200">
              我的胶囊
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              连接钱包后，你创建的胶囊会在这里显示。
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
