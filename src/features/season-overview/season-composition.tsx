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
        <p className="mt-3 text-xs leading-5 text-muted-foreground">개인별 적용 과제</p>
      )}
    </li>
  )
}

export function SeasonComposition({
  configuredWeightTotal,
  effectiveWeightTotal,
  items,
}: Readonly<{
  configuredWeightTotal: number
  effectiveWeightTotal: number
  items: ReadonlyArray<SeasonCompositionItem>
}>) {
  return (
    <section className="border-y border-border bg-muted/25" id="season-composition" aria-labelledby="season-composition-title">
      <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="numeric text-xs font-bold tracking-[0.16em] text-primary">01 · COMPOSITION</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight" id="season-composition-title">이번 시즌은 이렇게 구성됩니다</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              공통 성장 과제, 개인별 심화 과제, 기초 직무 소양을 함께 반영합니다.
            </p>
          </div>
          <div className="border-l-2 border-primary pl-4">
            <p className="text-sm font-bold text-primary">개인별 최종 반영 100%</p>
            <p className="mt-1 text-xs text-muted-foreground">과제 선택과 개인별 가중치 적용 후 확정</p>
          </div>
        </div>

        <ol className="mt-7 flex flex-col md:flex-row" aria-label="평가 시즌 과제 가중치 구성">
          {items.map((item) => <CompositionSegment item={item} key={item.id} />)}
        </ol>
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            시즌 설정에는 선택 가능한 과제가 모두 있어 기본값 합계가 {configuredWeightTotal}%로 보일 수 있습니다.
          </p>
          <p className="inline-flex shrink-0 items-center gap-2 font-semibold text-foreground">
            선택 과제 1개 반영 <ArrowRight aria-hidden className="size-3.5" /> 유효 구성 {effectiveWeightTotal}%
          </p>
        </div>
      </div>
    </section>
  )
}
