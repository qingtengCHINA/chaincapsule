'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ConnectButton from '@/components/wallet/ConnectButton'
import { motion } from 'framer-motion'

const links = [
  { href: '/', label: '首页' },
  { href: '/create', label: '创建' },
  { href: '/plaza', label: '广场' },
  { href: '/profile', label: '我的' },
]

export default function Navbar() {
  const pathname = usePathname()

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

        {/* Nav links */}
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

        {/* Connect */}
        <ConnectButton />
      </div>
    </nav>
  )
}
