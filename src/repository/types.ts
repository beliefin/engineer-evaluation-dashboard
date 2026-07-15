import type {
  EvaluationMethod,
  EvaluationSnapshot,
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

export type UpdateDirectScoreInput = Readonly<{
  cycleId: string
  engineerId: string
  taskId: string
  score: number | null
  passResult: boolean | null
  actor: RepositoryActor
}>

export type SaveLanguageScoreRecordInput = Readonly<{
  recordId: string | null
  cycleId: string
  engineerId: string
  examName: string
  result: string
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

export type CreateEvaluationCycleInput = NewEvaluationCycleInput & Readonly<{
  sourceCycleId: string
  actor: RepositoryActor
}>

export type EvaluationTaskItemInput = Readonly<{
  id: string | null
  label: string
}>

export type EvaluationTaskEvaluatorInput = Readonly<{
  evaluatorId: string
  weight: number
}>

export type SaveEvaluationTaskInput = Readonly<{
  taskId: string | null
  cycleId: string
  name: string
  description: string
  method: EvaluationMethod
  weight: number
  items: ReadonlyArray<EvaluationTaskItemInput>
  evaluatorWeights: ReadonlyArray<EvaluationTaskEvaluatorInput>
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
  actor: RepositoryActor
}>

export type NewEngineerInput = Readonly<{
  employeeCode: string
  displayName: string
  team: Team
  position: string
}>

export type AddEngineersInput = Readonly<{
  cycleId: string
  engineers: ReadonlyArray<NewEngineerInput>
  actor: RepositoryActor
}>

export type NewEvaluatorInput = Readonly<{
  employeeCode: string
  displayName: string
  team: Team
}>

export type AddEvaluatorsInput = Readonly<{
  cycleId: string
  evaluators: ReadonlyArray<NewEvaluatorInput>
  actor: RepositoryActor
}>

type ScheduleEventFields = Readonly<{
  engineerId: string
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
  reopenSheet(input: ReopenSheetInput): EvaluationSnapshot
  updateDirectScore(input: UpdateDirectScoreInput): EvaluationSnapshot
  saveLanguageScoreRecord(input: SaveLanguageScoreRecordInput): EvaluationSnapshot
  deleteLanguageScoreRecord(input: DeleteSourceRecordInput): EvaluationSnapshot
  saveCertificationRecord(input: SaveCertificationRecordInput): EvaluationSnapshot
  deleteCertificationRecord(input: DeleteSourceRecordInput): EvaluationSnapshot
  verifySourceRecord(input: VerifySourceRecordInput): EvaluationSnapshot
  createEvaluationCycle(input: CreateEvaluationCycleInput): EvaluationSnapshot
  saveEvaluationTask(input: SaveEvaluationTaskInput): EvaluationSnapshot
  deleteEvaluationTask(input: DeleteEvaluationTaskInput): EvaluationSnapshot
  updateEngineerTaskWeights(input: UpdateEngineerTaskWeightsInput): EvaluationSnapshot
  addEngineers(input: AddEngineersInput): EvaluationSnapshot
  addEvaluators(input: AddEvaluatorsInput): EvaluationSnapshot
  createScheduleEvent(input: CreateScheduleEventInput): EvaluationSnapshot
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
