import {
  evaluationSnapshotSchema,
  legacyEvaluationSnapshotSchema,
  migrateLegacySnapshot,
  migratePreviousSnapshot,
  migrateVersionThreeSnapshot,
  migrateVersionFourSnapshot,
  migrateVersionFiveSnapshot,
  previousEvaluationSnapshotSchema,
  versionThreeEvaluationSnapshotSchema,
  versionFourEvaluationSnapshotSchema,
  versionFiveEvaluationSnapshotSchema,
  type EvaluationSnapshot,
} from "@/domain"

import { createSeedSnapshot } from "@/data/seed"

import {
  LEGACY_LOCAL_STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  OLDEST_LOCAL_STORAGE_KEY,
  PREVIOUS_LOCAL_STORAGE_KEY,
  VERSION_FOUR_LOCAL_STORAGE_KEY,
  VERSION_FIVE_LOCAL_STORAGE_KEY,
} from "./storage-keys"
import { RepositoryError, type StorageLike } from "./types"

function parseStoredJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch (error) {
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

export function loadStoredSnapshot(storage: StorageLike): EvaluationSnapshot {
  const currentRaw = storage.getItem(LOCAL_STORAGE_KEY)
  const current = currentRaw === null ? null : parseSnapshot(currentRaw)
  if (current !== null) return current

  const versionFiveRaw = storage.getItem(VERSION_FIVE_LOCAL_STORAGE_KEY)
  const versionFive = versionFiveRaw === null ? null : parseSnapshot(versionFiveRaw)
  if (versionFive !== null) return versionFive

  const versionFourRaw = storage.getItem(VERSION_FOUR_LOCAL_STORAGE_KEY)
  const versionFour = versionFourRaw === null ? null : parseSnapshot(versionFourRaw)
  if (versionFour !== null) return versionFour

  const previousRaw = storage.getItem(PREVIOUS_LOCAL_STORAGE_KEY)
  const previous = previousRaw === null ? null : parseSnapshot(previousRaw)
  if (previous !== null) return previous

  const legacyRaw = storage.getItem(LEGACY_LOCAL_STORAGE_KEY)
  const legacy = legacyRaw === null ? null : parseSnapshot(legacyRaw)
  if (legacy !== null) return legacy

  const oldestRaw = storage.getItem(OLDEST_LOCAL_STORAGE_KEY)
  const oldest = oldestRaw === null ? null : parseSnapshot(oldestRaw)
  return oldest ?? createSeedSnapshot()
}

function parseSnapshot(raw: string): EvaluationSnapshot | null {
  const json = parseStoredJson(raw)
  const current = evaluationSnapshotSchema.safeParse(json)
  if (current.success) return current.data

  const versionFive = versionFiveEvaluationSnapshotSchema.safeParse(json)
  if (versionFive.success) return migrateVersionFiveSnapshot(versionFive.data)

  const versionFour = versionFourEvaluationSnapshotSchema.safeParse(json)
  if (versionFour.success) return migrateVersionFourSnapshot(versionFour.data)

  const versionThree = versionThreeEvaluationSnapshotSchema.safeParse(json)
  if (versionThree.success) return migrateVersionThreeSnapshot(versionThree.data)

  const previous = previousEvaluationSnapshotSchema.safeParse(json)
  if (previous.success) return migratePreviousSnapshot(previous.data)

  const legacy = legacyEvaluationSnapshotSchema.safeParse(json)
  if (!legacy.success) return null
  const migrated = evaluationSnapshotSchema.safeParse(migrateLegacySnapshot(legacy.data))
  return migrated.success ? migrated.data : null
}

export function persistSnapshot(
  storage: StorageLike,
  snapshot: EvaluationSnapshot,
): EvaluationSnapshot {
  const parsed = evaluationSnapshotSchema.safeParse(snapshot)
  if (!parsed.success) {
    throw new RepositoryError("INVALID_INPUT", "snapshot is invalid", {
      cause: parsed.error,
    })
  }

  try {
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed.data))
  } catch (error) {
    if (error instanceof Error || error instanceof DOMException) {
      throw new RepositoryError("STORAGE_WRITE_FAILED", "failed to write browser storage", {
        cause: error,
      })
    }
    throw error
  }
  return parsed.data
}
