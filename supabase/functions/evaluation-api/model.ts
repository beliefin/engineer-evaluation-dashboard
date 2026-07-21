import { z } from "zod"

const id = z.string().trim().min(1)
const timestamp = z.string().trim().min(1)
const nullableText = (max: number) => z.string().trim().min(1).max(max).nullable()
export const roleSchema = z.enum(["operator", "evaluator", "approver", "engineer"])
export type Role = z.infer<typeof roleSchema>

export const profileSchema = z.object({
  auth_user_id: z.uuid(),
  username: z.string(),
  display_name: z.string(),
  role: roleSchema,
  roles: z.array(roleSchema).min(1).max(2),
  evaluator_id: z.string().nullable(),
  engineer_id: z.string().nullable(),
  can_view_insights: z.boolean().default(false),
  active: z.boolean(),
})
export type Profile = z.infer<typeof profileSchema>

export function activateProfileRole(profile: Profile, activeRole: Role): Profile {
  if (!profile.roles.includes(activeRole)) throw new Error("PROFILE_ROLE_FORBIDDEN")
  if (activeRole === "evaluator" && profile.evaluator_id === null) {
    throw new Error("PROFILE_ROLE_LINK_INVALID")
  }
  if (activeRole === "engineer" && profile.engineer_id === null) {
    throw new Error("PROFILE_ROLE_LINK_INVALID")
  }
  return { ...profile, role: activeRole }
}

const cycle = z.object({
  id, name: z.string().trim().min(1), status: z.enum(["setup", "active", "closed"]),
  locked: z.boolean().default(false), startsAt: timestamp, endsAt: timestamp,
  evaluatorPreset: z.array(z.object({
    evaluatorId: id,
    weight: z.number().positive().finite(),
  })).max(50).default([]),
})
const employeeCode = z.string().trim().min(1).transform((value) =>
  /^3101\d{4}$/.test(value) ? value.slice(4) : value)
const versionFiveEngineer = z.object({
  id, employeeCode, displayName: z.string().trim().min(1),
  team: z.enum(["생산 1팀", "생산 2팀"]), position: z.string().trim().min(1),
})
const versionFiveEvaluator = z.object({
  id, employeeCode, displayName: z.string().trim().min(1),
  team: z.enum(["생산 1팀", "생산 2팀"]),
})
const department = z.string().trim().min(1).max(100)
const departmentCatalogEntry = z.object({
  team: z.enum(["생산 1팀", "생산 2팀"]),
  name: department,
})
const engineer = versionFiveEngineer
  .extend({
    division: z.literal("1부문"), department,
    organizationUnit: nullableText(100).default(null),
    jobTitle: nullableText(100).default(null),
  })
const evaluator = versionFiveEvaluator
  .extend({
    division: z.literal("1부문"), department,
    organizationUnit: nullableText(100).default(null),
    rank: nullableText(100).default(null),
    jobTitle: nullableText(100).default(null),
  })
const rubricCriterion = z.object({
  score: z.number().int().min(0).max(10),
  description: z.string().trim().min(1).max(500),
})
const rubricItem = z.object({
  id,
  label: z.string().trim().min(1).max(200),
  order: z.number().int(),
  section: z.string().trim().min(1).max(50).nullable().default(null),
  criteria: z.array(rubricCriterion).max(11).default([]),
})
const evaluatorWeight = z.object({ evaluatorId: id, weight: z.number().positive().finite() })
export const taskSchema = z.object({
  id, cycleId: id, name: z.string().trim().min(1).max(100), description: z.string().max(1_000),
  method: z.enum(["evaluator_score", "evaluator_pass_fail", "operator_score", "operator_pass_fail", "derived_score"]),
  weight: z.number().min(0).max(100), order: z.number().int(), items: z.array(rubricItem).max(20),
})
const legacyTaskSchema = taskSchema.extend({ evaluatorWeights: z.array(evaluatorWeight).max(50) })
export type Task = z.infer<typeof taskSchema>
const engineerTaskWeight = z.object({
  cycleId: id, engineerId: id, taskId: id, weight: z.number().min(0).max(100),
})
const directScoreRule = z.object({
  id, cycleId: id, taskId: id,
  kind: z.enum(["language", "certification"]),
  label: z.string().trim().min(1).max(100),
  field: z.enum(["examName", "result", "certificateName", "grade"]),
  operator: z.enum(["equals", "contains", "gte"]),
  value: z.string().trim().min(1).max(100),
  ruleType: z.enum(["base", "bonus"]),
  score: z.number().min(0).max(100), rawScore: z.number().min(0).max(110).nullable().optional(),
  bonus: z.number().min(0).max(100),
  enabled: z.boolean(), order: z.number().int().min(1),
  category: z.string().trim().min(1).max(100).nullable().optional(),
  difficulty: z.string().trim().min(1).max(100).nullable().optional(),
  workRelevance: z.string().trim().min(1).max(100).nullable().optional(),
  languageGroup: z.enum(["english", "second_language"]).nullable().optional(),
  examName: z.string().trim().min(1).max(100).nullable().optional(),
  bonusCondition: z.enum(["grade_upgrade", "second_language_new"]).nullable().optional(),
})
const derivedScoreRule = z.object({
  id, cycleId: id, taskId: id, targetEngineerId: id, sourceTaskId: id,
  sourceEngineerIds: z.array(id).min(1).max(100).refine((ids) => new Set(ids).size === ids.length),
  aggregation: z.literal("average"),
})
export type DerivedScoreRule = z.infer<typeof derivedScoreRule>
const evaluationBenchmark = z.object({
  assignmentId: id, sampleSize: z.number().int().min(1).max(3),
  averageScore: z.number().min(0).max(100), minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100),
})
export type EvaluationBenchmark = z.infer<typeof evaluationBenchmark>
const legacyAssignmentSchema = z.object({
  id, cycleId: id, engineerId: id, evaluatorId: id, taskId: id,
})
export const assignmentSchema = legacyAssignmentSchema.extend({ weight: z.number().positive().finite() })
export type Assignment = z.infer<typeof assignmentSchema>
const scoreEntry = z.object({ itemId: id, score: z.number().int().min(0).max(10).nullable() })
export const scoreSheetSchema = z.object({
  id, assignmentId: id, status: z.enum(["draft", "submitted"]), scores: z.array(scoreEntry).max(20),
  passResult: z.boolean().nullable(), updatedAt: timestamp, submittedAt: timestamp.nullable(),
})
export type ScoreSheet = z.infer<typeof scoreSheetSchema>
const unlockRequestSchema = z.object({
  id, cycleId: id, sheetId: id, evaluatorId: id,
  reason: z.string().trim().min(1).max(500), status: z.enum(["pending", "resolved"]),
  createdAt: timestamp, resolvedAt: timestamp.nullable(),
})
export const directScoreSchema = z.object({
  id, cycleId: id, engineerId: id, taskId: id, score: z.number().min(0).max(100).nullable(),
  passResult: z.boolean().nullable(), updatedAt: timestamp,
})
export type DirectScore = z.infer<typeof directScoreSchema>
export const scoreAdjustmentSchema = z.object({
  id,
  cycleId: id,
  engineerId: id,
  amount: z.number().finite().min(-100).max(100).multipleOf(0.1).refine((amount) => amount !== 0),
  reason: z.string().trim().min(1).max(300),
  createdAt: timestamp,
  updatedAt: timestamp,
})
export const languageRecordSchema = z.object({
  id, cycleId: id, engineerId: id, examName: z.string().trim().min(1).max(100),
  languageName: nullableText(100).optional(),
  result: z.string().trim().min(1).max(100), acquiredOn: z.iso.date().nullable(),
  noScore: z.boolean().optional(),
  languageGroup: z.enum(["english", "second_language"]).optional(),
  previousResult: nullableText(100).optional(), newlyAcquired: z.boolean().optional(),
  note: nullableText(300), updatedAt: timestamp,
})
export type LanguageRecord = z.infer<typeof languageRecordSchema>
export const certificationRecordSchema = z.object({
  id, cycleId: id, engineerId: id, certificateName: z.string().trim().min(1).max(100),
  noScore: z.boolean().optional(),
  grade: nullableText(100), acquiredOn: z.iso.date().nullable(), issuer: nullableText(100),
  updatedAt: timestamp,
})
export type CertificationRecord = z.infer<typeof certificationRecordSchema>
const scheduleEvent = z.object({
  id, cycleId: id, engineerId: id, taskId: id.nullable().default(null),
  title: z.string().trim().min(1).max(100), date: z.iso.date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(), note: nullableText(500),
  createdAt: timestamp, updatedAt: timestamp,
})
const auditEvent = z.object({
  id, cycleId: id, type: z.string().trim().min(1), actorId: id, actorRole: roleSchema,
  targetId: id, reason: z.string().trim().min(1).nullable(), createdAt: timestamp,
})

const sharedSnapshotFields = {
  cycles: z.array(cycle).min(1),
  engineerTaskWeights: z.array(engineerTaskWeight), directScoreRules: z.array(directScoreRule).default([]),
  departmentCatalog: z.array(departmentCatalogEntry).default([]),
  scoreSheets: z.array(scoreSheetSchema), directScores: z.array(directScoreSchema),
  scoreAdjustments: z.array(scoreAdjustmentSchema).default([]),
  languageScoreRecords: z.array(languageRecordSchema),
  certificationRecords: z.array(certificationRecordSchema), scheduleEvents: z.array(scheduleEvent),
  auditEvents: z.array(auditEvent),
}
const snapshotFields = {
  ...sharedSnapshotFields,
  tasks: z.array(taskSchema), engineers: z.array(engineer), evaluators: z.array(evaluator),
  assignments: z.array(assignmentSchema), unlockRequests: z.array(unlockRequestSchema).default([]),
}
const legacySnapshotFields = {
  ...sharedSnapshotFields,
  tasks: z.array(legacyTaskSchema), engineers: z.array(engineer), evaluators: z.array(evaluator),
  assignments: z.array(legacyAssignmentSchema),
}
const versionSevenSnapshotSchema = z.object({ schemaVersion: z.literal(7), ...snapshotFields })
type VersionSevenSnapshot = z.infer<typeof versionSevenSnapshotSchema>
export const snapshotSchema = z.object({
  schemaVersion: z.literal(8),
  ...snapshotFields,
  derivedScoreRules: z.array(derivedScoreRule).default([]),
  evaluationBenchmarks: z.array(evaluationBenchmark).default([]),
})
export type Snapshot = z.infer<typeof snapshotSchema>

const versionSixSnapshotSchema = z.object({ schemaVersion: z.literal(6), ...legacySnapshotFields })
type VersionSixSnapshot = z.infer<typeof versionSixSnapshotSchema>

const versionFiveSnapshotSchema = z.object({
  schemaVersion: z.literal(5),
  ...legacySnapshotFields,
  engineers: z.array(versionFiveEngineer),
  evaluators: z.array(versionFiveEvaluator),
})

function defaultDepartment(team: "생산 1팀" | "생산 2팀") {
  return team === "생산 1팀" ? "전자약품담당" as const : "염화메탄담당" as const
}

function migrateVersionSix(snapshot: VersionSixSnapshot): Snapshot {
  const sheetByAssignment = new Map(snapshot.scoreSheets.map((sheet) => [sheet.assignmentId, sheet]))
  const assignments = snapshot.assignments.filter((assignment) => {
    const sheet = sheetByAssignment.get(assignment.id)
    return sheet?.status === "submitted" || sheet?.passResult !== null && sheet?.passResult !== undefined ||
      sheet?.scores.some((entry) => entry.score !== null) === true
  })
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id))
  return migrateVersionSeven(versionSevenSnapshotSchema.parse({
    ...snapshot, schemaVersion: 7, unlockRequests: [],
    tasks: snapshot.tasks.map((legacyTask) => {
      const { evaluatorWeights, ...task } = legacyTask
      void evaluatorWeights
      return task
    }),
    assignments: assignments.map((assignment) => {
      const task = snapshot.tasks.find((entry) => entry.id === assignment.taskId)
      return {
        ...assignment,
        weight: task?.evaluatorWeights.find(
          (entry) => entry.evaluatorId === assignment.evaluatorId,
        )?.weight ?? 1,
      }
    }),
    scoreSheets: snapshot.scoreSheets.filter((sheet) => assignmentIds.has(sheet.assignmentId)),
  }))
}

function migrateVersionSeven(snapshot: VersionSevenSnapshot): Snapshot {
  return snapshotSchema.parse({
    ...snapshot,
    schemaVersion: 8,
    derivedScoreRules: [],
    evaluationBenchmarks: [],
  })
}

export const storedSnapshotSchema = z.union([
  snapshotSchema,
  versionSevenSnapshotSchema,
  versionSixSnapshotSchema,
  versionFiveSnapshotSchema,
]).transform((snapshot): Snapshot => {
  if (snapshot.schemaVersion === 8) return snapshot
  if (snapshot.schemaVersion === 7) return migrateVersionSeven(snapshot)
  const normalized = snapshot.schemaVersion === 6 ? snapshot : versionSixSnapshotSchema.parse({
    ...snapshot,
    schemaVersion: 6,
    engineers: snapshot.engineers.map((entry) => ({
      ...entry, division: "1부문", department: defaultDepartment(entry.team),
    })),
    evaluators: snapshot.evaluators.map((entry) => ({
      ...entry, division: "1부문", department: defaultDepartment(entry.team),
    })),
  })
  return migrateVersionSix(normalized)
})
