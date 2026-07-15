"use client"

import { Info } from "lucide-react"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SourceRecordReview } from "@/components/shared"
import { CertificationRecordDialog } from "@/features/operations/certification-record-dialog"
import { LanguageRecordDialog } from "@/features/operations/language-record-dialog"
import { SourceRecordDeleteDialog } from "@/features/operations/source-record-delete-dialog"

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
  disabled: boolean
}>

export function PersonalSourceRecordEditor({
  engineerId,
  engineerName,
  languageRecords,
  certificationRecords,
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
          <AlertTitle>환산식 미적용</AlertTitle>
          <AlertDescription>
            입력한 원천 실적은 자동으로 점수화되지 않습니다. 환산 점수는 운영자 검토 후 별도로 반영됩니다.
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
                    <h3 className="font-medium">{record.examName}</h3>
                    <p className="numeric mt-1 text-lg font-semibold text-primary">{record.result}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <LanguageRecordDialog disabled={disabled} engineerId={engineerId} engineerName={engineerName} initial={record} onSave={onSaveLanguageRecord} />
                    <SourceRecordDeleteDialog accessibleName={`${engineerName} ${record.examName} 어학 성적 삭제`} disabled={disabled} onDelete={() => onDeleteLanguageRecord(record.id)} recordLabel={`${record.examName} ${record.result}`} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  취득일 {record.acquiredOn ?? "미입력"}{record.note === null ? "" : ` · ${record.note}`}
                </p>
                <SourceRecordReview status={record.reviewStatus} sourceLabel={record.sourceLabel} updatedAtLabel={record.updatedAtLabel} />
              </article>
            ))}
          </RecordColumn>

          <RecordColumn
            action={(
              <CertificationRecordDialog disabled={disabled} engineerId={engineerId} engineerName={engineerName} initial={null} onSave={onSaveCertificationRecord} />
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
                    <p className="mt-1 text-sm text-muted-foreground">{record.grade ?? "등급 미입력"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CertificationRecordDialog disabled={disabled} engineerId={engineerId} engineerName={engineerName} initial={record} onSave={onSaveCertificationRecord} />
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
