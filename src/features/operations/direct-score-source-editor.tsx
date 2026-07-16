"use client"

import { Check, Info } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SourceRecordReview } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { CertificationRecordDialog } from "./certification-record-dialog"
import { LanguageRecordDialog } from "./language-record-dialog"
import { OperationPanel } from "./operation-panel"
import { SourceRecordDeleteDialog } from "./source-record-delete-dialog"
import type {
  CertificationRecordDraft,
  CertificationOptionViewModel,
  EngineerDirectScoreViewModel,
  LanguageScoreRecordDraft,
  LanguageOptionViewModel,
} from "./types"

interface DirectScoreSourceEditorProps {
  readonly rows: readonly EngineerDirectScoreViewModel[]
  readonly disabled: boolean
  readonly certificationOptions?: readonly CertificationOptionViewModel[] | undefined
  readonly languageOptions?: readonly LanguageOptionViewModel[] | undefined
  readonly cycleStartsAt?: string | undefined
  readonly onSaveLanguageRecord: (record: LanguageScoreRecordDraft) => boolean
  readonly onDeleteLanguageRecord: (recordId: string) => boolean
  readonly onSaveCertificationRecord: (record: CertificationRecordDraft) => boolean
  readonly onDeleteCertificationRecord: (recordId: string) => boolean
  readonly onVerifySourceRecord: (recordId: string, recordKind: "language" | "certification") => boolean
}

export function DirectScoreSourceEditor({
  rows,
  disabled,
  certificationOptions = [],
  languageOptions = [],
  cycleStartsAt,
  onSaveLanguageRecord,
  onDeleteLanguageRecord,
  onSaveCertificationRecord,
  onDeleteCertificationRecord,
  onVerifySourceRecord,
}: DirectScoreSourceEditorProps) {
  const [selectedEngineerId, setSelectedEngineerId] = useState(rows[0]?.engineerId ?? "")
  const selected = rows.find((row) => row.engineerId === selectedEngineerId) ?? rows[0]
  const pendingReviewCount = selected === undefined
    ? 0
    : [...selected.languageRecords, ...selected.certificationRecords]
        .filter((record) => record.reviewStatus === "pending").length

  return (
    <OperationPanel
      description="엔지니어별 어학 성적과 자격증을 원문대로 저장합니다."
      title="어학·자격증 원천 실적"
    >
      <Alert className="mb-5 border-primary/20 bg-accent/70">
        <Info aria-hidden="true" className="text-primary" />
        <AlertTitle>자동 환산 적용</AlertTitle>
        <AlertDescription>
          <span className="block">자격증은 상위 3개 기본점수와 당해연도 신규취득 가산점 1건을 자동 계산합니다.</span>
          <span className="block">
            현재 자격증 환산 {selected?.certificationScore?.score ?? "미입력"}점
            {selected?.certificationScore === undefined ? "" : ` (기본 ${selected.certificationScore.baseScore} + 신규 ${selected.certificationScore.bonusScore} + 필기 ${selected.certificationScore.partialScore})`}
          </span>
          <span className="block">어학은 영어·제2외국어 중 높은 점수를 기준으로 상향·신규 가점을 자동 계산합니다.</span>
          <span className="block">현재 어학 환산 {selected?.languageScore?.score ?? "미입력"}점{selected?.languageScore === undefined ? "" : ` (기본 ${selected.languageScore.baseScore} + 상향 ${selected.languageScore.gradeUpgradeBonus} + 제2외국어 신규 ${selected.languageScore.secondLanguageNewBonus})`}</span>
          <span className="mt-1 block font-medium text-foreground">검토 대기 {pendingReviewCount}건</span>
        </AlertDescription>
      </Alert>

      {selected === undefined ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          먼저 명단 등록에서 엔지니어를 추가해 주세요.
        </p>
      ) : (
        <>
          <div className="mb-5 max-w-md space-y-2">
            <label className="text-sm font-medium" htmlFor="source-record-engineer">
              엔지니어 선택
            </label>
            <Select onValueChange={setSelectedEngineerId} value={selected.engineerId}>
              <SelectTrigger className="w-full" id="source-record-engineer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {rows.map((row) => (
                  <SelectItem key={row.engineerId} value={row.engineerId}>
                    {row.engineerName} · {row.employeeLabel} · {row.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <SourceColumn
              action={(
                <LanguageRecordDialog
                  disabled={disabled}
                  engineerId={selected.engineerId}
                  engineerName={selected.engineerName}
                  initial={null}
                  options={languageOptions}
                  onSave={onSaveLanguageRecord}
                />
              )}
              count={selected.languageRecords.length}
              title="어학 성적"
            >
              {selected.languageRecords.length === 0 ? (
                <EmptyRecord message="등록된 어학 성적이 없습니다." />
              ) : selected.languageRecords.map((record) => (
                <article className="border-t border-border-subtle py-3 first:border-t-0" key={record.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-medium">{record.languageGroup === "second_language" ? `${record.languageName ?? "제2외국어"} ${record.examName}` : `영어 ${record.examName}`}</h4>
                      <p className="numeric mt-1 text-lg font-semibold text-primary">{record.result}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        환산 {record.convertedScore === null || record.convertedScore === undefined
                          ? "기준 미설정 또는 미일치"
                          : `${record.convertedScore}점`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">{record.selectedAsBest ? <Badge variant="secondary">최고점 반영</Badge> : null}{record.gradeUpgradeApplied ? <Badge variant="outline">등급 상향 +10</Badge> : null}{record.secondLanguageNewBonusApplied ? <Badge variant="outline">제2외국어 신규 +10</Badge> : null}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <LanguageRecordDialog
                        disabled={disabled}
                        engineerId={selected.engineerId}
                        engineerName={selected.engineerName}
                        initial={record}
                        options={languageOptions}
                        onSave={onSaveLanguageRecord}
                      />
                      <SourceRecordDeleteDialog
                        accessibleName={`${selected.engineerName} ${record.examName} 어학 성적 삭제`}
                        disabled={disabled}
                        onDelete={() => onDeleteLanguageRecord(record.id)}
                        recordLabel={`${record.examName} ${record.result}`}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    취득일 {record.acquiredOn ?? "미입력"}{record.previousResult == null ? "" : ` · 전년도 ${record.previousResult}`}{record.note === null ? "" : ` · ${record.note}`}
                  </p>
                  <SourceRecordReview status={record.reviewStatus} sourceLabel={record.sourceLabel} updatedAtLabel={record.updatedAtLabel} />
                  {record.reviewStatus === "pending" ? (
                    <Button
                      aria-label={`${selected.engineerName} ${record.examName} 어학 성적 검토 완료`}
                      className="mt-2"
                      disabled={disabled}
                      onClick={() => onVerifySourceRecord(record.id, "language")}
                      size="sm"
                      variant="outline"
                    >
                      <Check aria-hidden="true" />
                      검토 완료
                    </Button>
                  ) : null}
                </article>
              ))}
            </SourceColumn>

            <SourceColumn
              action={(
                <CertificationRecordDialog
                  disabled={disabled}
                  engineerId={selected.engineerId}
                  engineerName={selected.engineerName}
                  initial={null}
                  options={certificationOptions}
                  cycleStartsAt={cycleStartsAt}
                  onSave={onSaveCertificationRecord}
                />
              )}
              count={selected.certificationRecords.length}
              title="자격증"
            >
              {selected.certificationRecords.length === 0 ? (
                <EmptyRecord message="등록된 자격증이 없습니다." />
              ) : selected.certificationRecords.map((record) => (
                <article className="border-t border-border-subtle py-3 first:border-t-0" key={record.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-medium">{record.certificateName}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        기본 {record.baseScore ?? "미설정"}점 · 신규 +{record.newAcquisitionBonus ?? 0}점
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {record.includedInTopThree ? <Badge variant="secondary">상위 3개 반영</Badge> : null}
                        {record.bonusApplied ? <Badge variant="outline">신규취득 가산 적용</Badge> : null}
                        {record.partialScoreApplied ? <Badge variant="outline">필기 합격 2점 적용</Badge> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <CertificationRecordDialog
                        disabled={disabled}
                        engineerId={selected.engineerId}
                        engineerName={selected.engineerName}
                        initial={record}
                        options={certificationOptions}
                        cycleStartsAt={cycleStartsAt}
                        onSave={onSaveCertificationRecord}
                      />
                      <SourceRecordDeleteDialog
                        accessibleName={`${selected.engineerName} ${record.certificateName} 자격증 삭제`}
                        disabled={disabled}
                        onDelete={() => onDeleteCertificationRecord(record.id)}
                        recordLabel={record.certificateName}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    취득일 {record.acquiredOn ?? "미입력"}{record.issuer === null ? "" : ` · ${record.issuer}`}
                  </p>
                  <SourceRecordReview status={record.reviewStatus} sourceLabel={record.sourceLabel} updatedAtLabel={record.updatedAtLabel} />
                  {record.reviewStatus === "pending" ? (
                    <Button
                      aria-label={`${selected.engineerName} ${record.certificateName} 자격증 검토 완료`}
                      className="mt-2"
                      disabled={disabled}
                      onClick={() => onVerifySourceRecord(record.id, "certification")}
                      size="sm"
                      variant="outline"
                    >
                      <Check aria-hidden="true" />
                      검토 완료
                    </Button>
                  ) : null}
                </article>
              ))}
            </SourceColumn>
          </div>
        </>
      )}
    </OperationPanel>
  )
}

function SourceColumn({
  title,
  count,
  action,
  children,
}: Readonly<{
  title: string
  count: number
  action: ReactNode
  children: ReactNode
}>) {
  return (
    <section className="py-4 first:pt-0 last:pb-0 lg:px-4 lg:py-0 lg:first:pl-0 lg:last:pr-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title} <span className="numeric text-muted-foreground">{count}</span></h3>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function EmptyRecord({ message }: Readonly<{ message: string }>) {
  return <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">{message}</p>
}
