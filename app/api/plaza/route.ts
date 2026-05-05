import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'

const TESTNET_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || '').trim() as `0x${string}`
const MAINNET_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || '').trim() as `0x${string}`

const testnetClient = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com', { timeout: 15000 }),
})

const mainnetClient = createPublicClient({
  chain: bsc,
  transport: http('https://bsc-dataseed.bnbchain.org', { timeout: 15000 }),
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

interface CapsuleData {
  id: number
  creator: string
  title: string
  contentHash: string
  unlockBlock: number
  bnbAmount: string
  isPublic: boolean
  recipient: string
  chain: 'mainnet' | 'testnet'
}

async function fetchFromChain(
  client: ReturnType<typeof createPublicClient>,
  address: `0x${string}`,
  chain: 'mainnet' | 'testnet'
): Promise<CapsuleData[]> {
  if (!address || address === '0x0000000000000000000000000000000000000000') return []

  try {
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0)

    const logs = await client.getLogs({
      address,
      event: capsuleCreatedEvent,
      fromBlock,
      toBlock: currentBlock,
    })

    const capsules: CapsuleData[] = []
    for (const log of logs) {
      const { id, creator, title, contentHash, unlockBlock, bnbAmount, isPublic, recipient } = log.args
      if (!isPublic) continue
      capsules.push({
        id: Number(id),
        creator: creator as string,
        title: title as string,
        contentHash: contentHash as string,
        unlockBlock: Number(unlockBlock),
        bnbAmount: formatEther(bnbAmount || BigInt(0)),
        isPublic: true,
        recipient: recipient as string,
        chain,
      })
    }
    return capsules
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)
    const chainFilter = searchParams.get('chain') // 'mainnet' | 'testnet' | null (both)

    // Fetch from both chains in parallel
    const promises: Promise<CapsuleData[]>[] = []
    if (!chainFilter || chainFilter === 'mainnet') {
      promises.push(fetchFromChain(mainnetClient, MAINNET_ADDRESS, 'mainnet'))
    }
    if (!chainFilter || chainFilter === 'testnet') {
      promises.push(fetchFromChain(testnetClient, TESTNET_ADDRESS, 'testnet'))
    }

    const results = await Promise.allSettled(promises)
    const allCapsules = results
      .filter((r): r is PromiseFulfilledResult<CapsuleData[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)

    allCapsules.sort((a, b) => b.id - a.id)
    const totalCapsules = allCapsules.length

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
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Plaza fetch error:', msg)
    return NextResponse.json({ capsules: [], totalCapsules: 0, error: '获取数据失败' })
  }
}
