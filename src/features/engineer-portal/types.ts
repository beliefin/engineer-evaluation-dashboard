import type { EngineerDetailViewModel } from "@/features/engineers"
import type { SourceRecordReviewStatus } from "@/features/operations/types"

export type EngineerPortalLanguageRecord = Readonly<{
  id: string
  examName: string
  result: string
  acquiredOn: string | null
  note: string | null
  reviewStatus: SourceRecordReviewStatus
  sourceLabel: string
  updatedAtLabel: string
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
}>

export type EngineerPortalLanguageDraft = Readonly<{
  recordId: string | null
  engineerId: string
  examName: string
  result: string
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
}>

export type EngineerPortalCallbacks = Readonly<{
  onSaveLanguageRecord: (record: EngineerPortalLanguageDraft) => boolean
  onDeleteLanguageRecord: (recordId: string) => boolean
  onSaveCertificationRecord: (record: EngineerPortalCertificationDraft) => boolean
  onDeleteCertificationRecord: (recordId: string) => boolean
}>
