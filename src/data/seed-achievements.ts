import type {
  CertificationRecord,
  Engineer,
  LanguageScoreRecord,
} from "@/domain"

import { CYCLE_ID, FIXED_TIMESTAMP } from "./seed-fixtures"

const LANGUAGE_EXAMS = ["TOEIC", "OPIc", "TOEIC Speaking"] as const
const LANGUAGE_RESULTS = ["865", "IH", "AL", "780", "IM3", "160"] as const
const CERTIFICATES = [
  ["산업안전기사", "기사", "한국산업인력공단"],
  ["전기기사", "기사", "한국산업인력공단"],
  ["설비보전기사", "기사", "한국산업인력공단"],
  ["컴퓨터활용능력", "1급", "대한상공회의소"],
] as const

export type SampleAchievementRecords = Readonly<{
  languageScoreRecords: ReadonlyArray<LanguageScoreRecord>
  certificationRecords: ReadonlyArray<CertificationRecord>
}>

export function createSampleAchievementRecords(
  engineers: ReadonlyArray<Engineer>,
): SampleAchievementRecords {
  const languageScoreRecords = engineers.slice(0, 6).map((engineer, index) => ({
    id: `language-record-${String(index + 1).padStart(2, "0")}`,
    cycleId: CYCLE_ID,
    engineerId: engineer.id,
    examName: LANGUAGE_EXAMS[index % LANGUAGE_EXAMS.length] ?? "TOEIC",
    result: LANGUAGE_RESULTS[index % LANGUAGE_RESULTS.length] ?? "미입력",
    acquiredOn: `2025-${String((index % 6) + 1).padStart(2, "0")}-15`,
    note: index === 0 ? "샘플 원천 성적" : null,
    updatedAt: FIXED_TIMESTAMP,
  }))
  const certificationRecords = engineers.slice(0, 4).map((engineer, index) => {
    const fixture = CERTIFICATES[index % CERTIFICATES.length] ?? CERTIFICATES[0]
    return {
      id: `certification-record-${String(index + 1).padStart(2, "0")}`,
      cycleId: CYCLE_ID,
      engineerId: engineer.id,
      certificateName: fixture[0],
      grade: fixture[1],
      acquiredOn: `2024-${String((index % 4) + 5).padStart(2, "0")}-20`,
      issuer: fixture[2],
      updatedAt: FIXED_TIMESTAMP,
    }
  })

  return { languageScoreRecords, certificationRecords }
}
