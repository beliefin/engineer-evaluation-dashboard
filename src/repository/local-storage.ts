import type { EvaluationSnapshot } from "@/domain"

import { createSeedSnapshot } from "@/data/seed"

import { createEvaluationCycleAction } from "./cycle-actions"

import { updateDirectScoreAction } from "./admin-actions"
import { type MutationContext } from "./mutation-context"
import { loadStoredSnapshot, persistSnapshot } from "./persistence"
import { addEngineersAction, addEvaluatorsAction } from "./roster-actions"
import {
  createScheduleEventAction,
  deleteScheduleEventAction,
  updateScheduleEventAction,
} from "./schedule-actions"
import {
  deleteCertificationRecordAction,
  deleteLanguageScoreRecordAction,
  saveCertificationRecordAction,
  saveLanguageScoreRecordAction,
  verifySourceRecordAction,
} from "./source-record-actions"
import { reopenSheetAction, saveDraftAction, submitSheetAction } from "./sheet-actions"
import {
  deleteEvaluationTaskAction,
  saveEvaluationTaskAction,
} from "./task-actions"
import { updateEngineerTaskWeightsAction } from "./task-weight-actions"
export {
  LEGACY_LOCAL_STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  OLDEST_LOCAL_STORAGE_KEY,
  PREVIOUS_LOCAL_STORAGE_KEY,
  VERSION_FOUR_LOCAL_STORAGE_KEY,
} from "./storage-keys"
import type {
  AddEngineersInput,
  AddEvaluatorsInput,
  CreateScheduleEventInput,
  CreateEvaluationCycleInput,
  DeleteSourceRecordInput,
  DeleteScheduleEventInput,
  DeleteEvaluationTaskInput,
  EvaluationRepository,
  ReopenSheetInput,
  RepositoryConfig,
  SaveDraftInput,
  SaveCertificationRecordInput,
  SaveLanguageScoreRecordInput,
  SaveEvaluationTaskInput,
  SheetActionInput,
  UpdateDirectScoreInput,
  UpdateEngineerTaskWeightsInput,
  UpdateScheduleEventInput,
  VerifySourceRecordInput,
} from "./types"

type ResolvedRepositoryConfig = Readonly<{
  storage: RepositoryConfig["storage"]
  now: () => string
  idFactory: () => string
}>

class LocalStorageEvaluationRepository implements EvaluationRepository {
  constructor(private readonly config: ResolvedRepositoryConfig) {}

  loadSnapshot(): EvaluationSnapshot {
    return loadStoredSnapshot(this.config.storage)
  }

  saveDraft(input: SaveDraftInput): EvaluationSnapshot {
    return this.persist(saveDraftAction(this.context(), input))
  }

  submitSheet(input: SheetActionInput): EvaluationSnapshot {
    return this.persist(submitSheetAction(this.context(), input))
  }

  reopenSheet(input: ReopenSheetInput): EvaluationSnapshot {
    return this.persist(reopenSheetAction(this.context(), input))
  }

  updateDirectScore(input: UpdateDirectScoreInput): EvaluationSnapshot {
    return this.persist(updateDirectScoreAction(this.context(), input))
  }

  saveLanguageScoreRecord(input: SaveLanguageScoreRecordInput): EvaluationSnapshot {
    return this.persist(saveLanguageScoreRecordAction(this.context(), input))
  }

  deleteLanguageScoreRecord(input: DeleteSourceRecordInput): EvaluationSnapshot {
    return this.persist(deleteLanguageScoreRecordAction(this.context(), input))
  }

  saveCertificationRecord(input: SaveCertificationRecordInput): EvaluationSnapshot {
    return this.persist(saveCertificationRecordAction(this.context(), input))
  }

  deleteCertificationRecord(input: DeleteSourceRecordInput): EvaluationSnapshot {
    return this.persist(deleteCertificationRecordAction(this.context(), input))
  }

  verifySourceRecord(input: VerifySourceRecordInput): EvaluationSnapshot {
    return this.persist(verifySourceRecordAction(this.context(), input))
  }

  createEvaluationCycle(input: CreateEvaluationCycleInput): EvaluationSnapshot {
    return this.persist(createEvaluationCycleAction(this.context(), input))
  }

  saveEvaluationTask(input: SaveEvaluationTaskInput): EvaluationSnapshot {
    return this.persist(saveEvaluationTaskAction(this.context(), input))
  }

  deleteEvaluationTask(input: DeleteEvaluationTaskInput): EvaluationSnapshot {
    return this.persist(deleteEvaluationTaskAction(this.context(), input))
  }

  updateEngineerTaskWeights(input: UpdateEngineerTaskWeightsInput): EvaluationSnapshot {
    return this.persist(updateEngineerTaskWeightsAction(this.context(), input))
  }

  addEngineers(input: AddEngineersInput): EvaluationSnapshot {
    return this.persist(addEngineersAction(this.context(), input))
  }

  addEvaluators(input: AddEvaluatorsInput): EvaluationSnapshot {
    return this.persist(addEvaluatorsAction(this.context(), input))
  }

  createScheduleEvent(input: CreateScheduleEventInput): EvaluationSnapshot {
    return this.persist(createScheduleEventAction(this.context(), input))
  }

  updateScheduleEvent(input: UpdateScheduleEventInput): EvaluationSnapshot {
    return this.persist(updateScheduleEventAction(this.context(), input))
  }

  deleteScheduleEvent(input: DeleteScheduleEventInput): EvaluationSnapshot {
    return this.persist(deleteScheduleEventAction(this.context(), input))
  }

  resetDemoData(): EvaluationSnapshot {
    return this.persist(createSeedSnapshot())
  }

  private context(): MutationContext {
    return {
      snapshot: this.loadSnapshot(),
      now: this.config.now(),
      idFactory: this.config.idFactory,
    }
  }

  private persist(snapshot: EvaluationSnapshot): EvaluationSnapshot {
    return persistSnapshot(this.config.storage, snapshot)
  }
}

export function createLocalStorageEvaluationRepository(
  config: RepositoryConfig,
): EvaluationRepository {
  return new LocalStorageEvaluationRepository({
    storage: config.storage,
    now: config.now ?? (() => new Date().toISOString()),
    idFactory: config.idFactory ?? (() => globalThis.crypto.randomUUID()),
  })
}
