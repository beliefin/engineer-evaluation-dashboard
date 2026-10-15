import "./season-signal.css"

import { ClipboardCheck, FileOutput, Scale, UserRoundCheck } from "lucide-react"

import type { SeasonOverviewModel } from "@/view-models/season-overview"

import { SeasonComposition } from "./season-composition"
import { SeasonOverviewHero } from "./season-overview-hero"
import { EducationTaskCatalog, SeasonTaskCatalog } from "./season-task-catalog"

const PRINCIPLES = [
  ["01", "업무 안에서 성장", "실제 업무 문제를 바탕으로 한 학습과 개선"],
  ["02", "같은 기준으로 평가", "공통 평가표와 구체적 근거를 통한 평가자 편차 최소화"],
  ["03", "결과를 함께 활용", "개인 지식과 노하우의 팀 공용 자료화"],
] as const

const ROLE_GUIDES = [
  ["수행자", UserRoundCheck, "목표·진행 과정 관리와 이해하기 쉬운 결과·근거 정리"],
  ["평가자", Scale, "동일 세부 기준 적용과 점수 근거 기록"],
  ["운영자", ClipboardCheck, "개인별 과제·평가자 배정과 누락 평가 점검"],
] as const

export function SeasonOverview({
  backendMode,
  model,
}: Readonly<{
  backendMode: "supabase" | "local"
  model: SeasonOverviewModel
}>) {
  return (
    <div className="signal-season">
      <SeasonOverviewHero backendMode={backendMode} model={model} />

      <section className="signal-season-principles" aria-label="평가 운영 원칙">
        {PRINCIPLES.map(([number, title, description]) => (
          <div className="signal-season-principle" key={number}>
            <h2 className="signal-season-band">{title}</h2>
            <div><span className="numeric">{number}</span><p>{description}</p></div>
          </div>
        ))}
      </section>

      <SeasonComposition
        effectiveWeightTotal={model.effectiveWeightTotal}
        items={model.composition}
      />
      <SeasonTaskCatalog tasks={model.tasks} />
      <EducationTaskCatalog tasks={model.educationTasks} />

      <section className="signal-season-outcome" aria-labelledby="season-outcome-title">
        <div className="signal-season-outcome-grid">
          <div className="signal-season-outcome-copy">
            <p className="signal-season-outcome-eyebrow">03 · 기대 결과</p>
            <h2 className="signal-season-outcome-title" id="season-outcome-title">평가 이후에도 이어지는 실무 활용</h2>
            <p className="signal-season-outcome-description">
              성장·탐구 보고서, OTS 시나리오, 개선 도구, 직무 역량 기록의 후속 업무·교육 활용
            </p>
            <div className="signal-season-outcome-summary">
              <FileOutput aria-hidden className="size-4" /> 개인의 경험을 팀의 업무 자료로 전환
            </div>
          </div>
          <div className="signal-season-roles">
            {ROLE_GUIDES.map(([title, Icon, description]) => (
              <article className="signal-season-role" key={title}>
                <Icon aria-hidden className="signal-season-role-icon" />
                <h3 className="signal-season-role-title">{title}</h3>
                <p className="signal-season-role-description">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
