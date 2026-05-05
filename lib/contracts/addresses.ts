export const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  31337: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LOCALHOST || '0x0000000000000000000000000000000000000000').trim() as `0x${string}`,
  97: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || '0x0000000000000000000000000000000000000000').trim() as `0x${string}`,
  56: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000').trim() as `0x${string}`,
}

/** Returns contract address or undefined if not deployed on this chain */
export function getContractAddress(chainId: number): `0x${string}` | undefined {
  const addr = CONTRACT_ADDRESSES[chainId]
  if (!addr || addr === '0x0000000000000000000000000000000000000000') {
    return undefined
  }
  return addr
}
