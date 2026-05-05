import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)
    const chainFilter = searchParams.get('chain') // 'mainnet' | 'testnet' | null (both)

    let query = supabase
      .from('capsules')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Chain filter
    if (chainFilter === 'mainnet') {
      query = query.eq('chain_id', 56)
    } else if (chainFilter === 'testnet') {
      query = query.eq('chain_id', 97)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ capsules: [], totalCapsules: 0, error: '获取数据失败' })
    }

    const capsules = (data || []).map((row) => ({
      id: row.on_chain_id,
      creator: row.creator,
      title: row.title,
      contentHash: row.content_hash,
      unlockBlock: row.unlock_block,
      bnbAmount: row.bnb_amount,
      isPublic: row.is_public,
      recipient: row.recipient,
      chain: row.chain_id === 56 ? 'mainnet' : 'testnet',
      contentPreview: '', // Will be fetched client-side if needed
      createdAt: row.created_at,
    }))

    return NextResponse.json({ capsules, totalCapsules: count || 0 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Plaza fetch error:', msg)
    return NextResponse.json({ capsules: [], totalCapsules: 0, error: '获取数据失败' })
  }
}
