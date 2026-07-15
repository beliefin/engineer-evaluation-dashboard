import { EngineerDetail } from "@/features/engineers"

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
      <EngineerDetail model={model.detail} role="engineer" />
      <PersonalSourceRecordEditor
        certificationRecords={model.certificationRecords}
        disabled={disabled}
        engineerId={model.detail.engineer.id}
        engineerName={model.detail.engineer.displayName}
        languageRecords={model.languageRecords}
        onDeleteCertificationRecord={onDeleteCertificationRecord}
        onDeleteLanguageRecord={onDeleteLanguageRecord}
        onSaveCertificationRecord={onSaveCertificationRecord}
        onSaveLanguageRecord={onSaveLanguageRecord}
      />
    </div>
  )
}
