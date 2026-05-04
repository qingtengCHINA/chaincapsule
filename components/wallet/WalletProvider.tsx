'use client'

import { useState, type ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [config] = useState(() =>
    createConfig({
      chains: [bsc, bscTestnet],
      transports: {
        [bsc.id]: http(),
        [bscTestnet.id]: http(),
      },
    })
  )

  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
