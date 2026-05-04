import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
