export const ROLES = ["operator", "evaluator", "approver", "engineer"] as const
export type Role = (typeof ROLES)[number]

export const CYCLE_STATUSES = ["setup", "active", "closed"] as const
export type EvaluationSeasonStatus = (typeof CYCLE_STATUSES)[number]

export const EVALUATION_METHODS = [
  "evaluator_score",
  "evaluator_pass_fail",
  "operator_score",
  "operator_pass_fail",
] as const
export type EvaluationMethod = (typeof EVALUATION_METHODS)[number]

export const TEAMS = ["생산 1팀", "생산 2팀"] as const
export type Team = (typeof TEAMS)[number]

export type EvaluationCycle = Readonly<{
  id: string
  name: string
  status: EvaluationSeasonStatus
  startsAt: string
  endsAt: string
}>

export type Engineer = Readonly<{
  id: string
  employeeCode: string
  displayName: string
  team: Team
  position: string
}>

export type Evaluator = Readonly<{
  id: string
  employeeCode: string
  displayName: string
  team: Team
}>

export type RubricItem = Readonly<{
  id: string
  label: string
  order: number
}>

export type TaskEvaluatorWeight = Readonly<{
  evaluatorId: string
  weight: number
}>

export type EvaluationTask = Readonly<{
  id: string
  cycleId: string
  name: string
  description: string
  method: EvaluationMethod
  weight: number
  order: number
  items: ReadonlyArray<RubricItem>
  evaluatorWeights: ReadonlyArray<TaskEvaluatorWeight>
}>

export type EngineerTaskWeight = Readonly<{
  cycleId: string
  engineerId: string
  taskId: string
  weight: number
}>

export type EvaluatorAssignment = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  evaluatorId: string
  taskId: string
}>

export type ScoreEntry = Readonly<{
  itemId: string
  score: number | null
}>

export type ScoreSheet = Readonly<{
  id: string
  assignmentId: string
  status: "draft" | "submitted"
  scores: ReadonlyArray<ScoreEntry>
  passResult: boolean | null
  updatedAt: string
  submittedAt: string | null
}>

export type DirectScore = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  taskId: string
  score: number | null
  passResult: boolean | null
  updatedAt: string
}>

export type LanguageScoreRecord = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  examName: string
  result: string
  acquiredOn: string | null
  note: string | null
  updatedAt: string
}>

export type CertificationRecord = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  certificateName: string
  grade: string | null
  acquiredOn: string | null
  issuer: string | null
  updatedAt: string
}>

export type EvaluationScheduleEvent = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  title: string
  date: string
  startTime: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}>

export type AuditEvent = Readonly<{
  id: string
  cycleId: string
  type:
    | "sheet_submitted"
    | "sheet_reopened"
    | "direct_score_updated"
    | "language_record_saved"
    | "language_record_deleted"
    | "certification_record_saved"
    | "certification_record_deleted"
    | "source_record_verified"
    | "cycle_created"
    | "task_saved"
    | "task_deleted"
    | "engineer_task_weights_updated"
    | "engineer_added"
    | "evaluator_added"
    | "schedule_event_created"
    | "schedule_event_updated"
    | "schedule_event_deleted"
    | "demo_reset"
  actorId: string
  actorRole: Role
  targetId: string
  reason: string | null
  createdAt: string
}>

export type EvaluationSnapshot = Readonly<{
  schemaVersion: 5
  cycles: ReadonlyArray<EvaluationCycle>
  tasks: ReadonlyArray<EvaluationTask>
  engineerTaskWeights: ReadonlyArray<EngineerTaskWeight>
  engineers: ReadonlyArray<Engineer>
  evaluators: ReadonlyArray<Evaluator>
  assignments: ReadonlyArray<EvaluatorAssignment>
  scoreSheets: ReadonlyArray<ScoreSheet>
  directScores: ReadonlyArray<DirectScore>
  languageScoreRecords: ReadonlyArray<LanguageScoreRecord>
  certificationRecords: ReadonlyArray<CertificationRecord>
  scheduleEvents: ReadonlyArray<EvaluationScheduleEvent>
  auditEvents: ReadonlyArray<AuditEvent>
}>

export type EvaluatorScoreResult = Readonly<{
  assignmentId: string
  evaluatorId: string
  weight: number
  normalizedWeight: number
  rawScore: number | null
  passResult: boolean | null
  submitted: boolean
}>

export type TaskResult = Readonly<{
  taskId: string
  method: EvaluationMethod
  status: "complete" | "incomplete"
  score: number | null
  passCount: number | null
  evaluatorCount: number | null
  evaluators: ReadonlyArray<EvaluatorScoreResult>
}>

export type EngineerResult = Readonly<{
  cycleId: string
  engineerId: string
  status: "complete" | "incomplete"
  taskResults: ReadonlyArray<TaskResult>
  contributions: Readonly<Record<string, number | null>>
  finalScore: number | null
  roundedFinalScore: number | null
}>

export type RankedEngineerResult = EngineerResult & Readonly<{ rank: number }>
