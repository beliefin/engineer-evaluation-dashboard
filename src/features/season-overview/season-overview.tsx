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
    <div className="overflow-hidden border-x border-border bg-background">
      <SeasonOverviewHero backendMode={backendMode} model={model} />

      <section className="grid border-b border-border bg-card md:grid-cols-3" aria-label="평가 운영 원칙">
        {PRINCIPLES.map(([number, title, description]) => (
          <div className="border-b border-border px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:px-8" key={number}>
            <span className="numeric text-[10px] font-bold tracking-[0.16em] text-primary">{number}</span>
            <h2 className="mt-2 text-base font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>

      <SeasonComposition
        effectiveWeightTotal={model.effectiveWeightTotal}
        items={model.composition}
      />
      <SeasonTaskCatalog tasks={model.tasks} />
      <EducationTaskCatalog tasks={model.educationTasks} />

      <section className="border-y border-border bg-primary text-primary-foreground" aria-labelledby="season-outcome-title">
        <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="border-b border-primary-foreground/25 px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
            <p className="numeric text-xs font-bold tracking-[0.16em] text-primary-foreground/70">03 · 기대 결과</p>
            <h2 className="mt-2 text-2xl font-bold" id="season-outcome-title">평가 이후에도 이어지는 실무 활용</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/80">
              성장·탐구 보고서, OTS 시나리오, 개선 도구, 직무 역량 기록의 후속 업무·교육 활용
            </p>
            <div className="mt-6 inline-flex items-center gap-2 border border-primary-foreground/35 px-3 py-2 text-sm font-semibold">
              <FileOutput aria-hidden className="size-4" /> 개인의 경험을 팀의 업무 자료로 전환
            </div>
          </div>
          <div className="grid sm:grid-cols-3">
            {ROLE_GUIDES.map(([title, Icon, description]) => (
              <article className="border-b border-primary-foreground/25 px-5 py-7 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6" key={title}>
                <Icon aria-hidden className="size-5 text-primary-foreground/80" />
                <h3 className="mt-5 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/75">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
