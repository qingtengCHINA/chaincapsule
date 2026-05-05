'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ConnectButton from '@/components/wallet/ConnectButton'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import { List, X } from '@phosphor-icons/react'
import { useI18n } from '@/lib/i18n/context'

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function WhitepaperIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useI18n()

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/create', label: t('nav.create') },
    { href: '/plaza', label: t('nav.plaza') },
    { href: '/profile', label: t('nav.profile') },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#060608]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 md:px-12 lg:px-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-lg font-bold tracking-[-0.04em] text-white"
            style={{ fontFamily: 'var(--font-en)' }}
          >
            CC
          </span>
          <span className="hidden sm:inline text-[13px] text-zinc-500 tracking-wide">
            ChainCapsule
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-1.5 text-[13px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-md bg-white/[0.06]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right: Language + Whitepaper + GitHub + Connect + Mobile menu */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <a
            href="/whitepaper"
            className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            title="Whitepaper"
          >
            <WhitepaperIcon />
            <span className="hidden lg:inline">{t('nav.whitepaper')}</span>
          </a>
          <a
            href="https://github.com/qingtengCHINA/chaincapsule"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            title="Open Source · View on GitHub"
          >
            <GitHubIcon />
            <span className="hidden lg:inline">{t('nav.github')}</span>
          </a>
          <ConnectButton />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X size={20} className="text-zinc-400" />
            ) : (
              <List size={20} className="text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/[0.04] bg-[#060608]/95 backdrop-blur-xl"
          >
            <div className="px-6 py-3 space-y-1">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'text-zinc-100 bg-white/[0.06]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <a
                href="/whitepaper"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors"
              >
                <WhitepaperIcon />
                {t('nav.whitepaper')}
              </a>
              <a
                href="https://github.com/qingtengCHINA/chaincapsule"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors"
              >
                <GitHubIcon />
                GitHub
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
