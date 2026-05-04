import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { bscTestnet } from 'viem/chains'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET as `0x${string}`

const client = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com', { timeout: 15000 }),
})

const capsuleCreatedEvent = parseAbiItem(
  'event CapsuleCreated(uint256 indexed id, address indexed creator, string title, string contentHash, uint256 unlockBlock, uint256 bnbAmount, bool isPublic, address recipient)'
)

async function fetchContentPreview(cid: string): Promise<string> {
  if (cid.startsWith('demo_')) return ''
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return ''
    const text = await res.text()
    // Try to extract a "content" field if JSON, otherwise use raw text
    try {
      const json = JSON.parse(text)
      if (typeof json.content === 'string') {
        return json.content.slice(0, 100)
      }
    } catch {
      // not JSON, use raw
    }
    return text.slice(0, 100)
  } catch {
    return ''
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ capsules: [], totalCapsules: 0 })
    }

    // Parse pagination params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0)

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: capsuleCreatedEvent,
      fromBlock,
      toBlock: currentBlock,
    })

    const allCapsules = []

    for (const log of logs) {
      const { id, creator, title, contentHash, unlockBlock, bnbAmount, isPublic, recipient } = log.args

      if (!isPublic) continue

      allCapsules.push({
        id: Number(id),
        creator: creator as string,
        title: title as string,
        contentHash: contentHash as string,
        unlockBlock: Number(unlockBlock),
        bnbAmount: formatEther(bnbAmount || BigInt(0)),
        isPublic: true,
        recipient: recipient as string,
      })
    }

    allCapsules.sort((a, b) => b.id - a.id)

    const totalCapsules = allCapsules.length

    // Paginate first, then fetch previews only for the visible subset
    const paginated = allCapsules.slice(offset, offset + limit)

    const previewResults = await Promise.allSettled(
      paginated.map((c) => fetchContentPreview(c.contentHash))
    )

    const capsules = paginated.map((c, i) => {
      const result = previewResults[i]
      const contentPreview =
        result.status === 'fulfilled' ? result.value : ''
      return { ...c, contentPreview }
    })

    return NextResponse.json({ capsules, totalCapsules })
  } catch (error) {
    console.error('Plaza fetch error:', error)
    return NextResponse.json({ capsules: [], totalCapsules: 0, error: '获取数据失败' })
  }
}
