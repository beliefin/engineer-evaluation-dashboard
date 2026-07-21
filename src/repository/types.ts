import type {
  Department,
  DirectScoreRule,
  Division,
  EvaluationMethod,
  EvaluationSnapshot,
  EvaluationSeasonStatus,
  Role,
  ScoreEntry,
  Team,
} from "@/domain"

export const REPOSITORY_ERROR_CODES = [
  "INVALID_INPUT",
  "NOT_FOUND",
  "SHEET_LOCKED",
  "INCOMPLETE_SHEET",
  "FORBIDDEN",
  "REASON_REQUIRED",
  "DUPLICATE_EMPLOYEE_CODE",
  "TASK_LOCKED",
  "STORAGE_WRITE_FAILED",
] as const

export type RepositoryErrorCode = (typeof REPOSITORY_ERROR_CODES)[number]

export class RepositoryError extends Error {
  readonly name = "RepositoryError"

  constructor(
    readonly code: RepositoryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }
}

export type RepositoryActor = Readonly<{ id: string; role: Role }>

export type SaveDraftInput = Readonly<{
  sheetId: string
  scores: ReadonlyArray<ScoreEntry>
  passResult?: boolean | null
  actor: RepositoryActor
}>

export type SheetActionInput = Readonly<{
  sheetId: string
  actor: RepositoryActor
}>

export type ReopenSheetInput = SheetActionInput & Readonly<{ reason: string }>
export type RequestSheetUnlockInput = SheetActionInput & Readonly<{ reason: string }>

export type UpdateDirectScoreInput = Readonly<{
  cycleId: string
  engineerId: string
  taskId: string
  score: number | null
  passResult: boolean | null
  actor: RepositoryActor
}>

export type SaveScoreAdjustmentInput = Readonly<{
  adjustmentId: string | null
  cycleId: string
  engineerId: string
  amount: number
  reason: string
  actor: RepositoryActor
}>

export type DeleteScoreAdjustmentInput = Readonly<{
  adjustmentId: string
  actor: RepositoryActor
}>

export type SaveLanguageScoreRecordInput = Readonly<{
  recordId: string | null
  cycleId: string
  engineerId: string
  examName: string
  languageName?: string | null
  result: string
  languageGroup?: "english" | "second_language"
  previousResult?: string | null
  newlyAcquired?: boolean
  acquiredOn: string | null
  note: string | null
  actor: RepositoryActor
}>

export type SaveCertificationRecordInput = Readonly<{
  recordId: string | null
  cycleId: string
  engineerId: string
  certificateName: string
  grade: string | null
  acquiredOn: string | null
  issuer: string | null
  actor: RepositoryActor
}>

export type DeleteSourceRecordInput = Readonly<{
  recordId: string
  actor: RepositoryActor
}>

export type SourceRecordKind = "language" | "certification"

export type VerifySourceRecordInput = Readonly<{
  recordId: string
  recordKind: SourceRecordKind
  actor: RepositoryActor
}>

export type NewEvaluationCycleInput = Readonly<{
  name: string
  status: "setup" | "active"
  startsAt: string
  endsAt: string
  copyConfiguration: boolean
}>

export type DeleteEvaluationCycleInput = Readonly<{
  cycleId: string
  actor: RepositoryActor
}>

export type UpdateEvaluationCycleInput = Readonly<{
  cycleId: string
  name: string
  status: EvaluationSeasonStatus
  startsAt: string
  endsAt: string
  actor: RepositoryActor
}>

export type SetEvaluationCycleLockInput = Readonly<{
  cycleId: string
  locked: boolean
  actor: RepositoryActor
}>

export type SaveDirectScoreRuleInput = Readonly<{
  ruleId: string | null
  cycleId: string
  taskId: string
  kind: DirectScoreRule["kind"]
  label: string
  field: DirectScoreRule["field"]
  operator: DirectScoreRule["operator"]
  value: string
  ruleType: DirectScoreRule["ruleType"]
  score: number
  rawScore?: number | null
  bonus: number
  enabled: boolean
  category?: string | null
  difficulty?: string | null
  workRelevance?: string | null
  languageGroup?: DirectScoreRule["languageGroup"]
  examName?: string | null
  bonusCondition?: DirectScoreRule["bonusCondition"]
  actor: RepositoryActor
}>

export type DeleteDirectScoreRuleInput = Readonly<{
  ruleId: string
  actor: RepositoryActor
}>

export type SaveDerivedScoreRuleInput = Readonly<{
  ruleId: string | null
  cycleId: string
  taskId: string
  targetEngineerId: string
  sourceTaskId: string
  sourceEngineerIds: ReadonlyArray<string>
  actor: RepositoryActor
}>

export type DeleteDerivedScoreRuleInput = Readonly<{
  ruleId: string
  actor: RepositoryActor
}>

export type CreateEvaluationCycleInput = NewEvaluationCycleInput & Readonly<{
  sourceCycleId: string
  actor: RepositoryActor
}>

export type EvaluationTaskItemInput = Readonly<{
  id: string | null
  label: string
  section?: string | null
  criteria?: ReadonlyArray<Readonly<{ score: number; description: string }>>
}>

export type SaveEvaluationTaskInput = Readonly<{
  taskId: string | null
  cycleId: string
  name: string
  description: string
  method: EvaluationMethod
  weight: number
  items: ReadonlyArray<EvaluationTaskItemInput>
  actor: RepositoryActor
}>

export type UpdateEvaluatorAssignmentsInput = Readonly<{
  cycleId: string
  engineerId: string
  taskId: string
  evaluatorWeights: ReadonlyArray<Readonly<{ evaluatorId: string; weight: number }>>
  actor: RepositoryActor
}>

export type UpdateEvaluatorPresetInput = Readonly<{
  cycleId: string
  evaluatorWeights: ReadonlyArray<Readonly<{ evaluatorId: string; weight: number }>>
  actor: RepositoryActor
}>

export type DeleteEvaluationTaskInput = Readonly<{
  taskId: string
  actor: RepositoryActor
}>

export type UpdateEngineerTaskWeightsInput = Readonly<{
  cycleId: string
  engineerId: string
  weights: ReadonlyArray<Readonly<{ taskId: string; weight: number }>>
  useSeasonDefaults?: boolean
  actor: RepositoryActor
}>

export type NewEngineerInput = Readonly<{
  employeeCode: string
  displayName: string
  division: Division
  team: Team
  department: Department
  position: string
}>

export type AddEngineersInput = Readonly<{
  cycleId: string
  engineers: ReadonlyArray<NewEngineerInput>
  actor: RepositoryActor
}>

export type UpdateEngineerInput = NewEngineerInput & Readonly<{
  cycleId: string
  engineerId: string
  actor: RepositoryActor
}>

export type DeleteEngineerInput = Readonly<{
  cycleId: string
  engineerId: string
  actor: RepositoryActor
}>

export type NewEvaluatorInput = Readonly<{
  employeeCode: string
  displayName: string
  division: Division
  team: Team
  department: Department
}>

export type AddEvaluatorsInput = Readonly<{
  cycleId: string
  evaluators: ReadonlyArray<NewEvaluatorInput>
  actor: RepositoryActor
}>

export type UpdateEvaluatorInput = NewEvaluatorInput & Readonly<{
  cycleId: string
  evaluatorId: string
  actor: RepositoryActor
}>

export type DeleteEvaluatorInput = Readonly<{
  cycleId: string
  evaluatorId: string
  actor: RepositoryActor
}>

type ScheduleEventFields = Readonly<{
  engineerId: string
  taskId: string
  title: string
  date: string
  startTime: string | null
  note: string | null
}>

export type CreateScheduleEventInput = ScheduleEventFields &
  Readonly<{
    cycleId: string
    actor: RepositoryActor
  }>

export type CreateScheduleEventsInput = Omit<ScheduleEventFields, "engineerId"> &
  Readonly<{
    cycleId: string
    engineerIds: ReadonlyArray<string>
    actor: RepositoryActor
  }>

export type UpdateScheduleEventInput = ScheduleEventFields &
  Readonly<{
    eventId: string
    actor: RepositoryActor
  }>

export type DeleteScheduleEventInput = Readonly<{
  eventId: string
  actor: RepositoryActor
}>

export interface EvaluationRepository {
  loadSnapshot(): EvaluationSnapshot
  saveDraft(input: SaveDraftInput): EvaluationSnapshot
  submitSheet(input: SheetActionInput): EvaluationSnapshot
  requestSheetUnlock(input: RequestSheetUnlockInput): EvaluationSnapshot
  reopenSheet(input: ReopenSheetInput): EvaluationSnapshot
  updateDirectScore(input: UpdateDirectScoreInput): EvaluationSnapshot
  saveScoreAdjustment(input: SaveScoreAdjustmentInput): EvaluationSnapshot
  deleteScoreAdjustment(input: DeleteScoreAdjustmentInput): EvaluationSnapshot
  saveLanguageScoreRecord(input: SaveLanguageScoreRecordInput): EvaluationSnapshot
  deleteLanguageScoreRecord(input: DeleteSourceRecordInput): EvaluationSnapshot
  saveCertificationRecord(input: SaveCertificationRecordInput): EvaluationSnapshot
  deleteCertificationRecord(input: DeleteSourceRecordInput): EvaluationSnapshot
  verifySourceRecord(input: VerifySourceRecordInput): EvaluationSnapshot
  createEvaluationCycle(input: CreateEvaluationCycleInput): EvaluationSnapshot
  updateEvaluationCycle(input: UpdateEvaluationCycleInput): EvaluationSnapshot
  setEvaluationCycleLock(input: SetEvaluationCycleLockInput): EvaluationSnapshot
  deleteEvaluationCycle(input: DeleteEvaluationCycleInput): EvaluationSnapshot
  saveDirectScoreRule(input: SaveDirectScoreRuleInput): EvaluationSnapshot
  deleteDirectScoreRule(input: DeleteDirectScoreRuleInput): EvaluationSnapshot
  saveDerivedScoreRule(input: SaveDerivedScoreRuleInput): EvaluationSnapshot
  deleteDerivedScoreRule(input: DeleteDerivedScoreRuleInput): EvaluationSnapshot
  saveEvaluationTask(input: SaveEvaluationTaskInput): EvaluationSnapshot
  deleteEvaluationTask(input: DeleteEvaluationTaskInput): EvaluationSnapshot
  updateEvaluatorAssignments(input: UpdateEvaluatorAssignmentsInput): EvaluationSnapshot
  updateEvaluatorPreset(input: UpdateEvaluatorPresetInput): EvaluationSnapshot
  updateEngineerTaskWeights(input: UpdateEngineerTaskWeightsInput): EvaluationSnapshot
  addEngineers(input: AddEngineersInput): EvaluationSnapshot
  updateEngineer(input: UpdateEngineerInput): EvaluationSnapshot
  deleteEngineer(input: DeleteEngineerInput): EvaluationSnapshot
  addEvaluators(input: AddEvaluatorsInput): EvaluationSnapshot
  updateEvaluator(input: UpdateEvaluatorInput): EvaluationSnapshot
  deleteEvaluator(input: DeleteEvaluatorInput): EvaluationSnapshot
  createScheduleEvent(input: CreateScheduleEventInput): EvaluationSnapshot
  createScheduleEvents(input: CreateScheduleEventsInput): EvaluationSnapshot
  updateScheduleEvent(input: UpdateScheduleEventInput): EvaluationSnapshot
  deleteScheduleEvent(input: DeleteScheduleEventInput): EvaluationSnapshot
  resetDemoData(): EvaluationSnapshot
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type RepositoryConfig = Readonly<{
  storage: StorageLike
  now?: () => string
  idFactory?: () => string
}>
