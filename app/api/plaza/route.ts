import { NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { bscTestnet } from 'viem/chains'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET as `0x${string}`

const client = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com', { timeout: 15000 }),
})

const capsuleCreatedEvent = parseAbiItem(
  'event CapsuleCreated(uint256 indexed id, address indexed creator, string contentHash, uint256 unlockBlock, uint256 bnbAmount, bool isPublic, address recipient)'
)

export async function GET() {
  try {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ capsules: [] })
    }

    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0)

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: capsuleCreatedEvent,
      fromBlock,
      toBlock: currentBlock,
    })

    const capsules = []

    for (const log of logs) {
      const { id, creator, contentHash, unlockBlock, bnbAmount, isPublic, recipient } = log.args

      if (!isPublic) continue

      capsules.push({
        id: Number(id),
        creator: creator as string,
        contentHash: contentHash as string,
        unlockBlock: Number(unlockBlock),
        bnbAmount: formatEther(bnbAmount || BigInt(0)),
        isPublic: true,
        recipient: recipient as string,
      })
    }

    capsules.sort((a, b) => b.id - a.id)

    return NextResponse.json({ capsules })
  } catch (error) {
    console.error('Plaza fetch error:', error)
    return NextResponse.json({ capsules: [], error: '获取数据失败' })
  }
}
