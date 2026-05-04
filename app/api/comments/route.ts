import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// In-memory rate limiter for comments
const commentRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const COMMENT_RATE_LIMIT_MAX = 5 // 5 comments per IP per minute
const COMMENT_RATE_LIMIT_WINDOW_MS = 60 * 1000

setInterval(() => {
  const now = Date.now()
  commentRateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) commentRateLimitMap.delete(key)
  })
}, 5 * 60 * 1000)

function checkCommentRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = commentRateLimitMap.get(ip)
  if (!entry || now > entry.resetTime) {
    commentRateLimitMap.set(ip, { count: 1, resetTime: now + COMMENT_RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= COMMENT_RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// GET: fetch comments for a capsule
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const capsuleId = searchParams.get('capsuleId')

    if (!capsuleId || isNaN(Number(capsuleId))) {
      return NextResponse.json({ error: '无效的胶囊 ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('capsule_comments')
      .select('id, capsule_id, wallet_address, content, created_at')
      .eq('capsule_id', Number(capsuleId))
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ comments: [] })
    }

    return NextResponse.json({ comments: data || [] })
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json({ comments: [] })
  }
}

// POST: create a new comment
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkCommentRateLimit(ip)) {
      return NextResponse.json({ error: '评论过于频繁，请稍后再试' }, { status: 429 })
    }
    const body = await request.json()
    const { capsuleId, walletAddress, content } = body

    // Validation
    if (!capsuleId || isNaN(Number(capsuleId))) {
      return NextResponse.json({ error: '无效的胶囊 ID' }, { status: 400 })
    }
    if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: '无效的钱包地址' }, { status: 400 })
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
    }
    if (content.length > 500) {
      return NextResponse.json({ error: '评论不能超过 500 字符' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('capsule_comments')
      .insert({
        capsule_id: Number(capsuleId),
        wallet_address: walletAddress.toLowerCase(),
        content: content.trim(),
      })
      .select('id, capsule_id, wallet_address, content, created_at')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: '评论发表失败' }, { status: 500 })
    }

    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (error) {
    console.error('Comment create error:', error)
    return NextResponse.json({ error: '评论发表失败' }, { status: 500 })
  }
}
