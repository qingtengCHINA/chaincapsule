import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, decodeEventLog } from 'viem'
import { getContractAddress } from './addresses'
import { CHAIN_CAPSULE_ABI } from './abi'
import { useChainId } from 'wagmi'

export function useCreateCapsule() {
  const chainId = useChainId()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()

  const { data: receipt, isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  // Extract capsule ID from CapsuleCreated event
  let capsuleId: bigint | undefined
  if (receipt) {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: CHAIN_CAPSULE_ABI,
          data: log.data,
          topics: log.topics,
        })
        if (decoded.eventName === 'CapsuleCreated') {
          capsuleId = decoded.args.id as bigint
          break
        }
      } catch {}
    }
  }

  function create(title: string, contentHash: string, unlockBlock: bigint, isPublic: boolean, bnbAmount: string, recipient?: string) {
    const address = getContractAddress(chainId)
    if (!address) throw new Error('合约尚未部署到当前网络，请切换到 BSC Testnet')
    const value = bnbAmount && parseFloat(bnbAmount) > 0 ? parseEther(bnbAmount) : BigInt(0)
    const recipientAddr = recipient && recipient.startsWith('0x') && recipient.length === 42
      ? recipient as `0x${string}`
      : '0x0000000000000000000000000000000000000000'

    writeContract({
      address,
      abi: CHAIN_CAPSULE_ABI,
      functionName: 'createCapsule',
      args: [title, contentHash, unlockBlock, isPublic, recipientAddr],
      value,
    })
  }

  return {
    create,
    hash,
    capsuleId,
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
