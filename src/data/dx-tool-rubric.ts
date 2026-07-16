export const DX_TOOL_RUBRIC = [
  {
    section: "기획",
    label: "주제 선정 및 문제 정의",
    criteria: [
      { score: 3, description: "단순히 툴 기능을 써보는 것이 목적인 과제이거나, 문제 배경 설명이 부족함." },
      { score: 5, description: "문제점은 인식했으나, 이것이 현장에 얼마나 큰 손실·불편을 주는지 구체성이 약함." },
      { score: 7, description: "현장의 불합리, 비효율, 잠재 위험 등을 구체적 사례를 들어 명확히 정의함." },
      { score: 9, description: "문제 해결 시 얻을 수 있는 기대 효과(Loss 절감 등)를 정량적으로 제시하여 필요성을 완벽히 설득함." },
    ],
  },
  {
    section: "기획",
    label: "해결 전략 및 도구 적합성",
    criteria: [
      { score: 3, description: "과제 성격에 맞지 않는 도구를 억지로 사용했거나, 기존 방식과 차별점이 없음." },
      { score: 5, description: "도구는 적절하나, 기존 업무 프로세스를 그대로 답습하여 개선 폭이 좁음." },
      { score: 7, description: "문제 특성(데이터 양, 반복성 등)에 최적화된 DX 도구를 선정하고 효율적인 접근법을 제시함." },
      { score: 9, description: "기존 프로세스의 불필요한 단계를 과감히 제거하고, 도구의 장점을 극대화하는 스마트한 전략을 세움." },
    ],
  },
  {
    section: "수행",
    label: "데이터 활용 및 근거 확보",
    criteria: [
      { score: 3, description: "분석에 사용된 데이터나 정보가 너무 적거나, 출처가 불분명하여 신뢰하기 어려움." },
      { score: 5, description: "데이터나 정보를 수집했으나 단순 나열이나 기초 통계 수준에 그쳐 깊이가 부족함." },
      { score: 7, description: "목적에 맞는 데이터와 정보를 충분히 확보하고, 분석 가능한 형태로 깔끔하게 가공(전처리)함." },
      { score: 9, description: "여러 데이터(공정+품질 등)를 연계 분석하거나 노이즈를 제거하여, 분석 결과의 신뢰도를 획기적으로 높임." },
    ],
  },
  {
    section: "수행",
    label: "구현 설계의 논리성 및 구체화",
    criteria: [
      { score: 3, description: "아이디어만 있고 구체적으로 어떻게 작동하는지(Input/Output) 설명이 모호함." },
      { score: 5, description: "설명은 했으나, 로직의 흐름이나 구조가 시각적으로 정리되지 않아 이해하기 힘듦." },
      { score: 7, description: "데이터 흐름도(Flowchart)나 로직 설계도를 통해 작동 원리를 논리적으로 시각화함." },
      { score: 9, description: "실제 개발 수준의 상세 화면 설계(Mock-up)나 프로토타입을 제시하여, 구현 가능성을 완벽히 입증함." },
    ],
  },
  {
    section: "수행",
    label: "문제 해결 과정의 깊이",
    criteria: [
      { score: 3, description: "단순히 툴을 돌려본 결과값만 제시하고, 중간 과정에 대한 고민이 없음." },
      { score: 5, description: "수행 과정은 나열했으나, 결과가 도출된 원인이나 이유에 대한 분석이 부족함." },
      { score: 7, description: "데이터 간 상관관계를 분석하거나, 여러 시도를 통해 최적의 해답을 찾아가는 과정이 보임." },
      { score: 9, description: "분석·설계 과정에서 마주친 난관을 집요하게 파고들어 해결했으며, 그 과정 자체가 타인에게 인사이트를 줌." },
    ],
  },
  {
    section: "결과",
    label: "결과물의 실질적 가치",
    criteria: [
      { score: 3, description: "무엇이 좋아졌는지 불분명하거나, 실무 적용이 어려워 보임." },
      { score: 5, description: "개선 효과는 있으나 미미하거나, 단순히 개인의 편의성 증진에 그침." },
      { score: 7, description: "공정의 숨겨진 원인을 규명했거나, 업무 효율·정확도를 높이는 등 유의미한 성과를 냄." },
      { score: 9, description: "새로운 관리 기준을 수립하거나, 만성적인 불합리를 해결하여 생산성·안전·품질 향상에 크게 기여함." },
    ],
  },
  {
    section: "결과",
    label: "결과물의 사용 편의성",
    criteria: [
      { score: 3, description: "결과물(분석표, 툴)이 복잡하여 만든 사람 외에는 이해하거나 쓰기 어려움." },
      { score: 5, description: "사용은 가능하나, 별도의 설명이 필요하거나 직관성이 다소 떨어짐." },
      { score: 7, description: "분석 결과나 툴의 UI가 깔끔하게 정리되어 있어 사용자가 내용을 파악하기 쉬움." },
      { score: 9, description: "누가 봐도 한눈에 핵심을 알 수 있는 시각화(대시보드 등)나, 클릭 최소화 등 사용자 경험(UX)이 훌륭함." },
    ],
  },
  {
    section: "결과",
    label: "확산 및 지속 가능성",
    criteria: [
      { score: 3, description: "일회성 이벤트로 보이며, 데이터가 바뀌면 다시 쓰기 어려움." },
      { score: 5, description: "지속 사용은 가능하나, 타 공정이나 타인이 쓰기엔 수정해야 할 부분이 많음." },
      { score: 7, description: "표준화된 양식이나 로직을 사용하여 팀 내 공유 및 즉시 활용이 가능함." },
      { score: 9, description: "범용성이 뛰어나 타 부서·공정으로 수평 전개(Roll-out) 시 파급 효과가 매우 클 것으로 기대됨." },
    ],
  },
  {
    section: "발표",
    label: "발표 구성 및 전달력",
    criteria: [
      { score: 3, description: "수행한 내용을 단순히 나열하기만 하여 지루하거나 요점이 흐릿함." },
      { score: 5, description: "설명은 무난하나, 기획-수행-결과의 연결 고리가 약해 설득력이 다소 떨어짐." },
      { score: 7, description: "논리적인 흐름으로 발표를 구성하여 청중이 과제의 내용을 쉽게 이해할 수 있음." },
      { score: 9, description: "자신감 있는 태도와 흡입력 있는 스토리텔링으로 과제의 중요성과 성과를 확실하게 각인시킴." },
    ],
  },
  {
    section: "발표",
    label: "발표 자료의 완성도",
    criteria: [
      { score: 3, description: "텍스트 위주이거나 자료의 해상도·가독성이 떨어져 내용을 알아보기 힘듦." },
      { score: 5, description: "자료 정리는 되었으나, 복잡한 로직이나 데이터를 쉽게 보여주는 시각적 요소가 부족함." },
      { score: 7, description: "핵심 데이터와 성과를 한눈에 들어오는 차트, 도식, 이미지로 적절히 표현함." },
      { score: 9, description: "시연 영상, 데모, 애니메이션 등을 적재적소에 활용하여 발표의 전달력과 몰입도를 극대화함." },
    ],
  },
] as const
