/**
 * Environment variable validation script.
 * Run at build time or before deployment to catch missing config early.
 *
 * Usage: npx tsx scripts/check-env.ts
 */

const REQUIRED_VARS = [
  'NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET',
  'NEXT_PUBLIC_BSC_TESTNET_RPC',
]

const OPTIONAL_VARS = [
  'NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET',
  'NEXT_PUBLIC_CONTRACT_ADDRESS_LOCALHOST',
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'PINATA_API_KEY',
  'PINATA_SECRET_KEY',
]

let hasError = false

console.log('🔍 Checking environment variables...\n')

// Load .env.local if available
try {
  const fs = require('fs')
  const envPath = '.env.local'
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed.slice(eqIdx + 1).trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
    console.log('  Loaded .env.local\n')
  }
} catch {}

// Check required
for (const varName of REQUIRED_VARS) {
  const value = process.env[varName]
  if (!value || value === '0x0000000000000000000000000000000000000000') {
    console.log(`  ❌ ${varName} — MISSING or zero address`)
    hasError = true
  } else {
    const preview = value.length > 30 ? value.slice(0, 30) + '...' : value
    console.log(`  ✅ ${varName} = ${preview}`)
  }
}

console.log('')

// Check optional
for (const varName of OPTIONAL_VARS) {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ⚠️  ${varName} — not set (optional)`)
  } else {
    const preview = value.length > 30 ? value.slice(0, 30) + '...' : value
    console.log(`  ✅ ${varName} = ${preview}`)
  }
}

console.log('')

if (hasError) {
  console.log('💥 Missing required environment variables. Check .env.local or Vercel settings.')
  process.exit(1)
} else {
  console.log('✅ All required environment variables are set.')
}
