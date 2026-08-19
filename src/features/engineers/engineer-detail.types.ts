export type EngineerDetailViewerRole = "operator" | "approver" | "evaluator" | "engineer"

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

export type EngineerStoryHighlightViewModel = Readonly<{
  key: EngineerCategoryKey
  label: string
  score: number
  differenceFromAverage: number
}>

export type EngineerStoryProfilePointViewModel = Readonly<{
  key: EngineerCategoryKey
  label: string
  score: number
  averageScore: number
}>

export type EngineerTaskComparisonViewModel = Readonly<{
  key: EngineerCategoryKey
  label: string
  ownScore: number | null
  averageScore: number
  topQuartileAverage: number
  sampleSize: number
}>

export type EngineerEvaluationStoryViewModel = Readonly<{
  score: number | null
  scoreLabel: "최종 점수" | "현재 반영 점수"
  rank: number | null
  cohortCount: number
  topPercentile: number | null
  strongestCategory: EngineerStoryHighlightViewModel | null
  improvementCategory: EngineerStoryHighlightViewModel | null
  profile: readonly EngineerStoryProfilePointViewModel[]
  taskComparisons: readonly EngineerTaskComparisonViewModel[]
}>

export interface EngineerDetailViewModel {
  readonly engineer: EngineerIdentityViewModel
  readonly result: EngineerFinalResultViewModel
  readonly story: EngineerEvaluationStoryViewModel
  readonly categories: readonly CategoryScoreViewModel[]
  readonly evaluatorScores: readonly EvaluatorScoreViewModel[]
}

export interface EngineerDetailProps {
  readonly role: EngineerDetailViewerRole
  readonly model: EngineerDetailViewModel
  readonly className?: string
}
