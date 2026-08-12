import { ArrowDown, ArrowRight, CalendarDays, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SeasonOverviewModel } from "@/view-models/season-overview"

function formatPeriod(startsAt: string, endsAt: string): string {
  return `${startsAt.replaceAll("-", ". ")} — ${endsAt.replaceAll("-", ". ")}`
}

const LOOP_STEPS = [
  ["01", "문제 찾기", "업무에서 개선할 문제와 성장 목표를 정합니다."],
  ["02", "배우고 실행하기", "필요한 기술을 배우고 과제를 수행합니다."],
  ["03", "검증하고 공유하기", "결과를 근거로 확인하고 동료와 공유합니다."],
  ["04", "업무에 다시 적용하기", "배운 내용을 다음 업무와 개선 활동에 활용합니다."],
] as const

export function SeasonOverviewHero({
  backendMode,
  model,
}: Readonly<{
  backendMode: "supabase" | "local"
  model: SeasonOverviewModel
}>) {
  return (
    <header className="border-y border-border bg-card">
      <div className="grid lg:grid-cols-[minmax(0,1.02fr)_minmax(25rem,0.98fr)]">
        <div className="flex min-h-[27rem] flex-col justify-between border-b border-border px-5 py-7 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="numeric text-xs font-bold tracking-[0.18em] text-primary">00 · 시즌 안내</span>
              <Badge variant="outline">{backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}</Badge>
            </div>
            <p className="mt-8 text-sm font-semibold text-primary">{model.cycle.name}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]" id="season-cover-title">
              {model.cycle.name} 엔지니어 역량평가
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              실제 업무의 문제를 과제로 삼아 배우고 실행하며, 그 결과를 다음 업무에 활용할 수 있게 정리합니다.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-border pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <CalendarDays aria-hidden className="size-4 text-primary" />
              {formatPeriod(model.cycle.startsAt, model.cycle.endsAt)}
            </span>
            <span className="text-muted-foreground">현재 선택한 시즌 기준</span>
          </div>
        </div>

        <div className="bg-muted/35 px-5 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="numeric text-[10px] font-bold tracking-[0.16em] text-muted-foreground">성장 과정</p>
              <h2 className="mt-1 text-lg font-bold">배운 내용을 업무에 다시 적용하는 과정</h2>
            </div>
            <RefreshCw aria-hidden className="size-5 text-primary" />
          </div>
          <ol className="mt-5 grid gap-0 sm:grid-cols-2" aria-label="엔지니어 성장 선순환">
            {LOOP_STEPS.map(([number, title, description], index) => (
              <li
                className="relative border border-border bg-card p-4 sm:min-h-36 sm:p-5 [&:nth-child(2)]:border-t-0 sm:[&:nth-child(2)]:border-l-0 sm:[&:nth-child(2)]:border-t [&:nth-child(3)]:border-t-0 sm:[&:nth-child(3)]:border-t-0 [&:nth-child(4)]:border-t-0 sm:[&:nth-child(4)]:border-l-0"
                key={number}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="numeric text-xs font-bold text-primary">{number}</span>
                  {index < LOOP_STEPS.length - 1 ? (
                    <>
                      <ArrowRight aria-hidden className="hidden size-4 text-muted-foreground sm:block" />
                      <ArrowDown aria-hidden className="size-4 text-muted-foreground sm:hidden" />
                    </>
                  ) : null}
                </div>
                <h3 className="mt-5 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
            평가 결과와 피드백은 다음 과제와 업무 개선에 활용합니다.
          </p>
        </div>
      </div>
    </header>
  )
}
