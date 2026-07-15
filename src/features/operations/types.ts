import type {
  EngineerRegistration,
  EngineerRosterItem,
  EvaluatorRegistration,
  EvaluatorRosterItem,
} from "@/features/roster"
import type { EvaluationMethod } from "@/domain"

export type OperationsCycleStatus = "setup" | "active"
export type OperationsTab = "roster" | "season" | "tasks" | "weights" | "scores" | "reset"

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

export type TaskItemDraft = Readonly<{ id: string | null; label: string }>
export type TaskEvaluatorDraft = Readonly<{ evaluatorId: string; weight: number }>
export type EvaluationTaskDraft = Readonly<{
  taskId: string | null
  name: string
  description: string
  method: EvaluationMethod
  weight: number
  items: ReadonlyArray<TaskItemDraft>
  evaluatorWeights: ReadonlyArray<TaskEvaluatorDraft>
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
  tasks: ReadonlyArray<EngineerTaskWeightItemViewModel>
}>

export type EvaluatorOptionViewModel = Readonly<{
  id: string
  name: string
  employeeCode: string
}>

export type DirectTaskScoreViewModel = Readonly<{
  taskId: string
  taskName: string
  method: "operator_score" | "operator_pass_fail"
  weight: number
  score: number | null
  passResult: boolean | null
}>

export interface EngineerDirectScoreViewModel {
  readonly engineerId: string
  readonly engineerName: string
  readonly employeeLabel: string
  readonly teamName: string
  readonly directTasks: readonly DirectTaskScoreViewModel[]
  readonly languageRecords: readonly LanguageScoreRecordViewModel[]
  readonly certificationRecords: readonly CertificationRecordViewModel[]
}

export interface LanguageScoreRecordViewModel {
  readonly id: string
  readonly examName: string
  readonly result: string
  readonly acquiredOn: string | null
  readonly note: string | null
  readonly reviewStatus: SourceRecordReviewStatus
  readonly sourceLabel: string
  readonly updatedAtLabel: string
}

export interface CertificationRecordViewModel {
  readonly id: string
  readonly certificateName: string
  readonly grade: string | null
  readonly acquiredOn: string | null
  readonly issuer: string | null
  readonly reviewStatus: SourceRecordReviewStatus
  readonly sourceLabel: string
  readonly updatedAtLabel: string
}

export type LanguageScoreRecordDraft = Readonly<{
  recordId: string | null
  engineerId: string
  examName: string
  result: string
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

export type EvaluationCycleDraft = Readonly<{
  name: string
  status: OperationsCycleStatus
  startsAt: string
  endsAt: string
  copyConfiguration: boolean
}>

export interface SubmittedSheetViewModel {
  readonly sheetId: string
  readonly engineerName: string
  readonly evaluatorName: string
  readonly taskLabel?: string
  readonly categoryLabel?: string
  readonly submittedAtLabel: string
}

export interface OperationsViewModel {
  readonly cycleLabel: string
  readonly cycleCount: number
  readonly cycleStatus: "setup" | "active" | "closed"
  readonly cycleStartsAt: string
  readonly cycleEndsAt: string
  readonly tasks: readonly EvaluationTaskViewModel[]
  readonly evaluatorOptions: readonly EvaluatorOptionViewModel[]
  readonly weightTotal: number
  readonly engineerTaskWeights: readonly EngineerTaskWeightViewModel[]
  readonly directScores: readonly EngineerDirectScoreViewModel[]
  readonly rosterEngineers: readonly EngineerRosterItem[]
  readonly rosterEvaluators: readonly EvaluatorRosterItem[]
  readonly submittedSheets: readonly SubmittedSheetViewModel[]
}

export interface OperationsCallbacks {
  readonly onCreateCycle: (cycle: EvaluationCycleDraft) => boolean
  readonly onSaveTask: (task: EvaluationTaskDraft) => boolean
  readonly onDeleteTask: (taskId: string) => boolean
  readonly onEngineerTaskWeightsChange: (
    engineerId: string,
    weights: ReadonlyArray<Readonly<{ taskId: string; weight: number }>>,
  ) => boolean
  readonly onDirectScoreChange: (
    engineerId: string,
    taskId: string,
    score: number | null,
    passResult: boolean | null,
  ) => void
  readonly onSaveLanguageRecord: (record: LanguageScoreRecordDraft) => boolean
  readonly onDeleteLanguageRecord: (recordId: string) => boolean
  readonly onSaveCertificationRecord: (record: CertificationRecordDraft) => boolean
  readonly onDeleteCertificationRecord: (recordId: string) => boolean
  readonly onVerifySourceRecord: (recordId: string, recordKind: SourceRecordKind) => boolean
  readonly onAddEngineers: (engineers: readonly EngineerRegistration[]) => boolean
  readonly onAddEvaluators: (evaluators: readonly EvaluatorRegistration[]) => boolean
  readonly onResetDemoData: () => void
}

export interface OperationsConsoleProps extends OperationsCallbacks {
  readonly viewModel: OperationsViewModel
  readonly disabled?: boolean
  readonly showReset?: boolean
  readonly activeTab?: OperationsTab
  readonly directScoreQuery?: string
  readonly onTabChange?: (tab: OperationsTab) => void
}
