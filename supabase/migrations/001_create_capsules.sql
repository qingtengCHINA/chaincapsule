-- Create capsules table for indexing on-chain capsule metadata
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ntejhpebbzcdkrhejbpc/sql

CREATE TABLE IF NOT EXISTS capsules (
  id BIGSERIAL PRIMARY KEY,
  on_chain_id INTEGER NOT NULL,
  chain_id INTEGER NOT NULL,          -- 56 = BSC Mainnet, 97 = BSC Testnet
  creator TEXT NOT NULL,               -- wallet address
  title TEXT NOT NULL,
  content_hash TEXT NOT NULL,          -- IPFS CID
  unlock_block BIGINT NOT NULL,
  bnb_amount TEXT NOT NULL DEFAULT '0',
  is_public BOOLEAN NOT NULL DEFAULT false,
  recipient TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate entries for the same capsule on the same chain
  UNIQUE (chain_id, on_chain_id)
);

-- Index for plaza queries (public capsules sorted by newest)
CREATE INDEX IF NOT EXISTS idx_capsules_public
  ON capsules (is_public, created_at DESC)
  WHERE is_public = true;

-- Index for user profile queries
CREATE INDEX IF NOT EXISTS idx_capsules_creator
  ON capsules (creator, created_at DESC);

-- Index for chain filtering
CREATE INDEX IF NOT EXISTS idx_capsules_chain
  ON capsules (chain_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read public capsules
CREATE POLICY "Public read access for public capsules"
  ON capsules FOR SELECT
  USING (is_public = true);

-- Policy: anyone can insert (authenticated by wallet signature later)
CREATE POLICY "Anyone can insert capsules"
  ON capsules FOR INSERT
  WITH CHECK (true);

-- Policy: creator can read their own private capsules
CREATE POLICY "Creators can read own capsules"
  ON capsules FOR SELECT
  USING (true);  -- We'll handle private filtering in application layer
