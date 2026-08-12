import { ClipboardCheck, FileOutput, Scale, UserRoundCheck } from "lucide-react"

import type { SeasonOverviewModel } from "@/view-models/season-overview"

import { SeasonComposition } from "./season-composition"
import { SeasonOverviewHero } from "./season-overview-hero"
import { SeasonTaskCatalog } from "./season-task-catalog"

const PRINCIPLES = [
  ["01", "현업 일체화", "별도 공부가 아니라 실제 업무 수행 안에서 성장합니다."],
  ["02", "공정성 확보", "공통 평가표와 근거 기록으로 평가자 간 차이를 줄입니다."],
  ["03", "지식 자산화", "개인의 노하우를 동료가 재사용할 수 있는 결과물로 남깁니다."],
] as const

const ROLE_GUIDES = [
  ["수행자", UserRoundCheck, "목표와 진행 과정을 스스로 관리하고, 결과와 근거를 이해 가능한 형태로 남깁니다."],
  ["평가자", Scale, "동일한 세부 기준으로 관찰하고, 점수의 근거가 되는 피드백을 기록합니다."],
  ["운영자", ClipboardCheck, "개인별 적용 과제와 평가자를 구성하고 누락 없이 시즌 진행을 관리합니다."],
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
        configuredWeightTotal={model.configuredWeightTotal}
        effectiveWeightTotal={model.effectiveWeightTotal}
        items={model.composition}
      />
      <SeasonTaskCatalog tasks={model.tasks} />

      <section className="border-y border-border bg-primary text-primary-foreground" aria-labelledby="season-outcome-title">
        <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="border-b border-primary-foreground/25 px-5 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
            <p className="numeric text-xs font-bold tracking-[0.16em] text-primary-foreground/70">03 · OUTCOME</p>
            <h2 className="mt-2 text-2xl font-bold" id="season-outcome-title">이번 시즌이 남겨야 할 것</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/80">
              점수만 남는 평가가 아니라, 성장탐구 보고서와 표준 시나리오, 개선 도구, 직무 소양 기록이 다음 업무와 교육에 다시 쓰이는 구조를 지향합니다.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 border border-primary-foreground/35 px-3 py-2 text-sm font-semibold">
              <FileOutput aria-hidden className="size-4" /> 개인의 성장 → 팀의 지식 자산
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
