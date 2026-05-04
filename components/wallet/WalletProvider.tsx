'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletModalProvider } from '@/components/wallet/ConnectButton'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const desc = Object.getOwnPropertyDescriptor(window, 'ethereum')
      if (desc && !desc.configurable) {
        Object.defineProperty(window, 'ethereum', {
          ...desc, configurable: true, writable: true, enumerable: true,
        })
      }
    } catch {}
    setReady(true)
  }, [])

  const [config] = useState(() =>
    createConfig({
      chains: [bscTestnet, bsc],
      multiInjectedProviderDiscovery: true,
      connectors: [
        injected(),
        ...(projectId ? [walletConnect({ projectId, showQrModal: true })] : []),
      ],
      transports: {
        [bscTestnet.id]: http('https://bsc-testnet-rpc.publicnode.com', {
          timeout: 30_000,
          retryCount: 2,
          retryDelay: 1000,
        }),
        [bsc.id]: http('https://bsc-dataseed.bnbchain.org', {
          timeout: 30_000,
          retryCount: 2,
          retryDelay: 1000,
        }),
      },
    })
  )

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: 1000,
        staleTime: 10_000,
      },
    },
  }))

  if (!ready) return null

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
