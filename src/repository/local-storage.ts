import type { EvaluationSnapshot } from "@/domain"

import { createSeedSnapshot } from "@/data/seed"

import {
  createEvaluationCycleAction,
  deleteEvaluationCycleAction,
  setEvaluationCycleLockAction,
  updateEvaluationCycleAction,
} from "./cycle-actions"
import { deleteDirectScoreRuleAction, saveDirectScoreRuleAction } from "./direct-score-rule-actions"
import { deleteDerivedScoreRuleAction, saveDerivedScoreRuleAction } from "./derived-score-rule-actions"
import { deleteEngineerAction, updateEngineerAction } from "./engineer-roster-actions"
import { deleteEvaluatorAction, updateEvaluatorAction } from "./evaluator-roster-actions"
import {
  updateEvaluatorAssignmentsAction,
  updateEvaluatorPresetAction,
} from "./evaluator-assignment-actions"

import { updateDirectScoreAction } from "./admin-actions"
import { type MutationContext } from "./mutation-context"
import { loadStoredSnapshot, persistSnapshot } from "./persistence"
import { addEngineersAction, addEvaluatorsAction } from "./roster-actions"
import {
  createScheduleEventAction,
  createScheduleEventsAction,
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
import { reopenSheetAction, requestSheetUnlockAction, saveDraftAction, submitSheetAction } from "./sheet-actions"
import { deleteScoreAdjustmentAction, saveScoreAdjustmentAction } from "./score-adjustment-actions"
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
  VERSION_FIVE_LOCAL_STORAGE_KEY,
} from "./storage-keys"
import type {
  AddEngineersInput,
  AddEvaluatorsInput,
  CreateScheduleEventInput,
  CreateScheduleEventsInput,
  CreateEvaluationCycleInput,
  DeleteSourceRecordInput,
  DeleteEngineerInput,
  DeleteEvaluatorInput,
  DeleteScheduleEventInput,
  DeleteScoreAdjustmentInput,
  DeleteEvaluationTaskInput,
  DeleteEvaluationCycleInput,
  DeleteDirectScoreRuleInput,
  DeleteDerivedScoreRuleInput,
  EvaluationRepository,
  ReopenSheetInput,
  RequestSheetUnlockInput,
  RepositoryConfig,
  SaveDraftInput,
  SaveCertificationRecordInput,
  SaveLanguageScoreRecordInput,
  SaveScoreAdjustmentInput,
  SaveEvaluationTaskInput,
  SaveDirectScoreRuleInput,
  SaveDerivedScoreRuleInput,
  SetEvaluationCycleLockInput,
  SheetActionInput,
  UpdateDirectScoreInput,
  UpdateEngineerInput,
  UpdateEvaluatorInput,
  UpdateEvaluationCycleInput,
  UpdateEvaluatorAssignmentsInput,
  UpdateEvaluatorPresetInput,
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

  requestSheetUnlock(input: RequestSheetUnlockInput): EvaluationSnapshot {
    return this.persist(requestSheetUnlockAction(this.context(), input))
  }

  reopenSheet(input: ReopenSheetInput): EvaluationSnapshot {
    return this.persist(reopenSheetAction(this.context(), input))
  }

  updateDirectScore(input: UpdateDirectScoreInput): EvaluationSnapshot {
    return this.persist(updateDirectScoreAction(this.context(), input))
  }

  saveScoreAdjustment(input: SaveScoreAdjustmentInput): EvaluationSnapshot {
    return this.persist(saveScoreAdjustmentAction(this.context(), input))
  }

  deleteScoreAdjustment(input: DeleteScoreAdjustmentInput): EvaluationSnapshot {
    return this.persist(deleteScoreAdjustmentAction(this.context(), input))
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

  updateEvaluationCycle(input: UpdateEvaluationCycleInput): EvaluationSnapshot {
    return this.persist(updateEvaluationCycleAction(this.context(), input))
  }

  setEvaluationCycleLock(input: SetEvaluationCycleLockInput): EvaluationSnapshot {
    return this.persist(setEvaluationCycleLockAction(this.context(), input))
  }

  deleteEvaluationCycle(input: DeleteEvaluationCycleInput): EvaluationSnapshot {
    return this.persist(deleteEvaluationCycleAction(this.context(), input))
  }

  saveDirectScoreRule(input: SaveDirectScoreRuleInput): EvaluationSnapshot {
    return this.persist(saveDirectScoreRuleAction(this.context(), input))
  }

  deleteDirectScoreRule(input: DeleteDirectScoreRuleInput): EvaluationSnapshot {
    return this.persist(deleteDirectScoreRuleAction(this.context(), input))
  }

  saveDerivedScoreRule(input: SaveDerivedScoreRuleInput): EvaluationSnapshot {
    return this.persist(saveDerivedScoreRuleAction(this.context(), input))
  }

  deleteDerivedScoreRule(input: DeleteDerivedScoreRuleInput): EvaluationSnapshot {
    return this.persist(deleteDerivedScoreRuleAction(this.context(), input))
  }

  saveEvaluationTask(input: SaveEvaluationTaskInput): EvaluationSnapshot {
    return this.persist(saveEvaluationTaskAction(this.context(), input))
  }

  deleteEvaluationTask(input: DeleteEvaluationTaskInput): EvaluationSnapshot {
    return this.persist(deleteEvaluationTaskAction(this.context(), input))
  }

  updateEvaluatorAssignments(input: UpdateEvaluatorAssignmentsInput): EvaluationSnapshot {
    return this.persist(updateEvaluatorAssignmentsAction(this.context(), input))
  }

  updateEvaluatorPreset(input: UpdateEvaluatorPresetInput): EvaluationSnapshot {
    return this.persist(updateEvaluatorPresetAction(this.context(), input))
  }

  updateEngineerTaskWeights(input: UpdateEngineerTaskWeightsInput): EvaluationSnapshot {
    return this.persist(updateEngineerTaskWeightsAction(this.context(), input))
  }

  addEngineers(input: AddEngineersInput): EvaluationSnapshot {
    return this.persist(addEngineersAction(this.context(), input))
  }

  updateEngineer(input: UpdateEngineerInput): EvaluationSnapshot {
    return this.persist(updateEngineerAction(this.context(), input))
  }

  deleteEngineer(input: DeleteEngineerInput): EvaluationSnapshot {
    return this.persist(deleteEngineerAction(this.context(), input))
  }

  addEvaluators(input: AddEvaluatorsInput): EvaluationSnapshot {
    return this.persist(addEvaluatorsAction(this.context(), input))
  }

  updateEvaluator(input: UpdateEvaluatorInput): EvaluationSnapshot {
    return this.persist(updateEvaluatorAction(this.context(), input))
  }

  deleteEvaluator(input: DeleteEvaluatorInput): EvaluationSnapshot {
    return this.persist(deleteEvaluatorAction(this.context(), input))
  }

  createScheduleEvent(input: CreateScheduleEventInput): EvaluationSnapshot {
    return this.persist(createScheduleEventAction(this.context(), input))
  }

  createScheduleEvents(input: CreateScheduleEventsInput): EvaluationSnapshot {
    return this.persist(createScheduleEventsAction(this.context(), input))
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
