export type AssignedEvaluationStatus = "pending" | "in_progress" | "submitted"

export type AutosaveStatus = "idle" | "saving" | "saved" | "error"

export interface AssignedEvaluationViewModel {
  readonly id: string
  readonly engineerId: string
  readonly taskId: string
  readonly engineerName: string
  readonly teamName: string
  readonly evaluatorId: string
  readonly evaluatorName: string
  readonly categoryLabel: string
  readonly cycleLabel: string
  readonly status: AssignedEvaluationStatus
  readonly answeredCount: number
  readonly totalItems: number
  readonly updatedAtLabel: string
}

export interface ScoreItemViewModel {
  readonly id: string
  readonly index: number
  readonly label: string
  readonly section: string | null
  readonly criteria: readonly Readonly<{ score: number; description: string }>[]
  readonly value: number | null
}

export interface EvaluationScoreFormViewModel {
  readonly assignmentId: string
  readonly cycleLabel: string
  readonly categoryLabel: string
  readonly description: string
  readonly method: "evaluator_score" | "evaluator_pass_fail"
  readonly engineerName: string
  readonly teamName: string
  readonly evaluatorName: string
  readonly proxyEntry: boolean
  readonly submitted: boolean
  readonly unlockRequestPending: boolean
  readonly items: readonly ScoreItemViewModel[]
  readonly passResult: boolean | null
  readonly autosaveStatus: AutosaveStatus
  readonly lastSavedAtLabel: string | null
  readonly submittedAtLabel: string | null
  readonly locked: boolean
  readonly benchmark?: Readonly<{
    sampleSize: number
    averageScore: number
    minScore: number
    maxScore: number
  }> | null
}

export interface EvaluationScoreFormProps {
  readonly viewModel: EvaluationScoreFormViewModel
  readonly onScoreChange: (itemId: string, value: number | null) => void
  readonly onPassResultChange: (value: boolean | null) => void
  readonly onSave: () => void
  readonly onSubmit: () => void
  readonly onRequestUnlock: (reason: string) => void
}
