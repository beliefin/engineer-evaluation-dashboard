import { ArrowDown, ArrowRight, CalendarDays, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SeasonOverviewModel } from "@/view-models/season-overview"

function formatPeriod(startsAt: string, endsAt: string): string {
  return `${startsAt.replaceAll("-", ". ")} — ${endsAt.replaceAll("-", ". ")}`
}

const LOOP_STEPS = [
  ["01", "문제 발견", "현장의 필요와 성장 목표 정의"],
  ["02", "실행·탐구", "기술 학습과 과제 수행"],
  ["03", "검증·공유", "근거 기반 평가와 지식 자산화"],
  ["04", "현장 성장", "개인 역량을 조직 성과로 연결"],
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
              <span className="numeric text-xs font-bold tracking-[0.18em] text-primary">00 · SEASON GUIDE</span>
              <Badge variant="outline">{backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}</Badge>
            </div>
            <p className="mt-8 text-sm font-semibold text-primary">{model.cycle.name}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]" id="season-cover-title">
              {model.cycle.name} 엔지니어 역량평가
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              현장에서 문제를 발견하고, 스스로 탐구하며, 결과를 동료가 다시 활용할 수 있는 지식으로 남기는 성장 여정입니다.
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
              <p className="numeric text-[10px] font-bold tracking-[0.16em] text-muted-foreground">CAPABILITY LOOP</p>
              <h2 className="mt-1 text-lg font-bold">성장을 현장 성과로 바꾸는 선순환</h2>
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
            결과는 점수에서 끝나지 않습니다. 피드백과 산출물은 다음 과제와 현장 개선의 출발점이 됩니다.
          </p>
        </div>
      </div>
    </header>
  )
}
