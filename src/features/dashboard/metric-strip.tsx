import { Skeleton } from "@/components/ui/skeleton"

import type {
  DashboardMetricTone,
  MetricStripProps,
} from "./dashboard-view-models"

const TONE_CLASSES: Record<DashboardMetricTone, string> = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
}

export function MetricStrip({ metrics, loading = false }: MetricStripProps) {
  return (
    <section aria-label="평가 현황 요약" className="overflow-hidden border-y border-border bg-card">
      <dl className="grid gap-px bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="min-w-0 bg-card px-5 py-4">
            <dt className="text-xs font-medium text-muted-foreground">
              {metric.label}
            </dt>
            <dd className="mt-2">
              {loading ? (
                <Skeleton className="h-8 w-24 rounded-md" />
              ) : (
                <span
                  className={`numeric text-2xl font-bold ${TONE_CLASSES[metric.tone]}`}
                >
                  {metric.value}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    {metric.unit}
                  </span>
                </span>
              )}
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {metric.description}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
