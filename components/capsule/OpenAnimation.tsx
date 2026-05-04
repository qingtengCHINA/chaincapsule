'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkle, Star } from '@phosphor-icons/react'

type Phase = 'idle' | 'glow' | 'shake' | 'explode' | 'reveal' | 'typewrite' | 'done'

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  icon: 'sparkle' | 'star'
}

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 }

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    const radius = 120 + Math.random() * 80
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.8,
      icon: Math.random() > 0.5 ? 'sparkle' : 'star',
    }
  })
}

const particles = generateParticles(16)

interface OpenAnimationProps {
  isOpen: boolean
  content: string
  onComplete: () => void
}

export default function OpenAnimation({
  isOpen,
  content,
  onComplete,
}: OpenAnimationProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayedText, setDisplayedText] = useState('')
  const [showBackground, setShowBackground] = useState(false)

  const startSequence = useCallback(() => {
    setShowBackground(true)
    setPhase('glow')

    // glow -> shake
    setTimeout(() => setPhase('shake'), 800)
    // shake -> explode
    setTimeout(() => setPhase('explode'), 1600)
    // explode -> reveal letter
    setTimeout(() => setPhase('reveal'), 2400)
    // reveal -> typewrite
    setTimeout(() => setPhase('typewrite'), 3200)
  }, [])

  useEffect(() => {
    if (isOpen && phase === 'idle') {
      startSequence()
    }
  }, [isOpen, phase, startSequence])

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'typewrite') return

    let index = 0
    const interval = setInterval(() => {
      index++
      setDisplayedText(content.slice(0, index))
      if (index >= content.length) {
        clearInterval(interval)
        setTimeout(() => {
          setPhase('done')
          onComplete()
        }, 600)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [phase, content, onComplete])

  const handleDismiss = () => {
    setShowBackground(false)
  }

  return (
    <AnimatePresence>
      {showBackground && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
          transition={SPRING}
        >
          {/* Capsule body */}
          <AnimatePresence mode="wait">
            {phase !== 'reveal' &&
              phase !== 'typewrite' &&
              phase !== 'done' && (
                <motion.div
                  key="capsule"
                  className="relative"
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: phase === 'explode' ? 0 : 1,
                    scale: phase === 'explode' ? 1.5 : 1,
                    x:
                      phase === 'shake'
                        ? [0, -12, 12, -8, 8, -4, 4, 0]
                        : 0,
                  }}
                  transition={
                    phase === 'shake'
                      ? {
                          x: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 10,
                          },
                        }
                      : SPRING
                  }
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <div
                    className={`
                      w-24 h-24 rounded-2xl border-2 border-zinc-600
                      bg-gradient-to-br from-zinc-700 to-zinc-900
                      flex items-center justify-center
                      ${phase === 'glow' || phase === 'shake' ? 'shadow-[0_0_40px_rgba(161,161,170,0.15)]' : ''}
                    `}
                  >
                    <span className="text-2xl text-zinc-400 font-mono">C</span>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Particles burst */}
          <AnimatePresence>
            {phase === 'explode' && (
              <>
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute text-zinc-400"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      opacity: 0,
                      scale: p.scale,
                      rotate: p.rotation,
                    }}
                    exit={{ opacity: 0 }}
                    transition={SPRING}
                  >
                    {p.icon === 'sparkle' ? (
                      <Sparkle size={20} weight="fill" />
                    ) : (
                      <Star size={16} weight="fill" />
                    )}
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Letter reveal */}
          <AnimatePresence>
            {(phase === 'reveal' || phase === 'typewrite' || phase === 'done') && (
              <motion.div
                key="letter"
                className="absolute flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.2, rotateX: 60 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={SPRING}
              >
                <div className="w-full max-w-md mx-4">
                  <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 p-8 shadow-2xl">
                    {/* Paper texture header */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-xs text-zinc-500 font-mono">C</span>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-600 uppercase tracking-wider">
                          Time Capsule
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-h-[120px]">
                      <p className="text-base leading-relaxed text-zinc-200 whitespace-pre-wrap">
                        {displayedText}
                        {phase === 'typewrite' && (
                          <motion.span
                            className="inline-block w-0.5 h-4 bg-zinc-400 ml-0.5 align-middle"
                            animate={{ opacity: [1, 0] }}
                            transition={{
                              duration: 0.5,
                              repeat: Infinity,
                            }}
                          />
                        )}
                      </p>
                    </div>

                    {/* Done state: close button */}
                    {phase === 'done' && (
                      <motion.div
                        className="mt-6 pt-4 border-t border-zinc-800 flex justify-end"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={SPRING}
                      >
                        <button
                          onClick={handleDismiss}
                          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors active:scale-[0.98]"
                        >
                          关闭
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
