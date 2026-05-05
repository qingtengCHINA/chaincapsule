'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAccount, useBlockNumber, useChainId } from 'wagmi'
import { useCreateCapsule } from '@/lib/contracts/hooks'
import { getContractAddress } from '@/lib/contracts/addresses'
import { dateToUnlockBlock } from '@/lib/utils/blockTime'
import { isAddress } from 'viem'
import { CheckCircle, Spinner, Lock, Eye, EyeSlash, CurrencyCircleDollar, Copy, Check, ChatCircleDots, Scales, Gift, Baby, PiggyBank, AirplaneTilt, Wrench } from '@phosphor-icons/react'

// ─── Preset Types ─────────────────────────────────────────────
type VisibilityMode = 'locked_public' | 'locked_private' | 'flexible' | 'none'
type BnbMode = 'disabled' | 'optional'
type RecipientMode = 'hidden' | 'optional' | 'required' | 'locked_self'

interface CapsulePreset {
  id: string
  icon: React.ReactNode
  name: string
  description: string
  visibility: VisibilityMode
  bnb: BnbMode
  recipient: RecipientMode
  hint: string
  recommendedDuration?: string
}

const PRESETS: CapsulePreset[] = [
  {
    id: 'custom',
    icon: <Wrench size={20} />,
    name: '自定义',
    description: '完全自由配置',
    visibility: 'flexible',
    bnb: 'optional',
    recipient: 'optional',
    hint: '所有选项自由设定',
  },
  {
    id: 'whisper',
    icon: <ChatCircleDots size={20} />,
    name: '悄悄话',
    description: '私密心声，指定的人才能看到',
    visibility: 'locked_private',
    bnb: 'disabled',
    recipient: 'optional',
    hint: '私密胶囊，只有你或指定的人能打开',
    recommendedDuration: '短',
  },
  {
    id: 'truth',
    icon: <Scales size={20} />,
    name: '真相胶囊',
    description: '封存真相，到了时间才能揭晓',
    visibility: 'locked_private',
    bnb: 'disabled',
    recipient: 'optional',
    hint: '私密胶囊，适合封存秘密或真相',
  },
  {
    id: 'gift',
    icon: <Gift size={20} />,
    name: '时间的礼物',
    description: '附带 BNB 的私密馈赠',
    visibility: 'locked_private',
    bnb: 'optional',
    recipient: 'optional',
    hint: '私密胶囊 + BNB 礼物，打开时可以领取',
  },
  {
    id: 'coming_of_age',
    icon: <Baby size={20} />,
    name: '成人礼',
    description: '送给孩子的成长贺礼',
    visibility: 'flexible',
    bnb: 'optional',
    recipient: 'required',
    hint: '必须指定孩子的钱包地址，TA 才能打开并领取',
  },
  {
    id: 'pension',
    icon: <PiggyBank size={20} />,
    name: '养老金',
    description: '为未来的自己存一笔钱',
    visibility: 'locked_public',
    bnb: 'optional',
    recipient: 'locked_self',
    hint: '公开胶囊，只有你自己能打开和领取',
  },
  {
    id: 'travel',
    icon: <AirplaneTilt size={20} />,
    name: '旅行基金',
    description: '为未来的旅行攒路费',
    visibility: 'locked_public',
    bnb: 'optional',
    recipient: 'locked_self',
    hint: '公开胶囊，为未来的旅程储蓄',
  },
]

// ─── Component ────────────────────────────────────────────────
export default function CapsuleForm() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { create, hash, capsuleId, isPending, isConfirming, isSuccess, error: contractError } = useCreateCapsule()
  const { data: blockNumber } = useBlockNumber()

  const [selectedPreset, setSelectedPreset] = useState('custom')
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

  const contractAddr = getContractAddress(chainId)
  const wrongNetwork = !contractAddr

  const preset = useMemo(() => PRESETS.find(p => p.id === selectedPreset) || PRESETS[0], [selectedPreset])

  // Apply preset constraints
  const effectiveIsPublic = preset.visibility === 'locked_public' ? true
    : preset.visibility === 'locked_private' ? false
    : isPublic

  const effectiveRecipient = preset.recipient === 'locked_self' ? (address || '')
    : recipient

  const bnbDisabled = preset.bnb === 'disabled'
  const recipientLocked = preset.recipient === 'locked_self'
  const recipientRequired = preset.recipient === 'required'
  const recipientHidden = preset.recipient === 'hidden'
  const visibilityLocked = preset.visibility === 'locked_public' || preset.visibility === 'locked_private'

  // When switching preset, apply defaults
  function handlePresetChange(id: string) {
    setSelectedPreset(id)
    const p = PRESETS.find(pr => pr.id === id)
    if (!p) return

    // Reset constrained fields
    if (p.bnb === 'disabled') setBnbAmount('0')
    if (p.visibility === 'locked_public') setIsPublic(true)
    if (p.visibility === 'locked_private') setIsPublic(false)
    if (p.recipient === 'locked_self') setRecipient('')
  }

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

    if (!bnbDisabled) {
      if (parseFloat(bnbAmount) < 0) {
        newErrors.bnbAmount = '金额不能为负数'
      } else if (parseFloat(bnbAmount) > 1000) {
        newErrors.bnbAmount = '金额不能超过 1000 BNB'
      }
    }

    // Recipient validation
    const finalRecipient = preset.recipient === 'locked_self' ? address : recipient
    if (recipientRequired && !finalRecipient) {
      newErrors.recipient = '此类型必须指定领取人地址'
    }
    if (finalRecipient && !isAddress(finalRecipient)) {
      newErrors.recipient = '请输入有效的钱包地址'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (wrongNetwork) {
      setErrors({ submit: '当前网络不支持，请切换到 BSC Testnet (Chain ID 97)' })
      return
    }

    setIsUploading(true)
    setErrors({})

    try {
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || '上传到IPFS失败')
      }

      const { cid } = await response.json()

      const unlockDateTime = new Date(`${unlockDate}T${unlockTime || '00:00'}`)
      const currentBlock = blockNumber ? Number(blockNumber) : 40000000
      const unlockBlock = dateToUnlockBlock(unlockDateTime, currentBlock)

      const finalRecipient = preset.recipient === 'locked_self' ? address : (recipient || undefined)
      const finalBnb = bnbDisabled ? '0' : bnbAmount

      create(title.trim(), cid, BigInt(unlockBlock), effectiveIsPublic, finalBnb, finalRecipient)
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : '提交失败，请重试' })
    } finally {
      setIsUploading(false)
    }
  }

  const displayError = errors.submit || (() => {
    if (!contractError?.message) return ''
    const msg = contractError.message
    if (msg.includes('UserRejected') || msg.includes('user rejected')) return '用户取消了交易'
    if (msg.includes('LockTooShort')) return '锁定时间太短，最少 10 分钟'
    if (msg.includes('LockTooLong')) return '锁定时间太长，最多 200 年'
    if (msg.includes('BnbAmountTooHigh')) return 'BNB 金额超过上限 (1000 BNB)'
    if (msg.includes('InvalidTitle')) return '标题无效'
    if (msg.includes('InvalidUnlockBlock')) return '解锁时间必须在未来'
    if (msg.includes('EnforcedPause')) return '合约暂停中，请稍后再试'
    return msg.slice(0, 100)
  })()

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <CheckCircle size={48} className="text-emerald-400" weight="light" />
        <p className="text-lg text-zinc-100">胶囊创建成功</p>

        {preset.id !== 'custom' && (
          <span className="text-sm text-zinc-500">{preset.name}</span>
        )}

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

      {/* ── Preset Selector ── */}
      <div className="flex flex-col gap-3">
        <label className="text-sm text-zinc-400">胶囊类型</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetChange(p.id)}
              disabled={isDisabled}
              className={`
                flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all active:scale-[0.97]
                ${selectedPreset === p.id
                  ? 'border-amber-600/50 bg-amber-950/20 shadow-[0_0_12px_rgba(251,191,36,0.08)]'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
                }
              `}
            >
              <div className={`text-sm ${selectedPreset === p.id ? 'text-amber-400' : 'text-zinc-500'}`}>
                {p.icon}
              </div>
              <div>
                <p className={`text-xs font-medium ${selectedPreset === p.id ? 'text-amber-300' : 'text-zinc-300'}`}>
                  {p.name}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5 line-clamp-2">{p.description}</p>
              </div>
            </button>
          ))}
        </div>
        {/* Preset hint */}
        {preset.id !== 'custom' && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <span className="text-amber-500 text-xs mt-0.5">💡</span>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{preset.hint}</p>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800" />

      {/* ── Title ── */}
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

      {/* ── Content ── */}
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

      {/* ── Unlock Date & Time ── */}
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

      {/* ── Visibility ── */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">
          可见性
          {visibilityLocked && (
            <span className="ml-2 text-[10px] text-amber-500/70">
              ({preset.visibility === 'locked_public' ? '此类型必须公开' : '此类型必须私密'})
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => !visibilityLocked && setIsPublic(!isPublic)}
          className={`flex items-center gap-3 w-fit px-4 py-2.5 rounded-lg border transition-colors active:scale-[0.98] ${
            visibilityLocked
              ? 'border-zinc-800/50 bg-zinc-900/30 cursor-not-allowed opacity-60'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
          }`}
          disabled={isDisabled || visibilityLocked}
        >
          {effectiveIsPublic ? (
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
        <p className="text-xs text-zinc-600">
          {visibilityLocked
            ? (effectiveIsPublic ? '公开胶囊会出现在广场中' : '私密胶囊只有你或指定的人能看到')
            : '公开胶囊会出现在广场中'
          }
        </p>
      </div>

      <div className="border-t border-zinc-800" />

      {/* ── BNB Amount ── */}
      {!bnbDisabled ? (
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
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900/30 border border-zinc-800/30">
          <CurrencyCircleDollar size={16} className="text-zinc-700" />
          <p className="text-xs text-zinc-600">此类型不支持附加 BNB</p>
        </div>
      )}

      <div className="border-t border-zinc-800" />

      {/* ── Recipient ── */}
      {!recipientHidden && (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-zinc-400">
            {recipientLocked ? '领取人' : '指定领取人'}
            {recipientRequired && <span className="text-red-400 ml-1">*</span>}
            {recipientLocked && (
              <span className="ml-2 text-[10px] text-amber-500/70">(此类型仅限自己)</span>
            )}
          </label>
          {recipientLocked ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900/30 border border-zinc-800/30">
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-[10px] text-zinc-500 font-mono">{address?.slice(2, 4).toUpperCase()}</span>
              </div>
              <span className="text-sm text-zinc-400 font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '未连接钱包'}
              </span>
              <span className="text-[10px] text-zinc-600 ml-auto">自己的钱包</span>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={recipientRequired ? '0x... 必须填写领取人地址' : '0x... 留空则仅自己可领取'}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                disabled={isDisabled}
              />
              {errors.recipient && (
                <p className="text-sm text-red-400">{errors.recipient}</p>
              )}
            </>
          )}
          <p className="text-xs text-zinc-600">
            {recipientLocked
              ? '只有你自己能打开胶囊并领取 BNB'
              : recipientRequired
                ? '必须指定领取人，TA 才能打开胶囊'
                : '指定的钱包地址也可以打开胶囊并领取 BNB。不填则只有你能操作。'
            }
          </p>
        </div>
      )}

      <div className="border-t border-zinc-800" />

      {/* ── Submit ── */}
      <div className="flex flex-col gap-3">
        {/* Gas estimate */}
        <div className="flex items-center justify-between text-[11px] text-zinc-600 px-1">
          <span>预估 Gas 费用</span>
          <span className="font-mono">~0.001 BNB</span>
        </div>

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
              <span>{isConnected ? (wrongNetwork ? '请切换到 BSC Testnet' : `封存${preset.id === 'custom' ? '胶囊' : preset.name}`) : '请先连接钱包'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
