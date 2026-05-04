/**
 * @module crypto
 * @description Client-side AES-GCM encryption utility for ChainCapsule dApp.
 *
 * Scheme:
 *   - A 256-bit AES-GCM key is derived from a passphrase using PBKDF2
 *     with SHA-256 and 100 000 iterations.
 *   - The passphrase is `capsuleId + ":" + creatorAddress` (both lower-cased
 *     for the address).
 *   - A fresh 12-byte (96-bit) IV is generated for every encryption.
 *   - The IV is prepended to the ciphertext before base64-encoding, so the
 *     wire format is:  base64( 12-byte-IV || AES-GCM-ciphertext || 16-byte-tag )
 *
 * Dependencies: Web Crypto API only (`window.crypto.subtle`).  No external
 * packages required.
 */

// ---------------------------------------------------------------------------
// Feature gate
// ---------------------------------------------------------------------------

/**
 * `true` when the Web Crypto SubtleCrypto API is available in the current
 * runtime.  Components should check this before attempting encryption /
 * decryption.
 */
export const IS_ENCRYPTION_AVAILABLE: boolean =
  typeof window !== 'undefined' &&
  typeof window.crypto !== 'undefined' &&
  typeof window.crypto.subtle !== 'undefined'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const PBKDF2_ITERATIONS = 100_000
const IV_LENGTH_BYTES = 12
const AES_KEY_LENGTH = 256

/**
 * Derive an AES-256-GCM CryptoKey from a capsule identifier and the
 * creator's wallet address using PBKDF2.
 */
async function deriveKey(capsuleId: string, creatorAddress: string): Promise<CryptoKey> {
  const passphrase = `${capsuleId}:${creatorAddress.toLowerCase()}`

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('ChainCapsule-v1'), // static domain-separated salt
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false, // not extractable
    ['encrypt', 'decrypt'],
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string for a specific capsule.
 *
 * @param plainText       - The content to encrypt.
 * @param capsuleId       - The capsule's on-chain id (as a string).
 * @param creatorAddress  - The wallet address of the capsule creator.
 * @returns A base64-encoded string with the format: base64(iv + ciphertext + tag).
 */
export async function encryptContent(
  plainText: string,
  capsuleId: string,
  creatorAddress: string,
): Promise<string> {
  if (!IS_ENCRYPTION_AVAILABLE) {
    throw new Error('Web Crypto API is not available in this environment')
  }

  const key = await deriveKey(capsuleId, creatorAddress)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES))
  const encoder = new TextEncoder()

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainText),
  )

  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipherBuffer), iv.length)

  // Convert to base64
  return uint8ArrayToBase64(combined)
}

/**
 * Decrypt a base64-encoded ciphertext produced by {@link encryptContent}.
 *
 * @param encryptedBase64 - The base64 string (iv + ciphertext + tag).
 * @param capsuleId       - The capsule's on-chain id (as a string).
 * @param creatorAddress  - The wallet address of the capsule creator.
 * @returns The original plaintext string.
 */
export async function decryptContent(
  encryptedBase64: string,
  capsuleId: string,
  creatorAddress: string,
): Promise<string> {
  if (!IS_ENCRYPTION_AVAILABLE) {
    throw new Error('Web Crypto API is not available in this environment')
  }

  const key = await deriveKey(capsuleId, creatorAddress)
  const combined = base64ToUint8Array(encryptedBase64)

  if (combined.length < IV_LENGTH_BYTES) {
    throw new Error('Encrypted data is too short – invalid or corrupted')
  }

  const iv = combined.slice(0, IV_LENGTH_BYTES)
  const ciphertext = combined.slice(IV_LENGTH_BYTES)

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(plainBuffer)
}

// ---------------------------------------------------------------------------
// Base64 helpers (browser-safe, no Buffer dependency)
// ---------------------------------------------------------------------------

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
