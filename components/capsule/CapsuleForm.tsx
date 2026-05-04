'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount, useBlockNumber, useChainId } from 'wagmi'
import { useCreateCapsule } from '@/lib/contracts/hooks'
import { getContractAddress } from '@/lib/contracts/addresses'
import { dateToUnlockBlock } from '@/lib/utils/blockTime'
import { isAddress } from 'viem'
import { CheckCircle, Spinner, Lock, Eye, EyeSlash, CurrencyCircleDollar, Copy, Check } from '@phosphor-icons/react'

export default function CapsuleForm() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { create, hash, capsuleId, isPending, isConfirming, isSuccess, error: contractError } = useCreateCapsule()
  const { data: blockNumber } = useBlockNumber()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [unlockTime, setUnlockTime] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [bnbAmount, setBnbAmount] = useState('0')
  const [recipient, setRecipient] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Check if contract is deployed on current network
  const contractAddr = getContractAddress(chainId)
  const wrongNetwork = !contractAddr

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = '请输入胶囊标题'
    } else if (title.length > 100) {
      newErrors.title = '标题不能超过100个字符'
    }

    if (!content.trim()) {
      newErrors.content = '请输入胶囊内容'
    }

    if (!unlockDate) {
      newErrors.unlockDate = '请选择解锁日期'
    } else {
      const target = new Date(`${unlockDate}T${unlockTime || '00:00'}`)
      if (target.getTime() <= Date.now()) {
        newErrors.unlockDate = '解锁时间必须在未来'
      }
    }

    if (parseFloat(bnbAmount) < 0) {
      newErrors.bnbAmount = '金额不能为负数'
    } else if (parseFloat(bnbAmount) > 1000) {
      newErrors.bnbAmount = '金额不能超过 1000 BNB'
    }

    if (recipient && !isAddress(recipient)) {
      newErrors.recipient = '请输入有效的以太坊地址'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Pre-check: contract address
    if (wrongNetwork) {
      setErrors({ submit: '当前网络不支持，请切换到 BSC Testnet (Chain ID 97)' })
      return
    }

    setIsUploading(true)
    setErrors({})

    try {
      // Step 1: Upload content to IPFS
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || '上传到IPFS失败')
      }

      const { cid, warning } = await response.json()

      // Step 2: Calculate unlock block
      const unlockDateTime = new Date(`${unlockDate}T${unlockTime || '00:00'}`)
      const currentBlock = blockNumber ? Number(blockNumber) : 40000000
      const unlockBlock = dateToUnlockBlock(unlockDateTime, currentBlock)

      // Step 3: Call contract (this triggers wallet popup)
      create(title.trim(), cid, BigInt(unlockBlock), isPublic, bnbAmount, recipient || undefined)
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : '提交失败，请重试' })
    } finally {
      setIsUploading(false)
    }
  }

  // Show contract errors
  const displayError = errors.submit || (contractError?.message?.includes('UserRejected') ? '用户取消了交易' : contractError?.message)

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <CheckCircle size={48} className="text-emerald-400" weight="light" />
        <p className="text-lg text-zinc-100">胶囊创建成功</p>

        {title.trim() && (
          <p className="text-base text-zinc-300 font-medium">{title.trim()}</p>
        )}

        {capsuleId !== undefined && (
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-5 py-4 text-center max-w-sm">
            <p className="text-sm text-amber-400 font-medium mb-2">⚠️ 请记下你的胶囊 ID</p>
            <p className="text-2xl font-bold font-mono text-amber-300 mb-2">
              #{capsuleId.toString()}
              <button
                type="button"
                onClick={() => {
                  const id = capsuleId.toString()
                  navigator.clipboard.writeText(id)
                  const existing = JSON.parse(localStorage.getItem('chaincapsule_ids') || '[]')
                  if (!existing.includes(id)) {
                    existing.push(id)
                    localStorage.setItem('chaincapsule_ids', JSON.stringify(existing))
                  }
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="ml-2 inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-300 transition-colors align-middle"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '已复制' : '复制 ID'}
              </button>
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              你需要这个 ID 来在 BSCScan 上直接操作合约。<br/>
              建议截图保存或记在本地。
            </p>
          </div>
        )}

        {hash && (
          <p className="text-xs text-zinc-600 font-mono break-all">Tx: {hash}</p>
        )}

        <Link href="/profile">
          <button className="mt-2 inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 px-5 py-2.5 text-sm font-medium transition-transform active:scale-[0.98] hover:bg-zinc-200">
            查看我的胶囊
          </button>
        </Link>
      </div>
    )
  }

  const isDisabled = isPending || isConfirming || isUploading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Wrong network warning */}
      {wrongNetwork && isConnected && (
        <div className="rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3">
          <p className="text-sm text-red-400">
            ⚠️ 当前网络不支持。请在钱包中切换到 <strong>BSC Testnet</strong>（Chain ID 97）
          </p>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">胶囊标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给你的胶囊起个名字..."
          maxLength={100}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          disabled={isDisabled}
        />
        {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
        <p className="text-xs text-zinc-600">标题会公开显示在广场上，不会被加密</p>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Content */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">胶囊内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你想对未来说的话..."
          rows={5}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
          disabled={isDisabled}
        />
        {errors.content && (
          <p className="text-sm text-red-400">{errors.content}</p>
        )}
      </div>

      <div className="border-t border-zinc-800" />

      {/* Unlock Date & Time */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">解锁时间</label>
        <div className="flex gap-3">
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors [color-scheme:dark]"
            disabled={isDisabled}
          />
          <input
            type="time"
            value={unlockTime}
            onChange={(e) => setUnlockTime(e.target.value)}
            className="w-32 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors [color-scheme:dark]"
            disabled={isDisabled}
          />
        </div>
        {errors.unlockDate && (
          <p className="text-sm text-red-400">{errors.unlockDate}</p>
        )}
        <p className="text-xs text-zinc-600">选择胶囊可以被打开的时间，最早明天</p>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Public/Private Toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">可见性</label>
        <button
          type="button"
          onClick={() => setIsPublic(!isPublic)}
          className="flex items-center gap-3 w-fit px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors active:scale-[0.98]"
          disabled={isDisabled}
        >
          {isPublic ? (
            <>
              <Eye size={18} className="text-zinc-300" weight="light" />
              <span className="text-sm text-zinc-200">公开 - 所有人可见</span>
            </>
          ) : (
            <>
              <EyeSlash size={18} className="text-zinc-300" weight="light" />
              <span className="text-sm text-zinc-200">私密 - 仅自己可见</span>
            </>
          )}
        </button>
        <p className="text-xs text-zinc-600">公开胶囊会出现在广场中</p>
      </div>

      <div className="border-t border-zinc-800" />

      {/* BNB Amount */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">
          附加BNB（可选）
        </label>
        <div className="relative">
          <CurrencyCircleDollar
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            weight="light"
          />
          <input
            type="number"
            step="0.001"
            min="0"
            max="1000"
            value={bnbAmount}
            onChange={(e) => setBnbAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            disabled={isDisabled}
          />
        </div>
        {errors.bnbAmount && (
          <p className="text-sm text-red-400">{errors.bnbAmount}</p>
        )}
        <p className="text-xs text-zinc-600">可向胶囊中存入BNB，开胶囊后需手动提取</p>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Recipient Address */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">
          指定领取人（可选）
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x... 留空则仅自己可领取"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          disabled={isDisabled}
        />
        {errors.recipient && (
          <p className="text-sm text-red-400">{errors.recipient}</p>
        )}
        <p className="text-xs text-zinc-600">指定的钱包地址也可以打开胶囊并领取 BNB。不填则只有你能操作。</p>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Submit */}
      <div className="flex flex-col gap-3">
        {displayError && (
          <p className="text-sm text-red-400">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={!isConnected || isDisabled || wrongNetwork}
          className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 font-medium rounded-lg px-6 py-3 hover:bg-white transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Spinner size={18} className="animate-spin" />
              <span>上传中...</span>
            </>
          ) : isConfirming ? (
            <>
              <Spinner size={18} className="animate-spin" />
              <span>确认中...</span>
            </>
          ) : isPending ? (
            <>
              <Spinner size={18} className="animate-spin" />
              <span>请在钱包中确认...</span>
            </>
          ) : (
            <>
              <Lock size={18} weight="light" />
              <span>{isConnected ? (wrongNetwork ? '请切换到 BSC Testnet' : '封存胶囊') : '请先连接钱包'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
