import { EngineerEvaluationOverview } from "@/features/engineers/engineer-evaluation-overview"

import { PersonalSourceRecordEditor } from "./personal-source-record-editor"
import type { EngineerPortalCallbacks, EngineerPortalViewModel } from "./types"

type EngineerPortalProps = EngineerPortalCallbacks & Readonly<{
  model: EngineerPortalViewModel
  disabled: boolean
}>

export function EngineerPortal({
  model,
  disabled,
  onSaveLanguageRecord,
  onDeleteLanguageRecord,
  onSaveCertificationRecord,
  onDeleteCertificationRecord,
}: EngineerPortalProps) {
  return (
    <div className="space-y-6">
      <EngineerEvaluationOverview model={model.detail} contextLabel="내 평가" />
      <PersonalSourceRecordEditor
        certificationRecords={model.certificationRecords}
        certificationNoScoreRecordId={model.certificationNoScoreRecordId}
        certificationOptions={model.certificationOptions ?? []}
        certificationScore={model.certificationScore}
        cycleStartsAt={model.cycleStartsAt}
        disabled={disabled}
        engineerId={model.detail.engineer.id}
        engineerName={model.detail.engineer.displayName}
        languageRecords={model.languageRecords}
        languageNoScoreRecordId={model.languageNoScoreRecordId}
        languageOptions={model.languageOptions ?? []}
        languageScore={model.languageScore}
        onDeleteCertificationRecord={onDeleteCertificationRecord}
        onDeleteLanguageRecord={onDeleteLanguageRecord}
        onSaveCertificationRecord={onSaveCertificationRecord}
        onSaveLanguageRecord={onSaveLanguageRecord}
      />
    </div>
  )
}
