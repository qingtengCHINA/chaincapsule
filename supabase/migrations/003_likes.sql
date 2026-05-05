-- ChainCapsule Likes Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS capsule_likes (
  id BIGSERIAL PRIMARY KEY,
  capsule_id BIGINT NOT NULL,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(capsule_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_capsule_likes_capsule_id ON capsule_likes(capsule_id);

ALTER TABLE capsule_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are publicly readable"
  ON capsule_likes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert likes"
  ON capsule_likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own likes"
  ON capsule_likes FOR DELETE
  USING (true);
