"use client"

import { Info } from "lucide-react"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SourceRecordReview } from "@/components/shared"
import { CertificationRecordDialog } from "@/features/operations/certification-record-dialog"
import { LanguageRecordDialog } from "@/features/operations/language-record-dialog"
import { SourceRecordDeleteDialog } from "@/features/operations/source-record-delete-dialog"
import { Badge } from "@/components/ui/badge"
import type {
  CertificationOptionViewModel,
  CertificationScoreSummaryViewModel,
  LanguageOptionViewModel,
  LanguageScoreSummaryViewModel,
} from "@/features/operations/types"

import type {
  EngineerPortalCallbacks,
  EngineerPortalCertificationRecord,
  EngineerPortalLanguageRecord,
} from "./types"

type PersonalSourceRecordEditorProps = EngineerPortalCallbacks & Readonly<{
  engineerId: string
  engineerName: string
  languageRecords: ReadonlyArray<EngineerPortalLanguageRecord>
  certificationRecords: ReadonlyArray<EngineerPortalCertificationRecord>
  certificationOptions?: ReadonlyArray<CertificationOptionViewModel> | undefined
  certificationScore?: CertificationScoreSummaryViewModel | undefined
  languageOptions?: ReadonlyArray<LanguageOptionViewModel> | undefined
  languageScore?: LanguageScoreSummaryViewModel | undefined
  cycleStartsAt?: string | undefined
  disabled: boolean
}>

export function PersonalSourceRecordEditor({
  engineerId,
  engineerName,
  languageRecords,
  certificationRecords,
  certificationOptions = [],
  certificationScore,
  languageOptions = [],
  languageScore,
  cycleStartsAt,
  disabled,
  onSaveLanguageRecord,
  onDeleteLanguageRecord,
  onSaveCertificationRecord,
  onDeleteCertificationRecord,
}: PersonalSourceRecordEditorProps) {
  return (
    <section aria-labelledby="personal-records-title" className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold" id="personal-records-title">내 어학·자격증 실적</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          취득한 결과를 원문 그대로 등록하고 관리합니다.
        </p>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <Alert className="mb-5 border-primary/20 bg-accent/70">
          <Info aria-hidden="true" className="text-primary" />
          <AlertTitle>자동 환산 적용</AlertTitle>
          <AlertDescription>
            <span className="block">자격증은 상위 3개 기본점수와 {cycleStartsAt?.slice(0, 4) ?? "당해"}년 신규취득 가산점 1건을 자동 계산합니다.</span>
            <span className="block">현재 자격증 환산 {certificationScore?.score ?? "미입력"}점{certificationScore === undefined ? "" : ` (기본 ${certificationScore.baseScore} + 신규 ${certificationScore.bonusScore} + 필기 ${certificationScore.partialScore})`}</span>
            <span className="block">어학은 영어·제2외국어 중 높은 점수를 기준으로 등급 상향과 제2외국어 신규취득 가점을 계산합니다.</span>
            <span className="block">현재 어학 환산 {languageScore?.score ?? "미입력"}점{languageScore === undefined ? "" : ` (기본 ${languageScore.baseScore} + 상향 ${languageScore.gradeUpgradeBonus} + 제2외국어 신규 ${languageScore.secondLanguageNewBonus})`}</span>
          </AlertDescription>
        </Alert>

        <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
          <RecordColumn
            action={(
              <LanguageRecordDialog
                disabled={disabled}
                engineerId={engineerId}
                engineerName={engineerName}
                initial={null}
                options={languageOptions}
                onSave={onSaveLanguageRecord}
              />
            )}
            count={languageRecords.length}
            title="어학 성적"
          >
            {languageRecords.length === 0 ? (
              <EmptyRecord message="등록한 어학 성적이 없습니다." />
            ) : languageRecords.map((record) => (
              <article className="border-t border-border-subtle py-3 first:border-t-0" key={record.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium">{record.languageGroup === "second_language" ? `${record.languageName ?? "제2외국어"} ${record.examName}` : `영어 ${record.examName}`}</h3>
                    <p className="numeric mt-1 text-lg font-semibold text-primary">{record.result}</p>
                    <p className="mt-1 text-xs text-muted-foreground">환산 {record.convertedScore === null || record.convertedScore === undefined ? "기준 미설정 또는 미일치" : `${record.convertedScore}점`}</p>
                    <div className="mt-2 flex flex-wrap gap-1">{record.selectedAsBest ? <Badge variant="secondary">최고점 반영</Badge> : null}{record.gradeUpgradeApplied ? <Badge variant="outline">등급 상향 +10</Badge> : null}{record.secondLanguageNewBonusApplied ? <Badge variant="outline">제2외국어 신규 +10</Badge> : null}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <LanguageRecordDialog disabled={disabled} engineerId={engineerId} engineerName={engineerName} initial={record} options={languageOptions} onSave={onSaveLanguageRecord} />
                    <SourceRecordDeleteDialog accessibleName={`${engineerName} ${record.examName} 어학 성적 삭제`} disabled={disabled} onDelete={() => onDeleteLanguageRecord(record.id)} recordLabel={`${record.examName} ${record.result}`} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  취득일 {record.acquiredOn ?? "미입력"}{record.previousResult == null ? "" : ` · 전년도 ${record.previousResult}`}{record.note === null ? "" : ` · ${record.note}`}
                </p>
                <SourceRecordReview status={record.reviewStatus} sourceLabel={record.sourceLabel} updatedAtLabel={record.updatedAtLabel} />
              </article>
            ))}
          </RecordColumn>

          <RecordColumn
            action={(
              <CertificationRecordDialog cycleStartsAt={cycleStartsAt} disabled={disabled} engineerId={engineerId} engineerName={engineerName} initial={null} options={certificationOptions} onSave={onSaveCertificationRecord} />
            )}
            count={certificationRecords.length}
            title="자격증"
          >
            {certificationRecords.length === 0 ? (
              <EmptyRecord message="등록한 자격증이 없습니다." />
            ) : certificationRecords.map((record) => (
              <article className="border-t border-border-subtle py-3 first:border-t-0" key={record.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium">{record.certificateName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">기본 {record.baseScore ?? "미설정"}점 · 신규 +{record.newAcquisitionBonus ?? 0}점</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {record.includedInTopThree ? <Badge variant="secondary">상위 3개 반영</Badge> : null}
                      {record.bonusApplied ? <Badge variant="outline">신규취득 가산 적용</Badge> : null}
                      {record.partialScoreApplied ? <Badge variant="outline">필기 합격 2점 적용</Badge> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CertificationRecordDialog cycleStartsAt={cycleStartsAt} disabled={disabled} engineerId={engineerId} engineerName={engineerName} initial={record} options={certificationOptions} onSave={onSaveCertificationRecord} />
                    <SourceRecordDeleteDialog accessibleName={`${engineerName} ${record.certificateName} 자격증 삭제`} disabled={disabled} onDelete={() => onDeleteCertificationRecord(record.id)} recordLabel={record.certificateName} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  취득일 {record.acquiredOn ?? "미입력"}{record.issuer === null ? "" : ` · ${record.issuer}`}
                </p>
                <SourceRecordReview status={record.reviewStatus} sourceLabel={record.sourceLabel} updatedAtLabel={record.updatedAtLabel} />
              </article>
            ))}
          </RecordColumn>
        </div>
      </div>
    </section>
  )
}

function RecordColumn({
  title,
  count,
  action,
  children,
}: Readonly<{ title: string; count: number; action: ReactNode; children: ReactNode }>) {
  return (
    <div className="py-4 first:pt-0 last:pb-0 md:px-4 md:py-0 md:first:pl-0 md:last:pr-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title} <span className="numeric text-muted-foreground">{count}</span></h3>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

function EmptyRecord({ message }: Readonly<{ message: string }>) {
  return <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">{message}</p>
}
