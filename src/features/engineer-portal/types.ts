import type { EngineerDetailViewModel } from "@/features/engineers"
import type { SourceRecordReviewStatus } from "@/features/operations/types"
import type {
  CertificationOptionViewModel,
  CertificationScoreSummaryViewModel,
  LanguageOptionViewModel,
  LanguageScoreSummaryViewModel,
} from "@/features/operations/types"

export type EngineerPortalLanguageRecord = Readonly<{
  id: string
  examName: string
  languageName?: string | null
  languageGroup?: "english" | "second_language"
  result: string
  previousResult?: string | null
  newlyAcquired?: boolean
  acquiredOn: string | null
  note: string | null
  reviewStatus: SourceRecordReviewStatus
  sourceLabel: string
  updatedAtLabel: string
  convertedScore?: number | null
  selectedAsBest?: boolean
  gradeUpgradeApplied?: boolean
  secondLanguageNewBonusApplied?: boolean
}>

export type EngineerPortalCertificationRecord = Readonly<{
  id: string
  certificateName: string
  grade: string | null
  acquiredOn: string | null
  issuer: string | null
  reviewStatus: SourceRecordReviewStatus
  sourceLabel: string
  updatedAtLabel: string
  baseScore?: number | null
  newAcquisitionBonus?: number
  includedInTopThree?: boolean
  bonusApplied?: boolean
  partialScoreApplied?: boolean
}>

export type EngineerPortalLanguageDraft = Readonly<{
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

export type EngineerPortalCertificationDraft = Readonly<{
  recordId: string | null
  engineerId: string
  certificateName: string
  grade: string | null
  acquiredOn: string | null
  issuer: string | null
}>

export type EngineerPortalViewModel = Readonly<{
  detail: EngineerDetailViewModel
  languageRecords: ReadonlyArray<EngineerPortalLanguageRecord>
  certificationRecords: ReadonlyArray<EngineerPortalCertificationRecord>
  certificationOptions?: ReadonlyArray<CertificationOptionViewModel>
  certificationScore?: CertificationScoreSummaryViewModel
  languageOptions?: ReadonlyArray<LanguageOptionViewModel>
  languageScore?: LanguageScoreSummaryViewModel
  cycleStartsAt?: string | undefined
}>

export type EngineerPortalCallbacks = Readonly<{
  onSaveLanguageRecord: (record: EngineerPortalLanguageDraft) => boolean
  onDeleteLanguageRecord: (recordId: string) => boolean
  onSaveCertificationRecord: (record: EngineerPortalCertificationDraft) => boolean
  onDeleteCertificationRecord: (recordId: string) => boolean
}>
