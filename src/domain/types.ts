export const ROLES = ["operator", "evaluator", "approver", "engineer"] as const
export type Role = (typeof ROLES)[number]

export const CYCLE_STATUSES = ["setup", "active", "closed"] as const
export type EvaluationSeasonStatus = (typeof CYCLE_STATUSES)[number]

export const EVALUATION_METHODS = [
  "evaluator_score",
  "evaluator_pass_fail",
  "operator_score",
  "operator_pass_fail",
  "derived_score",
] as const
export type EvaluationMethod = (typeof EVALUATION_METHODS)[number]

export const TEAMS = ["생산 1팀", "생산 2팀"] as const
export type Team = (typeof TEAMS)[number]

export const DIVISIONS = ["1부문"] as const
export type Division = (typeof DIVISIONS)[number]

export const DEPARTMENTS_BY_TEAM = {
  "생산 1팀": ["전자약품담당", "메틸아민담당", "케미칼운영담당"],
  "생산 2팀": ["염화메탄담당", "ECH1담당", "ECH2담당"],
} as const satisfies Readonly<Record<Team, readonly string[]>>
export type Department = string

export type DepartmentCatalogEntry = Readonly<{
  team: Team
  name: Department
}>

export type EvaluationCycle = Readonly<{
  id: string
  name: string
  status: EvaluationSeasonStatus
  locked: boolean
  startsAt: string
  endsAt: string
}>

export type Engineer = Readonly<{
  id: string
  employeeCode: string
  displayName: string
  division: Division
  team: Team
  department: Department
  organizationUnit: string | null
  position: string
  jobTitle: string | null
}>

export type Evaluator = Readonly<{
  id: string
  employeeCode: string
  displayName: string
  division: Division
  team: Team
  department: Department
  organizationUnit: string | null
  rank: string | null
  jobTitle: string | null
}>

export type RubricCriterion = Readonly<{
  score: number
  description: string
}>

export type RubricItem = Readonly<{
  id: string
  label: string
  order: number
  section: string | null
  criteria: ReadonlyArray<RubricCriterion>
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
}>

export type EngineerTaskWeight = Readonly<{
  cycleId: string
  engineerId: string
  taskId: string
  weight: number
}>

export const DIRECT_SCORE_RULE_KINDS = ["language", "certification"] as const
export type DirectScoreRuleKind = (typeof DIRECT_SCORE_RULE_KINDS)[number]

export const DIRECT_SCORE_RULE_FIELDS = [
  "examName",
  "result",
  "certificateName",
  "grade",
] as const
export type DirectScoreRuleField = (typeof DIRECT_SCORE_RULE_FIELDS)[number]

export const DIRECT_SCORE_RULE_OPERATORS = ["equals", "contains", "gte"] as const
export type DirectScoreRuleOperator = (typeof DIRECT_SCORE_RULE_OPERATORS)[number]

export const DIRECT_SCORE_RULE_TYPES = ["base", "bonus"] as const
export type DirectScoreRuleType = (typeof DIRECT_SCORE_RULE_TYPES)[number]

export const LANGUAGE_GROUPS = ["english", "second_language"] as const
export type LanguageGroup = (typeof LANGUAGE_GROUPS)[number]

export const LANGUAGE_BONUS_CONDITIONS = ["grade_upgrade", "second_language_new"] as const
export type LanguageBonusCondition = (typeof LANGUAGE_BONUS_CONDITIONS)[number]

export type DirectScoreRule = Readonly<{
  id: string
  cycleId: string
  taskId: string
  kind: DirectScoreRuleKind
  label: string
  field: DirectScoreRuleField
  operator: DirectScoreRuleOperator
  value: string
  ruleType: DirectScoreRuleType
  score: number
  rawScore?: number | null | undefined
  bonus: number
  enabled: boolean
  order: number
  category?: string | null | undefined
  difficulty?: string | null | undefined
  workRelevance?: string | null | undefined
  languageGroup?: LanguageGroup | null | undefined
  examName?: string | null | undefined
  bonusCondition?: LanguageBonusCondition | null | undefined
}>

export type DerivedScoreRule = Readonly<{
  id: string
  cycleId: string
  taskId: string
  targetEngineerId: string
  sourceTaskId: string
  sourceEngineerIds: ReadonlyArray<string>
  aggregation: "average"
}>

export type EvaluatorAssignment = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  evaluatorId: string
  taskId: string
  weight: number
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

export type SheetUnlockRequest = Readonly<{
  id: string
  cycleId: string
  sheetId: string
  evaluatorId: string
  reason: string
  status: "pending" | "resolved"
  createdAt: string
  resolvedAt: string | null
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

export type EngineerScoreAdjustment = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  amount: number
  reason: string
  createdAt: string
  updatedAt: string
}>

export type LanguageScoreRecord = Readonly<{
  id: string
  cycleId: string
  engineerId: string
  examName: string
  languageName?: string | null | undefined
  result: string
  languageGroup?: LanguageGroup | undefined
  previousResult?: string | null | undefined
  newlyAcquired?: boolean | undefined
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
  taskId: string | null
  title: string
  date: string
  startTime: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}>

export type EvaluationBenchmark = Readonly<{
  assignmentId: string
  sampleSize: number
  averageScore: number
  minScore: number
  maxScore: number
}>

export type AuditEvent = Readonly<{
  id: string
  cycleId: string
  type:
    | "sheet_submitted"
    | "sheet_reopened"
    | "sheet_unlock_requested"
    | "direct_score_updated"
    | "derived_score_rule_saved"
    | "derived_score_rule_deleted"
    | "score_adjustment_saved"
    | "score_adjustment_deleted"
    | "language_record_saved"
    | "language_record_deleted"
    | "certification_record_saved"
    | "certification_record_deleted"
    | "source_record_verified"
    | "cycle_created"
    | "cycle_updated"
    | "cycle_locked"
    | "cycle_unlocked"
    | "cycle_deleted"
    | "task_saved"
    | "task_deleted"
    | "evaluator_assignments_updated"
    | "engineer_task_weights_updated"
    | "engineer_added"
    | "engineer_updated"
    | "engineer_deleted"
    | "evaluator_added"
    | "evaluator_updated"
    | "evaluator_deleted"
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
  schemaVersion: 8
  cycles: ReadonlyArray<EvaluationCycle>
  tasks: ReadonlyArray<EvaluationTask>
  engineerTaskWeights: ReadonlyArray<EngineerTaskWeight>
  directScoreRules: ReadonlyArray<DirectScoreRule>
  derivedScoreRules: ReadonlyArray<DerivedScoreRule>
  evaluationBenchmarks: ReadonlyArray<EvaluationBenchmark>
  departmentCatalog?: ReadonlyArray<DepartmentCatalogEntry>
  engineers: ReadonlyArray<Engineer>
  evaluators: ReadonlyArray<Evaluator>
  assignments: ReadonlyArray<EvaluatorAssignment>
  scoreSheets: ReadonlyArray<ScoreSheet>
  unlockRequests: ReadonlyArray<SheetUnlockRequest>
  directScores: ReadonlyArray<DirectScore>
  scoreAdjustments: ReadonlyArray<EngineerScoreAdjustment>
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
  baseScore: number | null
  adjustmentTotal: number
  finalScore: number | null
  roundedFinalScore: number | null
}>

export type RankedEngineerResult = EngineerResult & Readonly<{ rank: number }>
