import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { getContractAddress } from './addresses'
import { CHAIN_CAPSULE_ABI } from './abi'
import { useChainId } from 'wagmi'

export function useCreateCapsule() {
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  function create(contentHash: string, unlockBlock: bigint, isPublic: boolean, bnbAmount: string) {
    const address = getContractAddress(chainId)
    const value = bnbAmount && parseFloat(bnbAmount) > 0 ? parseEther(bnbAmount) : BigInt(0)

    writeContract({
      address,
      abi: CHAIN_CAPSULE_ABI,
      functionName: 'createCapsule',
      args: [contentHash, unlockBlock, isPublic, '0x0000000000000000000000000000000000000000'],
      value,
    })
  }

  return {
    create,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || confirmError,
  }
}

export function useOpenCapsule() {
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  function openCapsule(id: bigint) {
    const address = getContractAddress(chainId)
    writeContract({
      address,
      abi: CHAIN_CAPSULE_ABI,
      functionName: 'openCapsule',
      args: [id],
    })
  }

  return {
    openCapsule,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || confirmError,
  }
}

export function useCapsule(id: bigint) {
  const chainId = useChainId()
  return useReadContract({
    address: getContractAddress(chainId),
    abi: CHAIN_CAPSULE_ABI,
    functionName: 'getCapsule',
    args: [id],
  })
}

export function useBlocksUntilUnlock(id: bigint) {
  const chainId = useChainId()
  return useReadContract({
    address: getContractAddress(chainId),
    abi: CHAIN_CAPSULE_ABI,
    functionName: 'getBlocksUntilUnlock',
    args: [id],
  })
}

export function useUserCapsules(address: `0x${string}` | undefined) {
  const chainId = useChainId()
  return useReadContract({
    address: address ? getContractAddress(chainId) : undefined,
    abi: CHAIN_CAPSULE_ABI,
    functionName: 'getUserCapsules',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}
