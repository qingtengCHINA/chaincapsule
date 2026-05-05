'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/context'
import { LOCALES } from '@/lib/i18n/translations'
import { Translate } from '@phosphor-icons/react'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
        title="Language / 语言"
      >
        <Translate size={14} />
        <span className="hidden lg:inline">{current.flag} {current.label}</span>
        <span className="lg:hidden">{current.flag}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-white/[0.06] bg-[#0c0c10]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] transition-colors ${
                  l.code === locale
                    ? 'text-white bg-white/[0.06]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-sm">{l.flag}</span>
                <span>{l.label}</span>
                {l.code === locale && (
                  <span className="ml-auto text-[10px] text-emerald-400">✓</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
