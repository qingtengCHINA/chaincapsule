'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, SignOut } from '@phosphor-icons/react'

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-300 border border-zinc-800 transition-transform active:scale-[0.98] hover:bg-zinc-800"
      >
        <span className="font-mono">{truncateAddress(address)}</span>
        <SignOut size={16} />
      </button>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-300 border border-zinc-800 transition-transform active:scale-[0.98] hover:bg-zinc-800"
    >
      <Wallet size={16} />
      连接钱包
    </button>
  )
}
