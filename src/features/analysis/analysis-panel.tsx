import { BarChart3 } from "lucide-react"
import { useId, type ReactNode } from "react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

type AnalysisPanelProps = Readonly<{
  title: string
  description: string
  children: ReactNode
  isLoading?: boolean
  isEmpty?: boolean
}>

export function AnalysisPanel({
  title,
  description,
  children,
  isLoading = false,
  isEmpty = false,
}: AnalysisPanelProps) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className="min-w-0 rounded-md border border-border bg-card"
    >
      <header className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <h2 id={titleId} className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="p-4 sm:p-5">
        {isLoading ? (
          <div role="status" aria-label={`${title} 불러오는 중`} className="space-y-3">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-8 w-28" />
          </div>
        ) : isEmpty ? (
          <Empty className="min-h-64 border border-border-subtle">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChart3 aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>표시할 분석 데이터가 없습니다</EmptyTitle>
              <EmptyDescription>
                필터를 변경하거나 평가 제출이 완료된 뒤 다시 확인해 주세요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
