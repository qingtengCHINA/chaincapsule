import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST: save capsule metadata after on-chain creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chainId, onChainId, creator, title, contentHash, unlockBlock, bnbAmount, isPublic, recipient } = body

    // Validate required fields
    if (!chainId || onChainId === undefined || !creator || !title || !contentHash || !unlockBlock) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    // Validate address format
    if (!/^0x[0-9a-fA-F]{40}$/.test(creator)) {
      return NextResponse.json({ error: '无效的创建者地址' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('capsules')
      .upsert({
        chain_id: chainId,
        on_chain_id: onChainId,
        creator: creator.toLowerCase(),
        title: title.trim(),
        content_hash: contentHash,
        unlock_block: unlockBlock,
        bnb_amount: bnbAmount || '0',
        is_public: !!isPublic,
        recipient: recipient?.toLowerCase() || null,
      }, {
        onConflict: 'chain_id,on_chain_id',
        ignoreDuplicates: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, capsule: data }, { status: 201 })
  } catch (error) {
    console.error('Capsule save error:', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
