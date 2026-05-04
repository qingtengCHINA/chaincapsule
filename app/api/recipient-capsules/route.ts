import { NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { bscTestnet } from 'viem/chains'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET as `0x${string}`

const client = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com', { timeout: 15_000 }),
})

const capsuleCreatedEvent = parseAbiItem(
  'event CapsuleCreated(uint256 indexed id, address indexed creator, string contentHash, uint256 unlockBlock, uint256 bnbAmount, bool isPublic, address recipient)'
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || !CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ capsuleIds: [] })
    }

    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > BigInt(50000) ? currentBlock - BigInt(50000) : BigInt(0)

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: capsuleCreatedEvent,
      fromBlock,
      toBlock: currentBlock,
    })

    // Find capsules where the user is the recipient
    const recipientIds: number[] = []
    const lowerAddr = address.toLowerCase()

    for (const log of logs) {
      const { id, recipient } = log.args
      if (recipient && recipient.toLowerCase() === lowerAddr) {
        recipientIds.push(Number(id))
      }
    }

    return NextResponse.json({ capsuleIds: recipientIds })
  } catch (error) {
    console.error('Recipient capsules fetch error:', error)
    return NextResponse.json({ capsuleIds: [] })
  }
}
