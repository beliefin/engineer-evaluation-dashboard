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
    purpose: "연간 성장 주제의 자율 설정, 학습 내용의 업무 적용, 변화와 성과 확인",
    output: "서론·본론·결론이 갖춰진 성장·탐구 보고서와 발표 자료",
    capability: "목표 설정 · 기술 탐구 · 문제 해결 · 논리적 발표",
    process: [
      { title: "주제와 목표 정하기", description: "선정 배경·업무 연계 목표 정리와 리더 협의" },
      { title: "탐구하고 적용하기", description: "학습 내용의 업무 적용과 시행착오·해결 과정 기록" },
      { title: "결과 발표하고 보완하기", description: "성과·학습 내용 발표와 피드백의 후속 계획 반영" },
    ],
  },
  ots: {
    purpose: "실제 공정 운전 상황의 OTS 구현과 원인 분석·대응 절차 숙달",
    output: "다른 사람이 그대로 실행할 수 있는 OTS 시나리오 기획서와 발표 자료",
    capability: "공정 이해 · 제어 논리 · 문제 대응 · 질의응답",
    process: [
      { title: "상황과 변수 정하기", description: "공정·시나리오 유형·핵심 변수 설정과 멘토 타당성 검토" },
      { title: "구현하고 검증하기", description: "OTS 조건 구현과 반복 운전을 통한 대응 절차 검증" },
      { title: "실행 절차 정리하기", description: "재현 가능한 화면·조작 순서·판단 근거 정리" },
      { title: "발표하고 질의에 답하기", description: "공정 제어 논리 설명과 데이터 기반 질의응답" },
    ],
  },
  dx: {
    purpose: "디지털 도구와 데이터를 활용한 업무 비효율·잠재 위험 개선과 효과 검증",
    output: "다시 사용할 수 있는 도구 또는 분석 결과와 효과 검증 자료",
    capability: "문제 정의 · 데이터 활용 · 구현 · 업무 확산",
    process: [
      { title: "문제 정하기", description: "현장 손실·불편 구체화와 해결 목표 설정" },
      { title: "도구와 데이터 설계하기", description: "문제에 맞는 디지털 도구 선정과 데이터 흐름 설계" },
      { title: "구현하고 효과 확인하기", description: "결과물 구현과 실제 업무 효과·한계 검증" },
      { title: "공유하고 확산하기", description: "성과 발표와 타 공정 활용을 위한 사용 방법 정리" },
    ],
  },
  language: {
    purpose: "공인 성적을 통한 업무 말하기 역량 확인과 이전 평가 대비 향상도 반영",
    output: "현재 시즌에 인정되는 어학 기록과 환산 점수",
    capability: "업무 소통 · 자기 개발 · 글로벌 협업",
    process: [
      { title: "성적 등록하기", description: "시험 종류·등급 또는 점수·취득 연월 입력" },
      { title: "점수 환산하기", description: "현재 시즌 평가표와 가산점 기준 적용" },
      { title: "평가에 반영하기", description: "확정 환산점수의 개인별 반영 비율 적용" },
    ],
  },
  certification: {
    purpose: "자격 취득 기록을 통한 직무 전문 지식과 지속 학습 성과 확인",
    output: "보유 자격, 취득 연월, 기본점수와 가산점이 반영된 환산 결과",
    capability: "전문 지식 · 직무 확장 · 지속 학습",
    process: [
      { title: "자격 등록하기", description: "평가표 등록 자격과 취득 연월 입력" },
      { title: "반영 자격 정하기", description: "상위 기본점수 자격과 신규 취득 가산점 산정" },
      { title: "평가에 반영하기", description: "확정 환산점수의 개인별 반영 비율 적용" },
    ],
  },
  proposal: {
    purpose: "현장 불합리·잠재 위험 직접 발굴과 개선안 제안·실행을 통한 실무 개선",
    output: "고등급으로 인정된 제안 실적과 발표 자료",
    capability: "문제 발견 · 개선 실행 · 업무 기여",
    process: [
      { title: "문제 찾기", description: "현장 불합리와 잠재 위험의 구체적 정리" },
      { title: "개선안 제안하고 실행하기", description: "개선안 실행과 효과·적용 가능성 검증" },
      { title: "평가에 반영하기", description: "고등급 판정과 발표 가산점의 시즌 기준 적용" },
    ],
  },
  education: {
    purpose: "OTS 시나리오 제작 과정 운영과 반복 활용 가능한 교육 자료 구축",
    output: "OTS 시나리오 제작 안내와 교육 운영 결과",
    capability: "교육 설계 · 공정 지식 전달 · 수행 점검 · 피드백",
    process: [
      { title: "교육 목표 정하기", description: "교육 대상·범위·완료 기준 설정" },
      { title: "제작 과정 지원하기", description: "시나리오 설계·제작 안내와 진행 상황 점검" },
      { title: "결과 검토하기", description: "완성 시나리오와 수행 결과의 기준별 검토" },
      { title: "교육 자료 정리하기", description: "후속 교육용 안내와 결과 정리" },
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
    { title: "연계 대상 확정", description: "점수 반영 대상과 원천 평가 결과 연결" },
    { title: "원천 결과 취합", description: "연결 인원의 확정 결과를 동일 기준으로 취합" },
    { title: "파생 점수 반영", description: "설정 집계 방식에 따른 계산과 시즌 결과 반영" },
  ]
  if (method === "operator_score" || method === "operator_pass_fail") return [
    { title: "실적 확인", description: "과제 완료 근거와 현재 시즌 적용 대상 확인" },
    { title: "결과 입력", description: "설정 점수 또는 P/F 기준에 따른 운영자 기록" },
    { title: "시즌 반영", description: "확정 결과의 개인별 가중치 적용" },
  ]
  return [
    { title: "과제 준비", description: "과제 목적과 평가 기준에 맞춘 수행 범위 설정" },
    { title: "수행·정리", description: "수행 과정 기록과 평가 가능한 결과·근거 정리" },
    { title: "발표·평가", description: "동일 기준 평가와 피드백의 후속 실행 반영" },
  ]
}

function toTaskGuide(task: EvaluationTask): SeasonTaskGuide {
  const known = classifyTask(task)
  const guide = known === null ? null : KNOWN_GUIDES[known]
  const displayName = known === "growth"
    ? "성장·탐구 계획서"
    : known === "proposal"
      ? "고등급 제안"
      : known === "dx"
        ? "AX 전환"
        : task.name
  return {
    id: task.id,
    name: displayName,
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
        options: [ots.name, dx === undefined ? "" : "AX 전환"].filter(Boolean),
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
          : known === "dx"
            ? "AX 전환"
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
