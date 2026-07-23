import type { EvaluationSnapshot, ScoreEntry } from "@/domain"
import type { RemoteEvaluationCommand } from "@/backend/evaluation-backend"
import type {
  CreateScheduleEventInput,
  CreateScheduleEventsInput,
  EvaluationRepository,
  NewEngineerInput,
  NewEvaluationCycleInput,
  NewEvaluatorInput,
  RepositoryActor,
  SaveCertificationRecordInput,
  SaveLanguageScoreRecordInput,
  SaveScoreAdjustmentInput,
  SaveDirectScoreRuleInput,
  SaveDerivedScoreRuleInput,
  SaveEvaluationTaskInput,
  SetEvaluationCycleLockInput,
  SourceRecordKind,
  UpdateScheduleEventInput,
  UpdateEvaluationCycleInput,
} from "@/repository"

export type RepositoryMutation = (repository: EvaluationRepository) => EvaluationSnapshot
export type MutateRepository = (
  mutation: RepositoryMutation, successMessage?: string, remoteCommand?: RemoteEvaluationCommand,
) => boolean

export type EvaluationActions = Readonly<{
  saveDraft: (
    sheetId: string,
    scores: ReadonlyArray<ScoreEntry>,
    passResult: boolean | null,
  ) => boolean
  submitSheet: (sheetId: string) => boolean
  requestSheetUnlock: (sheetId: string, reason: string) => boolean
  reopenSheet: (sheetId: string, reason: string) => boolean
  updateDirectScore: (
    engineerId: string,
    taskId: string,
    score: number | null,
    passResult: boolean | null,
  ) => boolean
  saveScoreAdjustment: (
    input: Omit<SaveScoreAdjustmentInput, "cycleId" | "actor">,
  ) => boolean
  deleteScoreAdjustment: (adjustmentId: string) => boolean
  saveLanguageScoreRecord: (
    input: Omit<SaveLanguageScoreRecordInput, "cycleId" | "actor">,
  ) => boolean
  deleteLanguageScoreRecord: (recordId: string) => boolean
  saveCertificationRecord: (
    input: Omit<SaveCertificationRecordInput, "cycleId" | "actor">,
  ) => boolean
  deleteCertificationRecord: (recordId: string) => boolean
  verifySourceRecord: (recordId: string, recordKind: SourceRecordKind) => boolean
  createEvaluationCycle: (input: NewEvaluationCycleInput) => boolean
  updateEvaluationCycle: (
    input: Omit<UpdateEvaluationCycleInput, "cycleId" | "actor">,
  ) => boolean
  setEvaluationCycleLock: (locked: boolean) => boolean
  deleteEvaluationCycle: (cycleId: string) => boolean
  saveDirectScoreRule: (input: Omit<SaveDirectScoreRuleInput, "cycleId" | "actor" | "ruleId"> & Readonly<{ ruleId: string | null }>) => boolean
  deleteDirectScoreRule: (ruleId: string) => boolean
  saveDerivedScoreRule: (input: Omit<SaveDerivedScoreRuleInput, "cycleId" | "actor">) => boolean
  deleteDerivedScoreRule: (ruleId: string) => boolean
  saveEvaluationTask: (
    input: Omit<SaveEvaluationTaskInput, "cycleId" | "actor">,
  ) => boolean
  deleteEvaluationTask: (taskId: string) => boolean
  updateEvaluatorAssignments: (
    engineerId: string,
    taskId: string,
    evaluatorWeights: ReadonlyArray<Readonly<{ evaluatorId: string; weight: number }>>,
  ) => boolean
  updateEvaluatorPreset: (
    evaluatorWeights: ReadonlyArray<Readonly<{ evaluatorId: string; weight: number }>>,
  ) => boolean
  updateEngineerTaskWeights: (
    engineerId: string,
    weights: ReadonlyArray<Readonly<{ taskId: string; weight: number }>>,
    useSeasonDefaults?: boolean,
  ) => boolean
  addEngineers: (engineers: ReadonlyArray<NewEngineerInput>) => boolean
  updateEngineer: (engineerId: string, engineer: NewEngineerInput) => boolean
  deleteEngineer: (engineerId: string) => boolean
  addEvaluators: (evaluators: ReadonlyArray<NewEvaluatorInput>) => boolean
  updateEvaluator: (evaluatorId: string, evaluator: NewEvaluatorInput) => boolean
  deleteEvaluator: (evaluatorId: string) => boolean
  createScheduleEvent: (
    input: Omit<CreateScheduleEventInput, "cycleId" | "actor">,
  ) => boolean
  createScheduleEvents: (
    input: Omit<CreateScheduleEventsInput, "cycleId" | "actor">,
  ) => boolean
  updateScheduleEvent: (
    eventId: string,
    input: Omit<UpdateScheduleEventInput, "eventId" | "actor">,
  ) => boolean
  deleteScheduleEvent: (eventId: string) => boolean
  resetDemoData: () => boolean
}>

type EvaluationActionDependencies = Readonly<{
  activeCycleId: string
  snapshot: EvaluationSnapshot | null
  actor: RepositoryActor
  mutate: MutateRepository
  selectCycle: (cycleId: string) => void
}>

export function createEvaluationActions({
  activeCycleId,
  snapshot,
  actor,
  mutate,
  selectCycle,
}: EvaluationActionDependencies): EvaluationActions {
  return {
    saveDraft: (sheetId, scores, passResult) =>
      mutate(
        (repository) => repository.saveDraft({ sheetId, scores, passResult, actor }),
        undefined,
        { type: "sheet", operation: "save_draft", sheetId },
      ),
    submitSheet: (sheetId) =>
      mutate(
        (repository) => repository.submitSheet({ sheetId, actor }),
        actor.role === "operator" ? "평가표를 저장했습니다." : "평가표를 제출하고 잠갔습니다.",
        { type: "sheet", operation: "submit_sheet", sheetId },
      ),
    requestSheetUnlock: (sheetId, reason) =>
      mutate(
        (repository) => repository.requestSheetUnlock({ sheetId, reason, actor }),
        "잠금 해제 요청을 보냈습니다.",
        { type: "unlock_request", sheetId, reason },
      ),
    reopenSheet: (sheetId, reason) =>
      mutate(
        (repository) => repository.reopenSheet({ sheetId, actor, reason }),
        "평가표를 재오픈하고 감사 이력을 남겼습니다.",
        { type: "operator", action: "sheet_reopened", targetId: sheetId },
      ),
    updateDirectScore: (engineerId, taskId, score, passResult) =>
      mutate(
        (repository) => repository.updateDirectScore({
          cycleId: activeCycleId, engineerId, taskId, score, passResult, actor,
        }),
        undefined,
        { type: "operator", action: "direct_score_updated", targetId: `${engineerId}:${taskId}` },
      ),
    saveScoreAdjustment: (input) =>
      mutate(
        (repository) => repository.saveScoreAdjustment({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "개인 총점 가·감점을 저장했습니다.",
        {
          type: "score_adjustment_save",
          adjustment: { ...input, cycleId: activeCycleId },
        },
      ),
    deleteScoreAdjustment: (adjustmentId) =>
      mutate(
        (repository) => repository.deleteScoreAdjustment({ adjustmentId, actor }),
        "개인 총점 가·감점을 삭제했습니다.",
        { type: "score_adjustment_delete", adjustmentId },
      ),
    saveLanguageScoreRecord: (input) =>
      mutate(
        (repository) => repository.saveLanguageScoreRecord({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "어학 성적을 저장했습니다.",
        actor.role === "engineer"
          ? { type: "language_save", record: { ...input, cycleId: activeCycleId } }
          : { type: "operator", action: "language_record_saved", targetId: input.recordId },
      ),
    deleteLanguageScoreRecord: (recordId) =>
      mutate(
        (repository) => repository.deleteLanguageScoreRecord({ recordId, actor }),
        "어학 성적을 삭제했습니다.",
        actor.role === "engineer"
          ? { type: "language_delete", recordId }
          : { type: "operator", action: "language_record_deleted", targetId: recordId },
      ),
    saveCertificationRecord: (input) =>
      mutate(
        (repository) => repository.saveCertificationRecord({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "자격증 정보를 저장했습니다.",
        actor.role === "engineer"
          ? { type: "certification_save", record: { ...input, cycleId: activeCycleId } }
          : { type: "operator", action: "certification_record_saved", targetId: input.recordId },
      ),
    deleteCertificationRecord: (recordId) =>
      mutate(
        (repository) => repository.deleteCertificationRecord({ recordId, actor }),
        "자격증 정보를 삭제했습니다.",
        actor.role === "engineer"
          ? { type: "certification_delete", recordId }
          : { type: "operator", action: "certification_record_deleted", targetId: recordId },
      ),
    verifySourceRecord: (recordId, recordKind) =>
      mutate(
        (repository) => repository.verifySourceRecord({ recordId, recordKind, actor }),
        "원천 실적 검토를 완료했습니다.",
        { type: "operator", action: "source_record_verified", targetId: recordId },
      ),
    createEvaluationCycle: (input) => {
      let createdCycleId: string | null = null
      const saved = mutate(
        (repository) => {
          const snapshot = repository.createEvaluationCycle({
            ...input,
            sourceCycleId: activeCycleId,
            actor,
          })
          createdCycleId = snapshot.cycles.at(-1)?.id ?? null
          return snapshot
        },
        "새 평가 시즌을 만들었습니다.",
        { type: "operator", action: "cycle_created", targetId: null },
      )
      if (saved && createdCycleId !== null) selectCycle(createdCycleId)
      return saved
    },
    updateEvaluationCycle: (input) =>
      mutate(
        (repository) => repository.updateEvaluationCycle({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "평가 시즌 설정을 저장했습니다.",
        { type: "operator", action: "cycle_updated", targetId: activeCycleId },
      ),
    setEvaluationCycleLock: (locked) =>
      mutate(
        (repository) => repository.setEvaluationCycleLock({
          cycleId: activeCycleId,
          locked,
          actor,
        } satisfies SetEvaluationCycleLockInput),
        locked ? "평가 시즌을 잠갔습니다." : "평가 시즌 잠금을 해제했습니다.",
        {
          type: "operator",
          action: locked ? "cycle_locked" : "cycle_unlocked",
          targetId: activeCycleId,
        },
      ),
    deleteEvaluationCycle: (cycleId) => {
      const saved = mutate(
        (repository) => repository.deleteEvaluationCycle({ cycleId, actor }),
        "평가 시즌을 삭제했습니다.",
        { type: "operator", action: "cycle_deleted", targetId: cycleId },
      )
      if (saved && cycleId === activeCycleId) {
        const nextCycle = snapshot?.cycles.find((cycle) => cycle.id !== cycleId)?.id
        if (nextCycle !== undefined) selectCycle(nextCycle)
      }
      return saved
    },
    saveDirectScoreRule: (input) =>
      mutate(
        (repository) => repository.saveDirectScoreRule({ ...input, cycleId: activeCycleId, actor }),
        "환산 규칙을 저장했습니다.",
        { type: "operator", action: "direct_score_rule_saved", targetId: input.ruleId },
      ),
    deleteDirectScoreRule: (ruleId) =>
      mutate(
        (repository) => repository.deleteDirectScoreRule({ ruleId, actor }),
        "환산 규칙을 삭제했습니다.",
        { type: "operator", action: "direct_score_rule_deleted", targetId: ruleId },
      ),
    saveDerivedScoreRule: (input) =>
      mutate(
        (repository) => repository.saveDerivedScoreRule({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "연계 점수 규칙을 저장했습니다.",
        { type: "operator", action: "derived_score_rule_saved", targetId: input.ruleId },
      ),
    deleteDerivedScoreRule: (ruleId) =>
      mutate(
        (repository) => repository.deleteDerivedScoreRule({ ruleId, actor }),
        "연계 점수 규칙을 삭제했습니다.",
        { type: "operator", action: "derived_score_rule_deleted", targetId: ruleId },
      ),
    saveEvaluationTask: (input) =>
      mutate(
        (repository) => repository.saveEvaluationTask({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        input.taskId === null ? "새 과제를 추가했습니다." : "과제 설정을 저장했습니다.",
        { type: "operator", action: "task_saved", targetId: input.taskId },
      ),
    deleteEvaluationTask: (taskId) =>
      mutate(
        (repository) => repository.deleteEvaluationTask({ taskId, actor }),
        "과제를 삭제했습니다.",
        { type: "operator", action: "task_deleted", targetId: taskId },
      ),
    updateEvaluatorAssignments: (engineerId, taskId, evaluatorWeights) =>
      mutate(
        (repository) => repository.updateEvaluatorAssignments({
          cycleId: activeCycleId,
          engineerId,
          taskId,
          evaluatorWeights,
          actor,
        }),
        "엔지니어별 평가자 배정을 저장했습니다.",
        { type: "operator", action: "evaluator_assignments_updated", targetId: `${engineerId}:${taskId}` },
      ),
    updateEvaluatorPreset: (evaluatorWeights) =>
      mutate(
        (repository) => repository.updateEvaluatorPreset({
          cycleId: activeCycleId,
          evaluatorWeights,
          actor,
        }),
        "고정 평가자 멤버를 저장했습니다.",
        { type: "operator", action: "evaluator_preset_updated", targetId: activeCycleId },
      ),
    updateEngineerTaskWeights: (engineerId, weights, useSeasonDefaults = false) =>
      mutate(
        (repository) => repository.updateEngineerTaskWeights({
          cycleId: activeCycleId,
          engineerId,
          weights,
          useSeasonDefaults,
          actor,
        }),
        "개인별 과제 가중치를 저장했습니다.",
        { type: "operator", action: "engineer_task_weights_updated", targetId: engineerId },
      ),
    addEngineers: (engineers) =>
      mutate(
        (repository) => repository.addEngineers({
          cycleId: activeCycleId,
          engineers,
          actor,
        }),
        `${engineers.length}명의 엔지니어를 등록했습니다.`,
        { type: "operator", action: "engineer_added", targetId: null },
      ),
    updateEngineer: (engineerId, engineer) =>
      mutate(
        (repository) => repository.updateEngineer({
          ...engineer,
          cycleId: activeCycleId,
          engineerId,
          actor,
        }),
        "엔지니어 정보를 수정했습니다.",
        { type: "operator", action: "engineer_updated", targetId: engineerId },
      ),
    deleteEngineer: (engineerId) =>
      mutate(
        (repository) => repository.deleteEngineer({
          cycleId: activeCycleId,
          engineerId,
          actor,
        }),
        "엔지니어를 삭제했습니다.",
        { type: "operator", action: "engineer_deleted", targetId: engineerId },
      ),
    addEvaluators: (evaluators) =>
      mutate(
        (repository) => repository.addEvaluators({
          cycleId: activeCycleId,
          evaluators,
          actor,
        }),
        `${evaluators.length}명의 평가자를 등록했습니다.`,
        { type: "operator", action: "evaluator_added", targetId: null },
      ),
    updateEvaluator: (evaluatorId, evaluator) =>
      mutate(
        (repository) => repository.updateEvaluator({
          ...evaluator,
          cycleId: activeCycleId,
          evaluatorId,
          actor,
        }),
        "평가자 정보를 수정했습니다.",
        { type: "operator", action: "evaluator_updated", targetId: evaluatorId },
      ),
    deleteEvaluator: (evaluatorId) =>
      mutate(
        (repository) => repository.deleteEvaluator({
          cycleId: activeCycleId,
          evaluatorId,
          actor,
        }),
        "평가자를 삭제했습니다.",
        { type: "operator", action: "evaluator_deleted", targetId: evaluatorId },
      ),
    createScheduleEvent: (input) =>
      mutate(
        (repository) => repository.createScheduleEvent({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "평가 일정을 등록했습니다.",
        {
          type: "schedule_create",
          cycleId: activeCycleId,
          engineerIds: [input.engineerId],
          parallel: false,
          fields: {
            taskId: input.taskId, title: input.title, date: input.date,
            startTime: input.startTime, note: input.note,
          },
        },
      ),
    createScheduleEvents: (input) =>
      mutate(
        (repository) => repository.createScheduleEvents({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        `${input.engineerIds.length}명의 평가 일정을 등록했습니다.`,
        {
          type: "schedule_create",
          cycleId: activeCycleId,
          engineerIds: input.engineerIds,
          parallel: input.parallel,
          fields: {
            taskId: input.taskId, title: input.title, date: input.date,
            startTime: input.startTime, note: input.note,
          },
        },
      ),
    updateScheduleEvent: (eventId, input) =>
      mutate(
        (repository) => repository.updateScheduleEvent({ ...input, eventId, actor }),
        "평가 일정을 수정했습니다.",
        {
          type: "schedule_update", eventId, engineerId: input.engineerId,
          fields: {
            taskId: input.taskId, title: input.title, date: input.date,
            startTime: input.startTime, note: input.note,
          },
        },
      ),
    deleteScheduleEvent: (eventId) =>
      mutate(
        (repository) => repository.deleteScheduleEvent({ eventId, actor }),
        "평가 일정을 삭제했습니다.",
        { type: "schedule_delete", eventId },
      ),
    resetDemoData: () =>
      mutate(
        (repository) => repository.resetDemoData(),
        "샘플 데이터를 초기 상태로 복원했습니다.",
        { type: "operator", action: "demo_reset", targetId: null },
      ),
  }
}
