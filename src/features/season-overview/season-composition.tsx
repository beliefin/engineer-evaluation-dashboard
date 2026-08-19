import { ArrowRight, GitBranch } from "lucide-react"

import type { SeasonCompositionItem } from "@/view-models/season-overview"

function CompositionSegment({ item }: Readonly<{ item: SeasonCompositionItem }>) {
  return (
    <li
      className="min-w-0 border border-border bg-card p-4 md:border-l-0 md:first:border-l"
      style={{ flexGrow: item.weight, flexBasis: 0 }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="numeric text-xl font-bold text-primary">{item.weight}%</span>
        {item.kind === "alternative" ? <GitBranch aria-hidden className="size-4 text-primary" /> : null}
      </div>
      <p className="mt-3 text-sm font-bold leading-5">{item.label}</p>
      {item.kind === "alternative" ? (
        <div className="mt-3 space-y-1 border-l border-primary pl-3 text-xs leading-5 text-muted-foreground">
          {item.options.map((option) => <span className="block" key={option}>{option}</span>)}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">모든 평가 대상에게 공통 반영</p>
      )}
    </li>
  )
}

export function SeasonComposition({
  effectiveWeightTotal,
  items,
}: Readonly<{
  effectiveWeightTotal: number
  items: ReadonlyArray<SeasonCompositionItem>
}>) {
  return (
    <section className="border-y border-border bg-muted/25" id="season-composition" aria-labelledby="season-composition-title">
      <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="numeric text-xs font-bold tracking-[0.16em] text-primary">01 · 평가 구성</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight" id="season-composition-title">개인별 최종 점수 산정</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              <span className="block">100점 기준: 성장·탐구 35% · 선택 과제 35%</span>
              <span className="block">어학·자격증·고등급 제안 각 10%</span>
            </p>
          </div>
          <div className="border-l-2 border-primary pl-4">
            <p className="text-sm font-bold text-primary">최종 반영 비율 {effectiveWeightTotal}%</p>
            <p className="mt-1 text-xs text-muted-foreground">개인에게 지정된 과제만 합산</p>
          </div>
        </div>

        <ol className="mt-7 flex flex-col md:flex-row" aria-label="평가 시즌 과제 가중치 구성">
          {items.map((item) => <CompositionSegment item={item} key={item.id} />)}
        </ol>
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>OTS 시나리오 제작·DX 툴 활용 중 개인 지정 과제 1개만 반영</p>
          <p className="inline-flex shrink-0 items-center gap-2 font-semibold text-foreground">
            35 + 35 + 10 + 10 + 10 <ArrowRight aria-hidden className="size-3.5" /> {effectiveWeightTotal}%
          </p>
        </div>
      </div>
    </section>
  )
}
