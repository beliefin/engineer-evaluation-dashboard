import type { EvaluationSnapshot } from "@/domain"
import {
  createLocalStorageEvaluationRepository,
  LOCAL_STORAGE_KEY,
  type EvaluationRepository,
  type StorageLike,
} from "@/repository"

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

export function createSnapshotRepository(snapshot: EvaluationSnapshot): EvaluationRepository {
  const storage = new MemoryStorage()
  storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot))
  return createLocalStorageEvaluationRepository({ storage })
}
