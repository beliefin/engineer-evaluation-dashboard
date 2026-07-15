import type { EvaluationSnapshot, ScoreEntry } from "@/domain"
import type {
  CreateScheduleEventInput,
  EvaluationRepository,
  NewEngineerInput,
  NewEvaluationCycleInput,
  NewEvaluatorInput,
  RepositoryActor,
  SaveCertificationRecordInput,
  SaveLanguageScoreRecordInput,
  SaveEvaluationTaskInput,
  SourceRecordKind,
  UpdateScheduleEventInput,
} from "@/repository"

export type RepositoryMutation = (
  repository: EvaluationRepository,
) => EvaluationSnapshot

export type MutateRepository = (
  mutation: RepositoryMutation,
  successMessage?: string,
) => boolean

export type EvaluationActions = Readonly<{
  saveDraft: (
    sheetId: string,
    scores: ReadonlyArray<ScoreEntry>,
    passResult: boolean | null,
  ) => boolean
  submitSheet: (sheetId: string) => boolean
  reopenSheet: (sheetId: string, reason: string) => boolean
  updateDirectScore: (
    engineerId: string,
    taskId: string,
    score: number | null,
    passResult: boolean | null,
  ) => boolean
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
  saveEvaluationTask: (
    input: Omit<SaveEvaluationTaskInput, "cycleId" | "actor">,
  ) => boolean
  deleteEvaluationTask: (taskId: string) => boolean
  updateEngineerTaskWeights: (
    engineerId: string,
    weights: ReadonlyArray<Readonly<{ taskId: string; weight: number }>>,
  ) => boolean
  addEngineers: (engineers: ReadonlyArray<NewEngineerInput>) => boolean
  addEvaluators: (evaluators: ReadonlyArray<NewEvaluatorInput>) => boolean
  createScheduleEvent: (
    input: Omit<CreateScheduleEventInput, "cycleId" | "actor">,
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
  actor: RepositoryActor
  mutate: MutateRepository
  selectCycle: (cycleId: string) => void
}>

export function createEvaluationActions({
  activeCycleId,
  actor,
  mutate,
  selectCycle,
}: EvaluationActionDependencies): EvaluationActions {
  return {
    saveDraft: (sheetId, scores, passResult) =>
      mutate((repository) => repository.saveDraft({ sheetId, scores, passResult, actor })),
    submitSheet: (sheetId) =>
      mutate(
        (repository) => repository.submitSheet({ sheetId, actor }),
        "평가표를 제출하고 잠갔습니다.",
      ),
    reopenSheet: (sheetId, reason) =>
      mutate(
        (repository) => repository.reopenSheet({ sheetId, actor, reason }),
        "평가표를 재오픈하고 감사 이력을 남겼습니다.",
      ),
    updateDirectScore: (engineerId, taskId, score, passResult) =>
      mutate((repository) => repository.updateDirectScore({
        cycleId: activeCycleId,
        engineerId,
        taskId,
        score,
        passResult,
        actor,
      })),
    saveLanguageScoreRecord: (input) =>
      mutate(
        (repository) => repository.saveLanguageScoreRecord({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "어학 성적을 저장했습니다.",
      ),
    deleteLanguageScoreRecord: (recordId) =>
      mutate(
        (repository) => repository.deleteLanguageScoreRecord({ recordId, actor }),
        "어학 성적을 삭제했습니다.",
      ),
    saveCertificationRecord: (input) =>
      mutate(
        (repository) => repository.saveCertificationRecord({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "자격증 정보를 저장했습니다.",
      ),
    deleteCertificationRecord: (recordId) =>
      mutate(
        (repository) => repository.deleteCertificationRecord({ recordId, actor }),
        "자격증 정보를 삭제했습니다.",
      ),
    verifySourceRecord: (recordId, recordKind) =>
      mutate(
        (repository) => repository.verifySourceRecord({ recordId, recordKind, actor }),
        "원천 실적 검토를 완료했습니다.",
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
      )
      if (saved && createdCycleId !== null) selectCycle(createdCycleId)
      return saved
    },
    saveEvaluationTask: (input) =>
      mutate(
        (repository) => repository.saveEvaluationTask({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        input.taskId === null ? "새 과제를 추가했습니다." : "과제 설정을 저장했습니다.",
      ),
    deleteEvaluationTask: (taskId) =>
      mutate(
        (repository) => repository.deleteEvaluationTask({ taskId, actor }),
        "과제를 삭제했습니다.",
      ),
    updateEngineerTaskWeights: (engineerId, weights) =>
      mutate(
        (repository) => repository.updateEngineerTaskWeights({
          cycleId: activeCycleId,
          engineerId,
          weights,
          actor,
        }),
        "개인별 과제 가중치를 저장했습니다.",
      ),
    addEngineers: (engineers) =>
      mutate(
        (repository) => repository.addEngineers({
          cycleId: activeCycleId,
          engineers,
          actor,
        }),
        `${engineers.length}명의 엔지니어를 등록했습니다.`,
      ),
    addEvaluators: (evaluators) =>
      mutate(
        (repository) => repository.addEvaluators({
          cycleId: activeCycleId,
          evaluators,
          actor,
        }),
        `${evaluators.length}명의 평가자를 등록했습니다.`,
      ),
    createScheduleEvent: (input) =>
      mutate(
        (repository) => repository.createScheduleEvent({
          ...input,
          cycleId: activeCycleId,
          actor,
        }),
        "평가 일정을 등록했습니다.",
      ),
    updateScheduleEvent: (eventId, input) =>
      mutate(
        (repository) => repository.updateScheduleEvent({ ...input, eventId, actor }),
        "평가 일정을 수정했습니다.",
      ),
    deleteScheduleEvent: (eventId) =>
      mutate(
        (repository) => repository.deleteScheduleEvent({ eventId, actor }),
        "평가 일정을 삭제했습니다.",
      ),
    resetDemoData: () =>
      mutate(
        (repository) => repository.resetDemoData(),
        "샘플 데이터를 초기 상태로 복원했습니다.",
      ),
  }
}
