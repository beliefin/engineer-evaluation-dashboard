import { ArrowRight } from "lucide-react"

import type { SeasonCompositionItem } from "@/view-models/season-overview"

function CompositionSegment({ item }: Readonly<{ item: SeasonCompositionItem }>) {
  return (
    <li>
      <div className="signal-season-component-label">
        <p className="signal-season-component-name">{item.label}</p>
        {item.kind === "alternative" ? (
          <p className="signal-season-options">{item.options.map((option, index) => (
            <span key={option}>{index > 0 ? <span aria-hidden="true"> / </span> : null}<span>{option}</span></span>
          ))}<span className="signal-season-choice-note">개인에게 지정된 과제만 합산</span></p>
        ) : <p className="sr-only">모든 평가 대상에게 공통 반영</p>}
      </div>
      <p className="signal-season-weight numeric">{item.weight}%</p>
    </li>
  )
}

export function SeasonComposition({ effectiveWeightTotal, items }: Readonly<{
  effectiveWeightTotal: number
  items: ReadonlyArray<SeasonCompositionItem>
}>) {
  return (
    <section className="signal-season-composition" id="season-composition" aria-labelledby="season-composition-title">
      <h2 className="signal-season-band" id="season-composition-title">개인별 최종 점수 산정</h2>
      <p className="sr-only">100점 기준: 성장·탐구 35% · 선택 과제 35%. 어학·자격증·고등급 제안 각 10%</p>
      <ol aria-label="평가 시즌 과제 가중치 구성">{items.map((item) => <CompositionSegment item={item} key={item.id} />)}</ol>
      <div className="signal-season-total">
        <p className="signal-season-total-label numeric">최종 반영 비율 {effectiveWeightTotal}%</p>
        <p className="signal-season-equation numeric">{items.map((item) => item.weight).join(" + ")} <ArrowRight aria-hidden="true" /> {effectiveWeightTotal}%</p>
      </div>
      <p className="signal-season-choice-rule">OTS 시나리오 제작·DX 툴 활용 중 개인 지정 과제 1개만 반영</p>
    </section>
  )
}
