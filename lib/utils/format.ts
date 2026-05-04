export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatBNB(wei: string): string {
  const value = Number(wei) / 1e18
  return value.toFixed(4)
}
