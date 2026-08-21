import type { Snapshot } from "./model.ts"

export function projectSeasonOverviewSnapshot(snapshot: Snapshot): Snapshot {
  return {
    schemaVersion: snapshot.schemaVersion,
    cycles: snapshot.cycles,
    tasks: snapshot.tasks,
    engineers: [],
    evaluators: [],
    assignments: [],
    scoreSheets: [],
    directScores: [],
    languageScoreRecords: [],
    certificationRecords: [],
    engineerTaskWeights: [],
    directScoreRules: [],
    derivedScoreRules: [],
    scoreAdjustments: [],
    unlockRequests: [],
    evaluationBenchmarks: [],
    departmentCatalog: [],
    scheduleEvents: [],
    auditEvents: [],
  }
}
