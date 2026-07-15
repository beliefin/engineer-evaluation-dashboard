import type { EvaluationSnapshot } from "@/domain"
import type { EngineerPortalViewModel } from "@/features/engineer-portal/types"

import { selectEngineerDetail } from "./engineers"
import { selectSourceRecordReview } from "./source-record-review"

export function selectEngineerPortal(
  snapshot: EvaluationSnapshot,
  cycleId: string,
  engineerId: string,
): EngineerPortalViewModel | null {
  const detail = selectEngineerDetail(snapshot, cycleId, engineerId, "engineer")
  if (detail === null) return null

  return {
    detail,
    languageRecords: snapshot.languageScoreRecords
      .filter((record) => record.cycleId === cycleId && record.engineerId === engineerId)
      .map((record) => ({
        id: record.id,
        examName: record.examName,
        result: record.result,
        acquiredOn: record.acquiredOn,
        note: record.note,
        ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
      })),
    certificationRecords: snapshot.certificationRecords
      .filter((record) => record.cycleId === cycleId && record.engineerId === engineerId)
      .map((record) => ({
        id: record.id,
        certificateName: record.certificateName,
        grade: record.grade,
        acquiredOn: record.acquiredOn,
        issuer: record.issuer,
        ...selectSourceRecordReview(snapshot, record.id, record.updatedAt),
      })),
  }
}
