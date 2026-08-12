import type {
  EvaluationMethod,
  EvaluationSnapshot,
  EvaluationTask,
} from "@/domain"

export type SeasonProcessStep = Readonly<{
  title: string
  description: string
}>

export type SeasonTaskGuide = Readonly<{
  id: string
  name: string
  description: string
  weight: number
  methodLabel: string
  purpose: string
  output: string
  capability: string
  process: ReadonlyArray<SeasonProcessStep>
  focusItems: ReadonlyArray<string>
}>

export type SeasonCompositionItem = Readonly<{
  id: string
  label: string
  weight: number
  kind: "single" | "alternative"
  options: ReadonlyArray<string>
}>

export type SeasonOverviewModel = Readonly<{
  cycle: EvaluationSnapshot["cycles"][number]
  tasks: ReadonlyArray<SeasonTaskGuide>
  educationTasks: ReadonlyArray<SeasonTaskGuide>
  composition: ReadonlyArray<SeasonCompositionItem>
  configuredWeightTotal: number
  effectiveWeightTotal: number
}>

const METHOD_LABELS: Readonly<Record<EvaluationMethod, string>> = {
  evaluator_score: "평가자 점수 입력",
  evaluator_pass_fail: "평가자 P/F 입력",
  operator_score: "운영자 점수 입력",
  operator_pass_fail: "운영자 P/F 입력",
  derived_score: "연계 점수 자동 산정",
}

const KNOWN_GUIDES = {
  growth: {
    purpose: "한 해 동안 집중할 성장 주제를 스스로 정하고, 배운 내용을 업무에 적용해 변화와 성과를 확인합니다.",
    output: "서론·본론·결론이 갖춰진 성장·탐구 보고서와 발표 자료",
    capability: "목표 설정 · 기술 탐구 · 문제 해결 · 논리적 발표",
    process: [
      { title: "주제와 목표 정하기", description: "선정 배경과 업무 연계 목표를 정리하고 리더와 방향을 맞춥니다." },
      { title: "탐구하고 적용하기", description: "배운 내용을 업무에 적용하고, 시행착오와 해결 과정을 기록합니다." },
      { title: "결과 발표하고 보완하기", description: "성과와 배운 점을 발표하고, 피드백을 다음 계획에 반영합니다." },
    ],
  },
  ots: {
    purpose: "실제 공정에서 일어날 수 있는 운전 상황을 OTS로 구현하고, 원인 분석과 대응 절차를 익힙니다.",
    output: "다른 사람이 그대로 실행할 수 있는 OTS 시나리오 기획서와 발표 자료",
    capability: "공정 이해 · 제어 논리 · 문제 대응 · 질의응답",
    process: [
      { title: "상황과 변수 정하기", description: "공정, 시나리오 유형과 핵심 변수를 정하고 멘토와 타당성을 검토합니다." },
      { title: "구현하고 검증하기", description: "OTS에 조건을 구현하고 반복 운전해 대응 절차를 확인합니다." },
      { title: "실행 절차 정리하기", description: "다른 사람도 재현할 수 있도록 화면, 조작 순서와 판단 근거를 정리합니다." },
      { title: "발표하고 질의에 답하기", description: "공정 제어 논리를 설명하고 데이터에 근거해 질문에 답합니다." },
    ],
  },
  dx: {
    purpose: "디지털 도구와 데이터를 활용해 업무의 비효율이나 잠재 위험을 줄이고, 개선 효과를 확인합니다.",
    output: "다시 사용할 수 있는 도구 또는 분석 결과와 효과 검증 자료",
    capability: "문제 정의 · 데이터 활용 · 구현 · 업무 확산",
    process: [
      { title: "문제 정하기", description: "현장의 손실과 불편을 구체화하고 해결 목표를 정합니다." },
      { title: "도구와 데이터 설계하기", description: "문제에 맞는 디지털 도구를 고르고 데이터 흐름을 설계합니다." },
      { title: "구현하고 효과 확인하기", description: "결과물을 만들고 실제 업무에서 효과와 한계를 확인합니다." },
      { title: "공유하고 확산하기", description: "성과를 발표하고 다른 공정에서도 쓸 수 있게 사용 방법을 정리합니다." },
    ],
  },
  language: {
    purpose: "업무에 필요한 말하기 역량을 공인 성적으로 확인하고, 이전 평가보다 향상된 정도를 함께 반영합니다.",
    output: "현재 시즌에 인정되는 어학 기록과 환산 점수",
    capability: "업무 소통 · 자기 개발 · 글로벌 협업",
    process: [
      { title: "성적 등록하기", description: "시험 종류, 등급 또는 점수와 취득 연월을 입력합니다." },
      { title: "점수 환산하기", description: "현재 시즌의 평가표와 가산점 기준으로 점수를 계산합니다." },
      { title: "평가에 반영하기", description: "확정된 환산점수를 개인별 반영 비율에 따라 합산합니다." },
    ],
  },
  certification: {
    purpose: "직무와 관련된 전문 지식과 꾸준한 학습 성과를 자격 취득 기록으로 확인합니다.",
    output: "보유 자격, 취득 연월, 기본점수와 가산점이 반영된 환산 결과",
    capability: "전문 지식 · 직무 확장 · 지속 학습",
    process: [
      { title: "자격 등록하기", description: "평가표에 있는 자격과 취득 연월을 입력합니다." },
      { title: "반영 자격 정하기", description: "기본점수가 높은 자격과 신규 취득 가산점을 계산합니다." },
      { title: "평가에 반영하기", description: "확정된 환산점수를 개인별 반영 비율에 따라 합산합니다." },
    ],
  },
  proposal: {
    purpose: "현장의 불합리와 잠재 위험을 직접 찾아 개선안을 제안하고, 실제 업무 개선으로 이어지게 합니다.",
    output: "고등급으로 인정된 제안 실적과 발표 자료",
    capability: "문제 발견 · 개선 실행 · 업무 기여",
    process: [
      { title: "문제 찾기", description: "현장의 불합리와 잠재 위험을 구체적으로 정리합니다." },
      { title: "개선안 제안하고 실행하기", description: "개선안을 실행해 효과와 적용 가능성을 확인합니다." },
      { title: "평가에 반영하기", description: "고등급 판정과 발표 가산점을 시즌 기준에 따라 반영합니다." },
    ],
  },
  education: {
    purpose: "교육 담당자가 OTS 시나리오 제작 과정을 운영하고, 반복해서 활용할 수 있는 교육 자료를 정리합니다.",
    output: "OTS 시나리오 제작 안내와 교육 운영 결과",
    capability: "교육 설계 · 공정 지식 전달 · 수행 점검 · 피드백",
    process: [
      { title: "교육 목표 정하기", description: "교육 대상과 범위, 완료 기준을 정합니다." },
      { title: "제작 과정 지원하기", description: "시나리오 설계와 제작 과정을 안내하고 진행 상황을 점검합니다." },
      { title: "결과 검토하기", description: "완성된 시나리오와 수행 결과를 기준에 따라 확인합니다." },
      { title: "교육 자료 정리하기", description: "다음 교육에도 사용할 수 있도록 안내와 결과를 정리합니다." },
    ],
  },
} as const

function isEducationOnlyTask(task: EvaluationTask): boolean {
  const name = task.name.toLocaleLowerCase("ko")
  return name.includes("ots") && name.includes("교육")
}

function classifyTask(task: EvaluationTask): keyof typeof KNOWN_GUIDES | null {
  const name = task.name.toLocaleLowerCase("ko")
  if (isEducationOnlyTask(task)) return "education"
  if (name.includes("성장") || name.includes("탐구")) return "growth"
  if (name.includes("ots")) return "ots"
  if (name.includes("dx")) return "dx"
  if (name.includes("어학") || name.includes("언어")) return "language"
  if (name.includes("자격")) return "certification"
  if (name.includes("제안")) return "proposal"
  return null
}

function genericProcess(method: EvaluationMethod): ReadonlyArray<SeasonProcessStep> {
  if (method === "derived_score") return [
    { title: "연계 대상 확정", description: "점수를 받을 대상과 원천 평가 결과를 연결합니다." },
    { title: "원천 결과 취합", description: "연결된 인원의 확정 결과를 동일 기준으로 취합합니다." },
    { title: "파생 점수 반영", description: "설정한 집계 방식으로 계산해 시즌 결과에 반영합니다." },
  ]
  if (method === "operator_score" || method === "operator_pass_fail") return [
    { title: "실적 확인", description: "과제 완료 근거와 현재 시즌 적용 대상을 확인합니다." },
    { title: "결과 입력", description: "운영자가 설정된 점수 또는 P/F 기준으로 결과를 기록합니다." },
    { title: "시즌 반영", description: "확정된 결과를 개인별 가중치에 따라 반영합니다." },
  ]
  return [
    { title: "과제 준비", description: "과제 목적과 평가 기준에 맞춰 수행 범위를 정합니다." },
    { title: "수행·정리", description: "과정을 기록하고 결과와 근거를 평가 가능한 형태로 정리합니다." },
    { title: "발표·평가", description: "동일 기준으로 평가받고 피드백을 다음 실행에 반영합니다." },
  ]
}

function toTaskGuide(task: EvaluationTask): SeasonTaskGuide {
  const known = classifyTask(task)
  const guide = known === null ? null : KNOWN_GUIDES[known]
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    weight: task.weight,
    methodLabel: METHOD_LABELS[task.method],
    purpose: guide?.purpose ?? task.description,
    output: guide?.output ?? "과제 목적과 완료 기준을 충족한 결과물",
    capability: guide?.capability ?? "과제 수행 · 근거 정리 · 결과 공유",
    process: guide?.process ?? genericProcess(task.method),
    focusItems: task.items.length > 0
      ? task.items.slice(0, 3).map((item) => item.label)
      : ["과제 목적과 완료 기준"],
  }
}

function buildComposition(tasks: ReadonlyArray<EvaluationTask>): ReadonlyArray<SeasonCompositionItem> {
  const ots = tasks.find((task) => classifyTask(task) === "ots")
  const dx = tasks.find((task) => classifyTask(task) === "dx")
  const alternativeIds = ots !== undefined && dx !== undefined ? new Set([ots.id, dx.id]) : null
  const items: SeasonCompositionItem[] = []

  for (const task of tasks) {
    if (alternativeIds?.has(task.id)) {
      if (task.id === ots?.id) items.push({
        id: "advanced-track",
        label: "선택 과제",
        weight: Math.max(ots.weight, dx?.weight ?? 0),
        kind: "alternative",
        options: [ots.name, dx?.name ?? ""].filter(Boolean),
      })
      continue
    }
    const known = classifyTask(task)
    items.push({
      id: task.id,
      label: known === "growth"
        ? "성장·탐구 계획서"
        : known === "proposal"
          ? "고등급 제안"
          : task.name,
      weight: task.weight,
      kind: "single",
      options: [],
    })
  }
  return items
}

export function selectSeasonOverview(
  snapshot: EvaluationSnapshot,
  cycleId: string,
): SeasonOverviewModel | null {
  const cycle = snapshot.cycles.find((entry) => entry.id === cycleId)
  if (cycle === undefined) return null
  const seasonTasks = snapshot.tasks
    .filter((task) => task.cycleId === cycleId)
    .toSorted((left, right) => left.order - right.order)
  const educationTasks = seasonTasks.filter(isEducationOnlyTask)
  const evaluationTasks = seasonTasks.filter((task) => !isEducationOnlyTask(task))
  const composition = buildComposition(evaluationTasks)
  return {
    cycle,
    tasks: evaluationTasks.map(toTaskGuide),
    educationTasks: educationTasks.map(toTaskGuide),
    composition,
    configuredWeightTotal: evaluationTasks.reduce((sum, task) => sum + task.weight, 0),
    effectiveWeightTotal: composition.reduce((sum, item) => sum + item.weight, 0),
  }
}
