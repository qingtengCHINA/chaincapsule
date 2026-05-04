'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount, useBlockNumber } from 'wagmi'
import { useCreateCapsule } from '@/lib/contracts/hooks'
import { dateToUnlockBlock } from '@/lib/utils/blockTime'
import { CheckCircle, Spinner, Lock, Eye, EyeSlash, CurrencyCircleDollar } from '@phosphor-icons/react'

export default function CapsuleForm() {
  const { isConnected } = useAccount()
  const { create, hash, capsuleId, isPending, isConfirming, isSuccess } = useCreateCapsule()
  const { data: blockNumber } = useBlockNumber()

  const [content, setContent] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [unlockTime, setUnlockTime] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [bnbAmount, setBnbAmount] = useState('0')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsUploading(true)
    try {
      // Upload content to IPFS via Pinata
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('上传到IPFS失败')
      }

      const { cid } = await response.json()

      // Calculate unlock block
      const unlockDateTime = new Date(`${unlockDate}T${unlockTime || '00:00'}`)
      const currentBlock = blockNumber ? Number(blockNumber) : 40000000
      const unlockBlock = dateToUnlockBlock(unlockDateTime, currentBlock)

      create(cid, BigInt(unlockBlock), isPublic, bnbAmount)
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : '提交失败' })
    } finally {
      setIsUploading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <CheckCircle size={48} className="text-emerald-400" weight="light" />
        <p className="text-lg text-zinc-100">胶囊创建成功</p>

        {capsuleId !== undefined && (
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-5 py-4 text-center max-w-sm">
            <p className="text-sm text-amber-400 font-medium mb-2">⚠️ 请记下你的胶囊 ID</p>
            <p className="text-2xl font-bold font-mono text-amber-300 mb-2">#{capsuleId.toString()}</p>
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

      {/* Submit */}
      <div className="flex flex-col gap-3">
        {errors.submit && (
          <p className="text-sm text-red-400">{errors.submit}</p>
        )}

        <button
          type="submit"
          disabled={!isConnected || isDisabled}
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
              <span>签名中...</span>
            </>
          ) : (
            <>
              <Lock size={18} weight="light" />
              <span>{isConnected ? '封存胶囊' : '请先连接钱包'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
