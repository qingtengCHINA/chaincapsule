'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperPlaneTilt } from '@phosphor-icons/react'

interface Comment {
  id: number
  capsule_id: number
  wallet_address: string
  content: string
  created_at: string
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 30) return `${diffDay} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function CapsuleComments({ capsuleId }: { capsuleId: number }) {
  const { address, isConnected } = useAccount()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch comments
  useEffect(() => {
    fetch(`/api/comments?capsuleId=${capsuleId}`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [capsuleId])

  const handleSubmit = async () => {
    if (!address || !newComment.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleId,
          walletAddress: address,
          content: newComment.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '评论发表失败')
        return
      }

      setComments(prev => [...prev, data.comment])
      setNewComment('')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">
        评论 {comments.length > 0 && <span className="text-zinc-600">({comments.length})</span>}
      </h3>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-3 w-20 bg-zinc-800 rounded mb-2" />
              <div className="h-3 w-full bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          <AnimatePresence>
            {comments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {comment.wallet_address.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-zinc-500">
                      {truncateAddress(comment.wallet_address)}
                    </span>
                    <span className="text-[10px] text-zinc-700">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <p className="text-sm text-zinc-600 py-4">还没有评论，来说点什么吧</p>
          )}
        </div>
      )}

      {/* Comment input */}
      {isConnected && address ? (
        <div className="border-t border-zinc-800/50 pt-4">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center">
              <span className="text-[10px] text-zinc-500 font-mono">
                {address.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                rows={2}
                maxLength={500}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
                disabled={submitting}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-zinc-700">
                  {newComment.length}/500
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <PaperPlaneTilt size={14} />
                  {submitting ? '发送中...' : '发表评论'}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 mt-1">{error}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-600 border-t border-zinc-800/50 pt-4">
          连接钱包后可以发表评论
        </p>
      )}
    </div>
  )
}
