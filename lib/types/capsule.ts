/**
 * Shared type definitions for ChainCapsule data.
 */

/** Represents the on-chain + off-chain state of a single time capsule. */
export interface CapsuleData {
  /** Unique on-chain capsule identifier. */
  id: number

  /** Wallet address of the capsule creator. */
  creator: string

  /** IPFS / content-hash stored on chain for the encrypted payload. */
  contentHash: string

  /** Block number at which the capsule becomes unlockable. */
  unlockBlock: number

  /** Optional Unix-timestamp (seconds) when the capsule was created off-chain. */
  createdAt?: number

  /** BNB deposited with the capsule (as a string to avoid precision loss). */
  bnbAmount: string

  /** Whether the capsule has already been opened / claimed. */
  isOpened: boolean

  /** Whether the capsule is publicly visible or recipient-only. */
  isPublic: boolean

  /** Address of the intended recipient (or creator address for self-capsules). */
  recipient: string

  /** Optional short plaintext preview of the encrypted content. */
  contentPreview?: string
}
