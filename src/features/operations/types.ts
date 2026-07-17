import type {
  EngineerRegistration,
  EngineerRosterItem,
  EvaluatorRegistration,
  EvaluatorRosterItem,
} from "@/features/roster"
import type {
  DepartmentCatalogEntry,
  DirectScoreRule,
  EvaluationMethod,
} from "@/domain"

export type OperationsCycleStatus = "setup" | "active" | "closed"
export type OperationsTab = "roster" | "season" | "tasks" | "assignments" | "weights" | "derived" | "scores" | "scoreTables" | "adjustments" | "unlocks" | "reset"

export type OperationsTrack = "unselected" | "ots" | "dx"
export type EvaluationCategoryKey = "growth_plan" | "core_track"
export type DirectScoreField = "language" | "certification" | "proposal"
export type SourceRecordKind = "language" | "certification"
export type SourceRecordReviewStatus = "pending" | "verified" | "seed"
export interface EvaluatorWeightViewModel {
  readonly assignmentId: string
  readonly engineerId: string
  readonly engineerName: string
  readonly employeeLabel: string
  readonly teamName: string
  readonly evaluatorId: string
  readonly evaluatorName: string
  readonly categoryKey: EvaluationCategoryKey
  readonly categoryLabel: string
  readonly rawWeight: number
  readonly normalizedRatio: number
}

export type TaskItemDraft = Readonly<{
  id: string | null
  label: string
  section: string | null
  criteria: ReadonlyArray<Readonly<{ score: number; description: string }>>
}>
export type EvaluationTaskDraft = Readonly<{
  taskId: string | null
  name: string
  description: string
  method: EvaluationMethod
  weight: number
  items: ReadonlyArray<TaskItemDraft>
}>

export type EvaluationTaskViewModel = EvaluationTaskDraft & Readonly<{
  taskId: string
  order: number
  locked: boolean
  submittedCount: number
}>

export type EngineerTaskWeightItemViewModel = Readonly<{
  taskId: string
  taskName: string
  method: EvaluationMethod
  defaultWeight: number
  weight: number
}>

export type EngineerTaskWeightViewModel = Readonly<{
  engineerId: string
  engineerName: string
  employeeLabel: string
  teamName: string
  customized: boolean
  seasonDefaultsEnabled?: boolean
  tasks: ReadonlyArray<EngineerTaskWeightItemViewModel>
}>

export type EvaluatorOptionViewModel = Readonly<{
  id: string
  name: string
  employeeCode: string
}>

export type EvaluatorAssignmentEntryViewModel = Readonly<{
  assignmentId: string
  evaluatorId: string
  evaluatorName: string
  weight: number
  normalizedRatio: number
  status: "pending" | "in_progress" | "submitted"
}>

export type EvaluatorAssignmentGroupViewModel = Readonly<{
  engineerId: string
  engineerName: string
  employeeLabel: string
  teamName: string
  taskId: string
  taskName: string
  assignments: ReadonlyArray<EvaluatorAssignmentEntryViewModel>
}>

export type DirectTaskScoreViewModel = Readonly<{
  taskId: string
  taskName: string
  method: "operator_score" | "operator_pass_fail"
  weight: number
  score: number | null
  passResult: boolean | null
  formulaDriven?: boolean
}>

export interface EngineerDirectScoreViewModel {
  readonly engineerId: string
  readonly engineerName: string
  readonly employeeLabel: string
  readonly teamName: string
  readonly directTasks: readonly DirectTaskScoreViewModel[]
  readonly languageRecords: readonly LanguageScoreRecordViewModel[]
  readonly languageScore?: LanguageScoreSummaryViewModel
  readonly certificationRecords: readonly CertificationRecordViewModel[]
  readonly certificationScore?: CertificationScoreSummaryViewModel
}

export type CertificationScoreSummaryViewModel = Readonly<{
  score: number | null
  baseScore: number
  bonusScore: number
  partialScore: number
}>

export type CertificationOptionViewModel = Readonly<{
  name: string
  category: string | null
  difficulty: string | null
  workRelevance: string | null
  baseScore: number
  newAcquisitionBonus: number
  enabled: boolean
}>

export interface LanguageScoreRecordViewModel {
  readonly id: string
  readonly examName: string
  readonly languageName?: string | null
  readonly languageGroup?: "english" | "second_language"
  readonly result: string
  readonly previousResult?: string | null
  readonly newlyAcquired?: boolean
  readonly acquiredOn: string | null
  readonly note: string | null
  readonly reviewStatus: SourceRecordReviewStatus
  readonly sourceLabel: string
  readonly updatedAtLabel: string
  readonly convertedScore?: number | null
  readonly selectedAsBest?: boolean
  readonly gradeUpgradeApplied?: boolean
  readonly secondLanguageNewBonusApplied?: boolean
}

export type LanguageScoreSummaryViewModel = Readonly<{
  score: number | null
  baseScore: number
  gradeUpgradeBonus: number
  secondLanguageNewBonus: number
}>

export type LanguageOptionViewModel = Readonly<{
  languageGroup: "english" | "second_language"
  examName: string
  numericResult: boolean
  resultOptions: readonly string[]
}>

export interface CertificationRecordViewModel {
  readonly id: string
  readonly certificateName: string
  readonly grade: string | null
  readonly acquiredOn: string | null
  readonly issuer: string | null
  readonly reviewStatus: SourceRecordReviewStatus
  readonly sourceLabel: string
  readonly updatedAtLabel: string
  readonly baseScore?: number | null
  readonly newAcquisitionBonus?: number
  readonly includedInTopThree?: boolean
  readonly bonusApplied?: boolean
  readonly partialScoreApplied?: boolean
}

export type LanguageScoreRecordDraft = Readonly<{
  recordId: string | null
  engineerId: string
  examName: string
  languageName: string | null
  languageGroup: "english" | "second_language"
  result: string
  previousResult: string | null
  newlyAcquired: boolean
  acquiredOn: string | null
  note: string | null
}>

export type CertificationRecordDraft = Readonly<{
  recordId: string | null
  engineerId: string
  certificateName: string
  grade: string | null
  acquiredOn: string | null
  issuer: string | null
}>

export type DirectScoreRuleDraft = Readonly<{
  ruleId: string | null
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
  languageGroup?: "english" | "second_language" | null
  examName?: string | null
  bonusCondition?: "grade_upgrade" | "second_language_new" | null
}>

export type DirectScoreRuleViewModel = DirectScoreRule

export type DerivedScoreRuleDraft = Readonly<{
  ruleId: string | null
  taskId: string
  targetEngineerId: string
  sourceTaskId: string
  sourceEngineerIds: ReadonlyArray<string>
}>

export type DerivedScoreRuleViewModel = DerivedScoreRuleDraft & Readonly<{
  ruleId: string
}>

export type DirectScoreRuleImpactViewModel = Readonly<{
  affectedCount: number
  rows: ReadonlyArray<Readonly<{
    engineerId: string
    engineerName: string
    currentTaskScore: number | null
    proposedTaskScore: number | null
    currentFinalScore: number | null
    proposedFinalScore: number | null
  }>>
}>

export type ScoreAdjustmentDraft = Readonly<{
  adjustmentId: string | null
  engineerId: string
  amount: number
  reason: string
}>

export type ScoreAdjustmentEntryViewModel = Readonly<{
  id: string
  amount: number
  reason: string
  updatedAtLabel: string
}>

export type EngineerScoreAdjustmentViewModel = Readonly<{
  engineerId: string
  engineerName: string
  employeeLabel: string
  teamName: string
  baseScore: number | null
  adjustmentTotal: number
  finalScore: number | null
  adjustments: ReadonlyArray<ScoreAdjustmentEntryViewModel>
}>

export type EvaluationCycleDraft = Readonly<{
  name: string
  status: "setup" | "active"
  startsAt: string
  endsAt: string
  copyConfiguration: boolean
}>

export type EvaluationCycleSettingsDraft = Readonly<{
  name: string
  status: OperationsCycleStatus
  startsAt: string
  endsAt: string
}>

export interface SubmittedSheetViewModel {
  readonly sheetId: string
  readonly engineerName: string
  readonly evaluatorName: string
  readonly taskLabel?: string
  readonly categoryLabel?: string
  readonly submittedAtLabel: string
  readonly requestReason: string
  readonly requestedAtLabel: string
}

export interface OperationsViewModel {
  readonly cycleId?: string
  readonly cycleLabel: string
  readonly cycleCount: number
  readonly cycleStatus: "setup" | "active" | "closed"
  readonly cycleLocked: boolean
  readonly cycleStartsAt: string
  readonly cycleEndsAt: string
  readonly tasks: readonly EvaluationTaskViewModel[]
  readonly evaluatorOptions: readonly EvaluatorOptionViewModel[]
  readonly evaluatorAssignments: readonly EvaluatorAssignmentGroupViewModel[]
  readonly weightTotal: number
  readonly engineerTaskWeights: readonly EngineerTaskWeightViewModel[]
  readonly directScores: readonly EngineerDirectScoreViewModel[]
  readonly scoreAdjustments: readonly EngineerScoreAdjustmentViewModel[]
  readonly directScoreRules?: readonly DirectScoreRuleViewModel[]
  readonly derivedScoreRules?: readonly DerivedScoreRuleViewModel[]
  readonly derivedTasks?: readonly Readonly<{ taskId: string; taskName: string }>[]
  readonly derivedSourceTasks?: readonly Readonly<{ taskId: string; taskName: string }>[]
  readonly derivedEngineerOptions?: readonly Readonly<{
    engineerId: string
    engineerName: string
    teamName: string
  }>[]
  readonly operatorTasks?: readonly Readonly<{ taskId: string; taskName: string }>[]
  readonly certificationOptions?: readonly CertificationOptionViewModel[]
  readonly languageOptions?: readonly LanguageOptionViewModel[]
  readonly departmentCatalog?: readonly DepartmentCatalogEntry[]
  readonly rosterEngineers: readonly EngineerRosterItem[]
  readonly rosterEvaluators: readonly EvaluatorRosterItem[]
  readonly submittedSheets: readonly SubmittedSheetViewModel[]
}

export interface OperationsCallbacks {
  readonly onCreateCycle: (cycle: EvaluationCycleDraft) => boolean
  readonly onUpdateCycle: (cycle: EvaluationCycleSettingsDraft) => boolean
  readonly onSetCycleLock: (locked: boolean) => boolean
  readonly onDeleteCycle?: (cycleId: string) => boolean
  readonly onSaveTask: (task: EvaluationTaskDraft) => boolean
  readonly onDeleteTask: (taskId: string) => boolean
  readonly onUpdateEvaluatorAssignments: (
    engineerId: string,
    taskId: string,
    evaluatorWeights: ReadonlyArray<Readonly<{ evaluatorId: string; weight: number }>>,
  ) => boolean
  readonly onEngineerTaskWeightsChange: (
    engineerId: string,
    weights: ReadonlyArray<Readonly<{ taskId: string; weight: number }>>,
    useSeasonDefaults?: boolean,
  ) => boolean
  readonly onSaveDirectScoreRule?: (rule: DirectScoreRuleDraft) => boolean
  readonly onDeleteDirectScoreRule?: (ruleId: string) => boolean
  readonly onPreviewDirectScoreRule?: (rule: DirectScoreRuleDraft) => DirectScoreRuleImpactViewModel
  readonly onSaveDerivedScoreRule?: (rule: DerivedScoreRuleDraft) => boolean
  readonly onDeleteDerivedScoreRule?: (ruleId: string) => boolean
  readonly onDirectScoreChange: (
    engineerId: string,
    taskId: string,
    score: number | null,
    passResult: boolean | null,
  ) => void
  readonly onSaveScoreAdjustment: (adjustment: ScoreAdjustmentDraft) => boolean
  readonly onDeleteScoreAdjustment: (adjustmentId: string) => boolean
  readonly onSaveLanguageRecord: (record: LanguageScoreRecordDraft) => boolean
  readonly onDeleteLanguageRecord: (recordId: string) => boolean
  readonly onSaveCertificationRecord: (record: CertificationRecordDraft) => boolean
  readonly onDeleteCertificationRecord: (recordId: string) => boolean
  readonly onVerifySourceRecord: (recordId: string, recordKind: SourceRecordKind) => boolean
  readonly onAddEngineers: (engineers: readonly EngineerRegistration[]) => boolean
  readonly onUpdateEngineer: (engineerId: string, engineer: EngineerRegistration) => boolean
  readonly onDeleteEngineer: (engineerId: string) => boolean
  readonly onAddEvaluators: (evaluators: readonly EvaluatorRegistration[]) => boolean
  readonly onUpdateEvaluator: (evaluatorId: string, evaluator: EvaluatorRegistration) => boolean
  readonly onDeleteEvaluator: (evaluatorId: string) => boolean
  readonly onReopenSheet: (sheetId: string, reason: string) => boolean
  readonly onResetDemoData: () => void
}

export interface OperationsConsoleProps extends OperationsCallbacks {
  readonly viewModel: OperationsViewModel
  readonly disabled?: boolean
  readonly showReset?: boolean
  readonly activeTab?: OperationsTab
  readonly directScoreQuery?: string
  readonly onTabChange?: (tab: OperationsTab) => void
  readonly linkedEngineerIds?: readonly string[]
  readonly linkedEvaluatorIds?: readonly string[]
}
