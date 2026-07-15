import { LOCAL_STORAGE_KEY } from "./local-storage"
import type { StorageLike } from "./types"

export const FIXED_NOW = "2026-07-14T09:00:00.000Z"

export class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>()

  constructor(initialValue?: string) {
    if (initialValue !== undefined) {
      this.values.set(LOCAL_STORAGE_KEY, initialValue)
    }
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  storedValue(): string | null {
    return this.getItem(LOCAL_STORAGE_KEY)
  }
}

export class FailingStorage implements StorageLike {
  constructor(private readonly initialValue: string) {}

  getItem(): string {
    return this.initialValue
  }

  setItem(): never {
    throw new DOMException("Quota exceeded", "QuotaExceededError")
  }
}

export function createTestIdFactory(): () => string {
  let counter = 0
  return () => {
    counter += 1
    return `audit-test-${counter}`
  }
}
