import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { createClient } from '@supabase/supabase-js'
import { CHAIN_CAPSULE_ABI } from '@/lib/contracts/abi'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TESTNET_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || '').trim() as `0x${string}`
const MAINNET_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || '').trim() as `0x${string}`

const testnetClient = createPublicClient({ chain: bscTestnet, transport: http('https://bsc-testnet-rpc.publicnode.com', { timeout: 15000 }) })
const mainnetClient = createPublicClient({ chain: bsc, transport: http('https://bsc-dataseed.bnbchain.org', { timeout: 15000 }) })

async function backfillChain(
  client: ReturnType<typeof createPublicClient>,
  address: `0x${string}`,
  chainId: number,
  chainName: string
) {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return { chain: chainName, imported: 0, skipped: 0, error: 'No contract address' }
  }

  let imported = 0
  let skipped = 0
  let errors: string[] = []

  // Try capsule IDs 1 through 100 (incremental)
  for (let id = 1; id <= 100; id++) {
    try {
      const capsule = await client.readContract({
        address,
        abi: CHAIN_CAPSULE_ABI,
        functionName: 'getCapsule',
        args: [BigInt(id)],
      }) as any

      // If capsule doesn't exist, the struct fields will be zero/empty
      if (!capsule || capsule.creator === '0x0000000000000000000000000000000000000000') {
        break  // No more capsules
      }

      // Check if already in Supabase
      const { data: existing } = await supabase
        .from('capsules')
        .select('id')
        .eq('chain_id', chainId)
        .eq('on_chain_id', id)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      const { error } = await supabase
        .from('capsules')
        .insert({
          chain_id: chainId,
          on_chain_id: id,
          creator: capsule.creator.toLowerCase(),
          title: capsule.title,
          content_hash: capsule.contentHash,
          unlock_block: Number(capsule.unlockBlock),
          bnb_amount: formatEther(capsule.bnbAmount || BigInt(0)),
          is_public: capsule.isPublic,
          recipient: capsule.recipient !== '0x0000000000000000000000000000000000000000'
            ? capsule.recipient.toLowerCase()
            : null,
        })

      if (error) {
        errors.push(`ID ${id}: ${error.message}`)
      } else {
        imported++
      }
    } catch (e: any) {
      // Contract read failed - likely past the end
      break
    }
  }

  return { chain: chainName, imported, skipped, errors }
}

// POST: backfill existing on-chain capsules into Supabase
export async function POST(request: NextRequest) {
  try {
    const results = await Promise.all([
      backfillChain(mainnetClient, MAINNET_ADDRESS, 56, 'BSC Mainnet'),
      backfillChain(testnetClient, TESTNET_ADDRESS, 97, 'BSC Testnet'),
    ])

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json({ error: '回填失败' }, { status: 500 })
  }
}
