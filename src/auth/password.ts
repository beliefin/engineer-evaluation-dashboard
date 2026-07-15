import type { PasswordHasher } from "./types"

const ITERATIONS = 120_000

export const hashPasswordWithWebCrypto: PasswordHasher = async (password, salt) => {
  const encoder = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("")
}
