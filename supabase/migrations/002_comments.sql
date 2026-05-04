-- ChainCapsule Comments Table
-- Run this in Supabase SQL Editor to create the comments table

CREATE TABLE IF NOT EXISTS capsule_comments (
  id BIGSERIAL PRIMARY KEY,
  capsule_id BIGINT NOT NULL,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by capsule
CREATE INDEX IF NOT EXISTS idx_capsule_comments_capsule_id ON capsule_comments(capsule_id);

-- Index for lookup by wallet
CREATE INDEX IF NOT EXISTS idx_capsule_comments_wallet ON capsule_comments(wallet_address);

-- RLS: allow anonymous read, authenticated write
ALTER TABLE capsule_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Comments are publicly readable"
  ON capsule_comments FOR SELECT
  USING (true);

-- Anyone can insert comments (wallet-signed, no auth required)
CREATE POLICY "Anyone can insert comments"
  ON capsule_comments FOR INSERT
  WITH CHECK (true);

-- No update/delete by users (admin only if needed later)
