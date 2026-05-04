export const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  97: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  56: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000') as `0x${string}`,
}

export function getContractAddress(chainId: number): `0x${string}` {
  const addr = CONTRACT_ADDRESSES[chainId]
  if (!addr || addr === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No contract address for chain ${chainId}`)
  }
  return addr
}
