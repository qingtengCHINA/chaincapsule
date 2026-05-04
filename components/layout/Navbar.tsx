'use client'

import ConnectButton from '@/components/wallet/ConnectButton'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-zinc-950/80 border-b border-zinc-800/50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="text-lg font-semibold tracking-tight">ChainCapsule</span>
        <ConnectButton />
      </div>
    </nav>
  )
}
