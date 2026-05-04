'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkle, Star, Crown } from '@phosphor-icons/react'

type Phase =
  | 'idle'
  | 'glow'
  | 'pulse'
  | 'break'
  | 'particles'
  | 'letter-float-in'
  | 'typewrite'
  | 'done'

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  icon: 'sparkle' | 'star' | 'crown'
  color: string
  size: number
  delay: number
}

const SPRING = { type: 'spring' as const, stiffness: 100, damping: 20 }

const PARTICLE_COLORS = [
  'text-amber-400',
  'text-amber-300',
  'text-yellow-300',
  'text-yellow-200',
  'text-white',
  'text-orange-300',
  'text-orange-200',
  'text-white/80',
]

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const isLarge = i < 4
    const radius = isLarge ? 140 + Math.random() * 60 : 100 + Math.random() * 100
    const icon: 'sparkle' | 'star' | 'crown' =
      isLarge ? 'crown' : Math.random() > 0.4 ? 'sparkle' : 'star'
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotation: Math.random() * 720 - 360,
      scale: isLarge ? 1.2 + Math.random() * 0.5 : 0.4 + Math.random() * 0.8,
      icon,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: isLarge ? 28 : 14 + Math.random() * 10,
      delay: Math.random() * 0.15,
    }
  })
}

const particles = generateParticles(24)

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

    // glow → pulse
    setTimeout(() => setPhase('pulse'), 1000)
    // pulse → break
    setTimeout(() => setPhase('break'), 1800)
    // break → particles (flash happens here)
    setTimeout(() => setPhase('particles'), 2200)
    // particles → letter-float-in
    setTimeout(() => setPhase('letter-float-in'), 3200)
    // letter-float-in → typewrite
    setTimeout(() => setPhase('typewrite'), 4200)
  }, [])

  useEffect(() => {
    if (isOpen && phase === 'idle') {
      startSequence()
    }
  }, [isOpen, phase, startSequence])

  // Typewriter effect — 30ms per character
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
    }, 30)

    return () => clearInterval(interval)
  }, [phase, content, onComplete])

  const handleDismiss = () => {
    setShowBackground(false)
  }

  // Memoize icon renderer to avoid inline conditionals
  const renderParticleIcon = (p: Particle) => {
    switch (p.icon) {
      case 'crown':
        return <Crown size={p.size} weight="fill" />
      case 'star':
        return <Star size={p.size} weight="fill" />
      default:
        return <Sparkle size={p.size} weight="fill" />
    }
  }

  const isActive = (phases: Phase[]) => phases.includes(phase)

  return (
    <AnimatePresence>
      {showBackground && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
          transition={SPRING}
        >
          {/* ── Radial glow (behind capsule, visible during glow/pulse/break) ── */}
          <AnimatePresence>
            {isActive(['glow', 'pulse', 'break', 'particles']) && (
              <motion.div
                key="radial-glow"
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 280,
                  height: 280,
                  background:
                    'radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(251,191,36,0.08) 40%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: phase === 'particles' ? 0 : 1,
                  scale: phase === 'pulse' ? [1, 1.15, 1] : 1,
                }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{
                  opacity: { duration: 0.5 },
                  scale:
                    phase === 'pulse'
                      ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
                      : SPRING,
                }}
              />
            )}
          </AnimatePresence>

          {/* ── Light beam (vertical, during break → particles) ── */}
          <AnimatePresence>
            {isActive(['break', 'particles']) && (
              <motion.div
                key="light-beam"
                className="absolute pointer-events-none"
                style={{
                  width: 40,
                  height: 500,
                  background:
                    'linear-gradient(to top, rgba(251,191,36,0.6), rgba(251,191,36,0.15) 40%, transparent)',
                  filter: 'blur(6px)',
                  transformOrigin: 'bottom center',
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 1, 0.7], scaleY: [0, 1, 0.6] }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                  opacity: { duration: 1.2 },
                }}
              />
            )}
          </AnimatePresence>

          {/* ── Flash / pulse burst when capsule breaks ── */}
          <AnimatePresence>
            {phase === 'break' && (
              <motion.div
                key="flash"
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 120,
                  height: 120,
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(251,191,36,0.4) 40%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 2.5, 3] }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* ── Capsule body ── */}
          <AnimatePresence mode="wait">
            {isActive(['idle', 'glow', 'pulse', 'break']) && (
              <motion.div
                key="capsule"
                className="relative"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{
                  opacity: phase === 'break' ? 0 : 1,
                  scale: phase === 'break' ? 1.6 : 1,
                  rotate:
                    phase === 'pulse'
                      ? [0, -3, 3, -2, 2, 0]
                      : phase === 'break'
                        ? [0, -6, 6, -4, 4, 0]
                        : 0,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  opacity: { duration: 0.3 },
                  scale: phase === 'break' ? { duration: 0.3 } : SPRING,
                  rotate:
                    phase === 'pulse' || phase === 'break'
                      ? {
                          type: 'spring',
                          stiffness: 400,
                          damping: 8,
                          repeat: phase === 'pulse' ? Infinity : 0,
                          repeatDelay: 0.3,
                        }
                      : SPRING,
                }}
              >
                {/* Outer orbit ring */}
                <motion.div
                  className="absolute -inset-6 rounded-full border border-amber-500/20"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Inner orbit dot */}
                <motion.div
                  className="absolute -inset-8"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                </motion.div>

                {/* Capsule sphere */}
                <div
                  className={`
                    relative w-28 h-28 rounded-full
                    bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-900
                    border border-zinc-500/40
                    flex items-center justify-center
                    ${phase === 'glow' || phase === 'pulse' || phase === 'break'
                      ? 'shadow-[0_0_60px_rgba(251,191,36,0.2),0_0_120px_rgba(251,191,36,0.1)]'
                      : ''}
                  `}
                  style={{
                    boxShadow:
                      phase === 'glow' || phase === 'pulse' || phase === 'break'
                        ? '0 0 60px rgba(251,191,36,0.2), 0 0 120px rgba(251,191,36,0.1), inset 0 2px 20px rgba(255,255,255,0.05)'
                        : 'inset 0 2px 20px rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Inner highlight */}
                  <div className="absolute top-2 left-4 w-8 h-4 rounded-full bg-white/10 blur-sm" />

                  {/* Seal letter */}
                  <span className="text-3xl text-zinc-300 font-serif font-bold select-none">
                    C
                  </span>

                  {/* Glow ring around capsule */}
                  {phase === 'pulse' && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-amber-400/40"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Particles burst ── */}
          <AnimatePresence>
            {phase === 'particles' && (
              <>
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    className={`absolute ${p.color}`}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      opacity: [0, 1, 1, 0],
                      scale: [0, p.scale * 1.3, p.scale, p.scale * 0.5],
                      rotate: p.rotation,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.4,
                      delay: p.delay,
                      ease: 'easeOut',
                      opacity: {
                        duration: 1.6,
                        delay: p.delay,
                        times: [0, 0.1, 0.5, 1],
                      },
                    }}
                  >
                    {renderParticleIcon(p)}
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* ── Letter card (floats in from below) ── */}
          <AnimatePresence>
            {isActive(['letter-float-in', 'typewrite', 'done']) && (
              <motion.div
                key="letter"
                className="absolute flex flex-col items-center"
                initial={{ opacity: 0, y: 200, rotateZ: -4, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, rotateZ: 0, scale: 1 }}
                exit={{ opacity: 0, y: -60, scale: 0.9 }}
                transition={{
                  ...SPRING,
                  delay: 0.1,
                  stiffness: 80,
                  damping: 18,
                }}
              >
                <div className="w-full max-w-md mx-4">
                  {/* Letter card with decorative frame */}
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      boxShadow:
                        '0 0 80px rgba(251,191,36,0.08), 0 25px 80px rgba(0,0,0,0.5)',
                    }}
                  >
                    {/* Decorative top border gradient */}
                    <div
                      className="absolute top-0 inset-x-0 h-1"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(251,191,36,0.6) 30%, rgba(251,191,36,0.8) 50%, rgba(251,191,36,0.6) 70%, transparent)',
                      }}
                    />

                    <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-sm p-8">
                      {/* Header with seal icon */}
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/80">
                        <motion.div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                            border: '1px solid rgba(251,191,36,0.2)',
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ ...SPRING, delay: 0.3 }}
                        >
                          <Crown
                            size={16}
                            weight="fill"
                            className="text-amber-400/80"
                          />
                        </motion.div>
                        <div>
                          <p className="text-xs text-amber-400/70 uppercase tracking-[0.2em] font-medium">
                            Time Capsule
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            Sealed memory
                          </p>
                        </div>
                      </div>

                      {/* Paper-like content area */}
                      <div
                        className="min-h-[120px] rounded-lg p-1"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      >
                        <p className="text-base leading-relaxed text-zinc-200 whitespace-pre-wrap">
                          {displayedText}
                          {phase === 'typewrite' && (
                            <motion.span
                              className="inline-block w-0.5 h-4 bg-amber-400/70 ml-0.5 align-middle"
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
                      <AnimatePresence>
                        {phase === 'done' && (
                          <motion.div
                            className="mt-6 pt-4 border-t border-zinc-800/60 flex justify-between items-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...SPRING, delay: 0.2 }}
                          >
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 h-1 rounded-full bg-amber-400/40"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.4 + i * 0.1 }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={handleDismiss}
                              className="text-sm text-zinc-500 hover:text-amber-400/80 transition-colors active:scale-[0.98] px-4 py-1.5 rounded-lg hover:bg-zinc-800/50"
                            >
                              关闭
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Decorative bottom border gradient */}
                    <div
                      className="absolute bottom-0 inset-x-0 h-px"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(251,191,36,0.2) 30%, rgba(251,191,36,0.3) 50%, rgba(251,191,36,0.2) 70%, transparent)',
                      }}
                    />
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
