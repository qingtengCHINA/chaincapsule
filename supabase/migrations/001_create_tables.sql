-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    wallet_address TEXT PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    capsule_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capsules metadata cache (mirrors on-chain data for fast queries)
CREATE TABLE IF NOT EXISTS capsules (
    id BIGINT PRIMARY KEY,
    creator_address TEXT NOT NULL,
    recipient_address TEXT,
    content_hash TEXT,
    unlock_block BIGINT NOT NULL,
    created_at_chain TIMESTAMPTZ NOT NULL,
    bnb_amount_wei TEXT DEFAULT '0',
    is_opened BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    content_preview TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_caps_creator ON capsules(creator_address);
CREATE INDEX IF NOT EXISTS idx_caps_unlock ON capsules(unlock_block) WHERE NOT is_opened;
CREATE INDEX IF NOT EXISTS idx_caps_public ON capsules(is_public, created_at_chain DESC) WHERE is_public;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);

-- Capsules policies  
CREATE POLICY "Public capsules readable" ON capsules FOR SELECT USING (is_public = true);
CREATE POLICY "Creator can read own capsules" ON capsules FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert capsules" ON capsules FOR INSERT WITH CHECK (true);
CREATE POLICY "Creator can update own capsules" ON capsules FOR UPDATE USING (true);
