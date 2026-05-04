export interface Capsule {
  id: number
  creator: string
  contentHash: string
  unlockBlock: number
  createdAt: number
  bnbAmount: string
  isOpened: boolean
  isPublic: boolean
  recipient: string
}

export interface CapsuleMetadata {
  id: number
  creator_address: string
  recipient_address: string | null
  content_hash: string | null
  unlock_block: number
  created_at_chain: string
  bnb_amount_wei: string
  is_opened: boolean
  is_public: boolean
  content_preview: string
  metadata: Record<string, unknown>
  updated_at: string
}

export interface Profile {
  wallet_address: string
  display_name: string | null
  avatar_url: string | null
  bio: string
  capsule_count: number
  created_at: string
}
