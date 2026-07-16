export type EngineerDetailViewerRole = "operator" | "approver" | "engineer"

export type EngineerResultStatus =
  | "complete"
  | "in_progress"
  | "unconfirmed"

export type EvaluatorSubmissionStatus = "submitted" | "draft" | "pending"

export type EngineerCategoryKey = string

export interface EngineerIdentityViewModel {
  readonly id: string
  readonly displayName: string
  readonly engineerCode: string
  readonly teamName: string
  readonly seasonLabel: string
}

export type EngineerScoreAdjustmentDetailViewModel = Readonly<{
  id: string
  amount: number
  reason: string
  updatedAtLabel: string
}>

type EngineerFinalResultBaseViewModel = Readonly<{
  baseScore: number | null
  adjustmentTotal: number
  adjustments: ReadonlyArray<EngineerScoreAdjustmentDetailViewModel>
  completedCategoryCount: number
  totalCategoryCount: number
}>

export type EngineerFinalResultViewModel = EngineerFinalResultBaseViewModel &
  (
    | {
      readonly status: "complete"
      readonly finalScore: number
    }
    | {
      readonly status: "in_progress" | "unconfirmed"
      readonly finalScore: null
    }
  )

interface CategoryScoreBaseViewModel {
  readonly key: EngineerCategoryKey
  readonly label: string
  readonly reflectionRatioPercent: number
  readonly maxContribution: number
}

export type CategoryScoreViewModel = CategoryScoreBaseViewModel &
  (
    | {
        readonly status: "complete"
        readonly rawScore: number
        readonly contribution: number
      }
    | {
        readonly status: "in_progress" | "unconfirmed"
        readonly rawScore: number | null
        readonly contribution: number | null
      }
  )

interface EvaluatorScoreBaseViewModel {
  readonly id: string
  readonly evaluatorName: string
  readonly categoryLabel: string
  readonly configuredWeight: number
  readonly normalizedRatioPercent: number
}

export type EvaluatorScoreViewModel = EvaluatorScoreBaseViewModel &
  (
    | {
        readonly status: "submitted"
        readonly rawScore: number
      }
    | {
        readonly status: "draft" | "pending"
        readonly rawScore: number | null
      }
  )

export interface EngineerDetailViewModel {
  readonly engineer: EngineerIdentityViewModel
  readonly result: EngineerFinalResultViewModel
  readonly categories: readonly CategoryScoreViewModel[]
  readonly evaluatorScores: readonly EvaluatorScoreViewModel[]
}

export interface EngineerDetailProps {
  readonly role: EngineerDetailViewerRole
  readonly model: EngineerDetailViewModel
  readonly className?: string
}
