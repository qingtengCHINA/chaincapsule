'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain, useChainId, useConnectors } from 'wagmi'
import { Wallet, SignOut, ArrowsLeftRight, Copy, Check, X, ArrowSquareOut } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// --- SVG Icons ---
function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 35 33" fill="none" className="h-6 w-6">
      <path d="M32.96 1L19.67 10.82l2.4-5.68L32.96 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25"/>
      <path d="M2.04 1l13.17 9.76-2.28-5.72L2.04 1z" fill="#E2761B" stroke="#E2761B" strokeWidth=".25"/>
      <path d="M28.23 23.58l-3.52 5.42 7.56 2.08 2.17-7.36-6.21-.14zM1.77 23.72l2.16 7.36 7.56-2.08-3.52-5.42-6.2.14z" fill="#E2761B" stroke="#E2761B" strokeWidth=".25"/>
      <path d="M10.08 14.58l-2.07 3.12 7.52.34-.24-8.1-5.21 4.64zM24.92 14.58l-5.15-4.64-.16 8.1 7.52-.34-2.21-3.12zM14.32 23.98l4.44-2.16 4.28 2.16-1.48 5.42-7.24-.02z" fill="#E2761B" stroke="#E2761B" strokeWidth=".25"/>
    </svg>
  )
}

function WalletConnectIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <rect width="24" height="24" rx="6" fill="#3B99FC"/>
      <path d="M7.5 9.8C9.3 8 12.2 8 14 9.8L14.3 10.1C14.5 10.3 14.5 10.6 14.3 10.8L13.3 11.8C13.1 12 12.8 12 12.6 11.8L12.2 11.4C11.1 10.3 9.3 10.3 8.2 11.4L7.8 11.8C7.6 12 7.3 12 7.1 11.8L6.1 10.8C5.9 10.6 5.9 10.3 6.1 10.1L7.5 9.8Z" fill="white"/>
      <path d="M16.9 12.8L17.9 13.8C18.1 14 18.1 14.3 17.9 14.5L14.5 17.9C14.3 18.1 14 18.1 13.8 17.9L10.4 14.5C10.2 14.3 10.2 14 10.4 13.8L11.4 12.8C11.6 12.6 11.9 12.6 12.1 12.8L13.3 14C13.5 14.2 13.8 14.2 14 14L15.2 12.8C15.4 12.6 15.7 12.6 15.9 12.8L16.9 12.8Z" fill="white"/>
    </svg>
  )
}

function DefaultWalletIcon() {
  return (
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center">
      <span className="text-[10px] font-bold text-zinc-300">W</span>
    </div>
  )
}

// --- Modal Context ---
type ModalCtx = {
  open: boolean
  setOpen: (v: boolean) => void
}

const WalletModalContext = createContext<ModalCtx>({ open: false, setOpen: () => {} })

export function useWalletModal() {
  return useContext(WalletModalContext)
}

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <WalletModalContext.Provider value={{ open, setOpen }}>
      {children}
      <WalletModalPortal />
    </WalletModalContext.Provider>
  )
}

// --- Modal rendered at root level ---
function WalletModalPortal() {
  const { open, setOpen } = useWalletModal()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { isConnected } = useAccount()
  const allConnectors = useConnectors()
  const [connectingId, setConnectingId] = useState<string | null>(null)

  // Close modal once connected
  useEffect(() => {
    if (isConnected && open) {
      setOpen(false)
      setConnectingId(null)
    }
  }, [isConnected, open, setOpen])

  const handleConnect = useCallback((connector: typeof connectors[number]) => {
    setConnectingId(connector.id)
    connect({ connector }, {
      onError: () => setConnectingId(null),
    })
  }, [connect])

  // Build wallet list from all available connectors
  // EIP-6963 wallets appear as separate connectors with uid like "com.metamask"
  // Filter: skip generic 'injected' if we have specific EIP-6963 wallets
  const eip6963Connectors = allConnectors.filter(c => c.type === 'injected' && c.id !== 'injected')
  const hasSpecificWallets = eip6963Connectors.length > 0

  const walletOptions: { id: string; name: string; icon: string | null; desc: string; connector: typeof allConnectors[number] }[] = []

  // Add EIP-6963 discovered wallets first (each has its own icon & name)
  for (const c of eip6963Connectors) {
    walletOptions.push({
      id: c.uid,
      name: c.name,
      icon: (c as any).icon || null,
      desc: '浏览器扩展钱包',
      connector: c,
    })
  }

  // Fallback: generic injected if no specific wallets discovered
  if (!hasSpecificWallets) {
    const genericInjected = allConnectors.find(c => c.id === 'injected')
    if (genericInjected) {
      walletOptions.push({
        id: 'injected',
        name: '浏览器钱包',
        icon: null,
        desc: 'MetaMask, Binance Wallet 等',
        connector: genericInjected,
      })
    }
  }

  // WalletConnect
  const wc = allConnectors.find(c => c.id === 'walletConnect')
  if (wc) {
    walletOptions.push({
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: null,
      desc: '扫码连接手机钱包',
      connector: wc,
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => { setOpen(false); setConnectingId(null) }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.93, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[360px] rounded-2xl border border-zinc-800/60 bg-[#0c0c0e] shadow-[0_0_100px_rgba(0,0,0,0.9)]"
          >
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold tracking-tight">连接钱包</h3>
                <button onClick={() => { setOpen(false); setConnectingId(null) }} className="p-1 rounded-md hover:bg-zinc-800/60 transition-colors">
                  <X size={15} className="text-zinc-500" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">连接至 BNB Smart Chain · 请在钱包弹窗中确认</p>
            </div>

            <div className="mx-5 h-px bg-zinc-800/40" />

            <div className="p-3 space-y-1.5 max-h-[320px] overflow-y-auto">
              {walletOptions.map((opt) => {
                const isThisConnecting = connectingId === opt.connector.id && isPending
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleConnect(opt.connector)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.04] active:scale-[0.99] disabled:opacity-40"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/50 border border-zinc-700/20 overflow-hidden">
                      {opt.icon ? (
                        <img src={opt.icon} alt={opt.name} className="h-6 w-6" />
                      ) : opt.id === 'walletconnect' ? (
                        <WalletConnectIcon />
                      ) : (
                        <MetaMaskIcon />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-zinc-200">{opt.name}</div>
                      <div className="text-[10px] text-zinc-500">{opt.desc}</div>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {isThisConnecting ? '确认中...' : '→'}
                    </div>
                  </button>
                )
              })}

              {walletOptions.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-500">未检测到钱包</p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-2"
                  >
                    安装 MetaMask <ArrowSquareOut size={10} />
                  </a>
                </div>
              )}
            </div>

            {connectError && (
              <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/30">
                <p className="text-[11px] text-red-400">
                  {connectError.message.includes('User rejected')
                    ? '用户取消了连接'
                    : connectError.message.includes('already pending')
                    ? '钱包有未处理的请求，请打开钱包确认'
                    : `连接失败: ${connectError.message.slice(0, 80)}`
                  }
                </p>
              </div>
            )}

            <div className="px-5 pb-4 pt-0">
              <p className="text-[10px] text-zinc-600/60 text-center">连接即表示您同意服务条款</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// --- Connected dropdown menu ---
function ConnectedMenu({ address, onDisconnect }: { address: `0x${string}`; onDisconnect: () => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const copyAddr = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-300 border border-zinc-800 transition-all active:scale-[0.98] hover:bg-zinc-800 hover:border-zinc-700"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="font-mono text-xs">{truncateAddress(address)}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-2 z-[9999] w-56 rounded-xl border border-zinc-800/60 bg-[#0c0c0e] shadow-2xl overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-zinc-800/40">
                <p className="text-[10px] text-zinc-500 mb-0.5">已连接</p>
                <p className="font-mono text-xs text-zinc-300">{truncateAddress(address)}</p>
              </div>

              <div className="px-3 py-2 border-b border-zinc-800/40">
                <p className="text-[10px] text-zinc-500 mb-1">网络</p>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${chainId === 31337 ? 'bg-emerald-500' : chainId === 97 ? 'bg-amber-500' : chainId === 56 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-zinc-300">
                    {chainId === 31337 ? 'Hardhat 本地' : chainId === 97 ? 'BSC Testnet' : chainId === 56 ? 'BSC Mainnet' : `Chain ${chainId}`}
                  </span>
                </div>
              </div>

              <div className="p-1.5">
                <button
                  onClick={copyAddr}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制地址'}
                </button>

                <button
                  onClick={() => {
                    switchChain({ chainId: chainId === 97 ? 56 : 97 })
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
                >
                  <ArrowsLeftRight size={14} />
                  切换到 {chainId === 97 ? 'BSC Mainnet' : 'BSC Testnet'}
                </button>

                <button
                  onClick={() => {
                    onDisconnect()
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  <SignOut size={14} />
                  断开连接
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Connect Button (use this in Navbar) ---
export default function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { setOpen } = useWalletModal()

  if (isConnected && address) {
    return <ConnectedMenu address={address} onDisconnect={() => disconnect()} />
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-all active:scale-[0.98] hover:bg-zinc-200"
    >
      <Wallet size={15} weight="bold" />
      连接钱包
    </button>
  )
}
