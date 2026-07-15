import type { AnalysisHighlightDatum } from "./types"

type AnalysisInsightStripProps = Readonly<{
  data: readonly AnalysisHighlightDatum[]
}>

export function AnalysisInsightStrip({ data }: AnalysisInsightStripProps) {
  if (data.length === 0) return null

  return (
    <section
      aria-labelledby="analysis-insight-heading"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <header className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <h2 id="analysis-insight-heading" className="text-base font-semibold tracking-tight">
          핵심 인사이트
        </h2>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">
          현재 필터의 변별력·완료 병목·팀 격차를 요약했습니다.
        </p>
      </header>
      <dl className="grid sm:grid-cols-3 sm:divide-x sm:divide-border-subtle">
        {data.map((item) => (
          <div
            key={item.kind}
            className="border-b border-border-subtle px-4 py-4 last:border-b-0 sm:border-b-0 sm:px-5"
          >
            <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
            <dd className="mt-2">
              <span className="numeric text-xl font-semibold tracking-tight text-foreground">
                {item.value}
              </span>
              <p className="mt-1 text-pretty text-xs text-muted-foreground">{item.detail}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
