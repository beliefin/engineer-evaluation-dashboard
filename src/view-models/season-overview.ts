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
  composition: ReadonlyArray<SeasonCompositionItem>
  configuredWeightTotal: number
  effectiveWeightTotal: number
}>

const METHOD_LABELS: Readonly<Record<EvaluationMethod, string>> = {
  evaluator_score: "평가자 점수형",
  evaluator_pass_fail: "평가자 P/F형",
  operator_score: "운영자 점수형",
  operator_pass_fail: "운영자 P/F형",
  derived_score: "연계·파생형",
}

const KNOWN_GUIDES = {
  growth: {
    purpose: "스스로 성장 주제를 정하고 연간 실행 과정을 기록해 자기주도 학습을 현업 성과로 연결합니다.",
    output: "서론·본론·결론을 갖춘 성장탐구 보고서와 발표 자료",
    capability: "목표 설정 · 기술 탐구 · 문제해결 · 논리적 발표",
    process: [
      { title: "목표 수립", description: "주제와 선정 배경, 업무 연계 목표를 리더와 합의합니다." },
      { title: "활동 수행", description: "학습과 적용, 시행착오를 기록하며 중간 방향을 점검합니다." },
      { title: "발표·평가", description: "성과와 통찰을 구조화해 발표하고 피드백을 다음 계획에 반영합니다." },
    ],
  },
  ots: {
    purpose: "실제 공정에서 발생할 운전 상황을 직접 설계하고 제어해 현장 대응 역량을 강화합니다.",
    output: "재현 가능한 OTS 시나리오 표준 기획서와 발표·질의응답",
    capability: "공정 이해 · 제어 논리 · 트러블슈팅 · 교차 질의 대응",
    process: [
      { title: "기획·멘토 검토", description: "공정과 시나리오 유형, 핵심 변수를 정하고 타당성을 검토합니다." },
      { title: "실행·검증", description: "OTS에서 조건을 구현하고 반복 운전해 대응 절차를 검증합니다." },
      { title: "표준화", description: "타인이 재현할 수 있도록 화면, 조작 순서와 판단 근거를 정리합니다." },
      { title: "발표·질의", description: "공정 제어 논리를 설명하고 데이터 기반 교차 질의에 답합니다." },
    ],
  },
  dx: {
    purpose: "디지털 도구와 데이터를 활용해 현장의 비효율이나 잠재 위험을 구체적인 개선 결과로 바꿉니다.",
    output: "재사용 가능한 개선 도구·분석 결과와 효과 검증 발표",
    capability: "문제 정의 · 데이터 활용 · 구현 설계 · 확산 가능성",
    process: [
      { title: "문제 정의", description: "현장 손실과 불편을 구체화하고 해결 목표를 정합니다." },
      { title: "도구 설계", description: "문제 특성에 맞는 DX 도구와 데이터 흐름을 설계합니다." },
      { title: "구현·검증", description: "결과물을 만들고 실제 업무 효과와 한계를 확인합니다." },
      { title: "공유·확산", description: "성과를 발표하고 다른 공정에서도 쓸 수 있도록 표준화합니다." },
    ],
  },
  language: {
    purpose: "엔지니어에게 필요한 실질적 의사소통 역량을 객관적인 성취 기록으로 확인합니다.",
    output: "현재 시즌에 유효한 어학 성취 기록과 환산 결과",
    capability: "업무 소통 · 자기개발 · 글로벌 협업 기반",
    process: [
      { title: "실적 등록", description: "시험 종류, 등급 또는 점수와 취득 연월을 입력합니다." },
      { title: "기준 환산", description: "현재 시즌 평가표와 가점 기준으로 점수를 계산합니다." },
      { title: "결과 반영", description: "확정된 환산점수를 개인별 가중치에 따라 반영합니다." },
    ],
  },
  certification: {
    purpose: "직무 연관 전문성과 지속적인 기술 학습을 자격 취득 기록으로 확인합니다.",
    output: "보유 자격, 취득 연월과 상위 자격 기준 환산 결과",
    capability: "전문지식 · 직무 확장 · 지속 학습",
    process: [
      { title: "자격 등록", description: "평가표에 정의된 자격과 취득 연월을 입력합니다." },
      { title: "우선순위 산정", description: "기본점수 상위 자격과 신규취득 가점을 계산합니다." },
      { title: "결과 반영", description: "확정된 환산점수를 개인별 가중치에 따라 반영합니다." },
    ],
  },
  proposal: {
    purpose: "불합리와 잠재 위험을 스스로 발견하고 개선하는 문제해결 행동을 강화합니다.",
    output: "고등급으로 판정된 개선 제안 실적과 발표 근거",
    capability: "문제 발견 · 개선 실행 · 현장 기여",
    process: [
      { title: "문제 발견", description: "현장의 불합리와 잠재 위험을 구체적으로 정의합니다." },
      { title: "제안·실행", description: "개선안을 제안하고 효과와 적용 가능성을 확인합니다." },
      { title: "평가 반영", description: "고등급 판정과 발표 가점을 시즌 기준에 따라 반영합니다." },
    ],
  },
} as const

function classifyTask(task: EvaluationTask): keyof typeof KNOWN_GUIDES | null {
  const name = task.name.toLocaleLowerCase("ko")
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
        label: "선택형 심화 과제",
        weight: Math.max(ots.weight, dx?.weight ?? 0),
        kind: "alternative",
        options: [ots.name, dx?.name ?? ""].filter(Boolean),
      })
      continue
    }
    items.push({
      id: task.id,
      label: task.name,
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
  const composition = buildComposition(seasonTasks)
  return {
    cycle,
    tasks: seasonTasks.map(toTaskGuide),
    composition,
    configuredWeightTotal: seasonTasks.reduce((sum, task) => sum + task.weight, 0),
    effectiveWeightTotal: composition.reduce((sum, item) => sum + item.weight, 0),
  }
}
