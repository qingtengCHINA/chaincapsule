// BSC average block time is ~3 seconds (not 0.45!)
// See: https://bscscan.com/chart/blocktime
const BSC_BLOCK_TIME_SECONDS = 3

export function dateToUnlockBlock(date: Date, currentBlock: number): number {
  const now = Date.now()
  const target = date.getTime()
  const diffSeconds = (target - now) / 1000
  const blocksAhead = Math.ceil(diffSeconds / BSC_BLOCK_TIME_SECONDS)
  return currentBlock + blocksAhead
}

export function unlockBlockToTimestamp(
  unlockBlock: number,
  currentBlock: number,
  currentTimestamp: number
): Date {
  const blockDiff = unlockBlock - currentBlock
  const secondsUntil = blockDiff * BSC_BLOCK_TIME_SECONDS
  return new Date((currentTimestamp + secondsUntil) * 1000)
}

export function formatCountdown(blocksRemaining: number): string {
  if (blocksRemaining <= 0) return '已解锁'

  const totalSeconds = blocksRemaining * BSC_BLOCK_TIME_SECONDS
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}分钟`)

  return parts.join(' ')
}
