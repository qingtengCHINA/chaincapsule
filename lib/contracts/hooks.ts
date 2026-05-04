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
    if (!address) throw new Error('合约尚未部署到当前网络，请切换到 BSC Testnet')
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
    if (!address) throw new Error('合约尚未部署到当前网络，请切换到 BSC Testnet')
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

export function useWithdrawBnb() {
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  function withdrawBnb(id: bigint) {
    const address = getContractAddress(chainId)
    if (!address) throw new Error('合约尚未部署到当前网络，请切换到 BSC Testnet')
    writeContract({
      address,
      abi: CHAIN_CAPSULE_ABI,
      functionName: 'withdrawBnb',
      args: [id],
    })
  }

  return {
    withdrawBnb,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || confirmError,
  }
}

export function useReclaimBnb() {
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  function reclaimBnb(id: bigint) {
    const address = getContractAddress(chainId)
    if (!address) throw new Error('合约尚未部署到当前网络，请切换到 BSC Testnet')
    writeContract({
      address,
      abi: CHAIN_CAPSULE_ABI,
      functionName: 'reclaimBnb',
      args: [id],
    })
  }

  return {
    reclaimBnb,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || confirmError,
  }
}

export function useCapsule(id: bigint) {
  const chainId = useChainId()
  const address = getContractAddress(chainId)
  return useReadContract({
    address,
    abi: CHAIN_CAPSULE_ABI,
    functionName: 'getCapsule',
    args: [id],
    query: { enabled: !!address },
  })
}

export function useBlocksUntilUnlock(id: bigint) {
  const chainId = useChainId()
  const address = getContractAddress(chainId)
  return useReadContract({
    address,
    abi: CHAIN_CAPSULE_ABI,
    functionName: 'getBlocksUntilUnlock',
    args: [id],
    query: { enabled: !!address },
  })
}

export function useReclaimBlock(id: bigint) {
  const chainId = useChainId()
  const address = getContractAddress(chainId)
  return useReadContract({
    address,
    abi: CHAIN_CAPSULE_ABI,
    functionName: 'getReclaimBlock',
    args: [id],
    query: { enabled: !!address },
  })
}

export function useUserCapsules(address: `0x${string}` | undefined) {
  const chainId = useChainId()
  const contractAddr = getContractAddress(chainId)
  return useReadContract({
    address: contractAddr,
    abi: CHAIN_CAPSULE_ABI,
    functionName: 'getUserCapsules',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contractAddr },
  })
}
