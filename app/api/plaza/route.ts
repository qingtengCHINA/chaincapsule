import { NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { bscTestnet } from 'viem/chains'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET as `0x${string}`

const client = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com', { timeout: 15_000 }),
})

// CapsuleCreated event ABI
const capsuleCreatedEvent = parseAbiItem(
  'event CapsuleCreated(uint256 indexed id, address indexed creator, string contentHash, uint256 unlockBlock, uint256 bnbAmount, bool isPublic, address recipient)'
)

export async function GET() {
  try {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ capsules: [], error: '合约未部署' })
    }

    // Get current block
    const currentBlock = await client.getBlockNumber()

    // Read CapsuleCreated events from the last ~50000 blocks
    const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n

    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: capsuleCreatedEvent,
      fromBlock,
      toBlock: currentBlock,
    })

    // Build capsule list from events
    const capsules = []

    for (const log of logs) {
      const { id, creator, contentHash, unlockBlock, bnbAmount, isPublic, recipient } = log.args

      // Only include public capsules
      if (!isPublic) continue

      // Get full capsule data from contract
      try {
        const capsuleData = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: [
            {
              inputs: [{ name: 'id', type: 'uint256' }],
              name: 'getCapsule',
              outputs: [{
                type: 'tuple',
                components: [
                  { name: 'id', type: 'uint256' },
                  { name: 'creator', type: 'address' },
                  { name: 'contentHash', type: 'string' },
                  { name: 'unlockBlock', type: 'uint256' },
                  { name: 'createdAt', type: 'uint256' },
                  { name: 'bnbAmount', type: 'uint256' },
                  { name: 'isOpened', type: 'bool' },
                  { name: 'isPublic', type: 'bool' },
                  { name: 'bnbWithdrawn', type: 'bool' },
                  { name: 'recipient', type: 'address' },
                  { name: 'openedAt', type: 'uint256' },
                ],
              }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'getCapsule',
          args: [id!],
        })

        capsules.push({
          id: Number(capsuleData.id),
          creator: capsuleData.creator,
          contentHash: capsuleData.contentHash,
          unlockBlock: Number(capsuleData.unlockBlock),
          createdAt: Number(capsuleData.createdAt),
          bnbAmount: formatEther(capsuleData.bnbAmount),
          isOpened: capsuleData.isOpened,
          isPublic: capsuleData.isPublic,
          recipient: capsuleData.recipient,
        })
      } catch (e) {
        // Skip capsules that fail to read
      }
    }

    // Sort by ID descending (newest first)
    capsules.sort((a, b) => b.id - a.id)

    return NextResponse.json({ capsules })
  } catch (error) {
    console.error('Plaza fetch error:', error)
    return NextResponse.json({ capsules: [], error: '获取数据失败' })
  }
}
