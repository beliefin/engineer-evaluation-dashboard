import { Progress } from "@/components/ui/progress"

interface ScoreSummaryProps {
  readonly total: number
  readonly answeredCount: number
  readonly remainingCount: number
  readonly totalItems: number
  readonly requirementsId: string
  readonly operatorMode?: boolean
}

export function ScoreSummary({
  total,
  answeredCount,
  remainingCount,
  totalItems,
  requirementsId,
  operatorMode = false,
}: ScoreSummaryProps) {
  const progress = totalItems === 0 ? 0 : (answeredCount / totalItems) * 100
  const normalized = totalItems === 0 ? 0 : (total / (totalItems * 10)) * 100

  return (
    <div className="grid gap-4 border-b border-border-subtle bg-muted/35 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center md:px-5">
      <div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold">평가 진행</span>
          <span className="numeric text-xs font-semibold text-muted-foreground">
            {remainingCount === 0 ? "입력 완료" : `${remainingCount}개 남음`}
          </span>
        </div>
        <Progress
          className="mt-2"
          value={progress}
          aria-label={`평가 항목 ${answeredCount}개 입력, 총 ${totalItems}개`}
        />
        <p id={requirementsId} className="mt-2 text-pretty text-xs text-muted-foreground">
          {operatorMode
            ? `${totalItems}개 항목을 모두 입력하면 평가를 저장할 수 있습니다. 저장 후에도 계속 수정할 수 있습니다.`
            : `${totalItems}개 항목을 모두 입력해야 제출할 수 있습니다. 제출 후에는 운영자 승인 없이 수정할 수 없습니다.`}
        </p>
      </div>

      <div className="flex items-baseline justify-end gap-1 border-t border-border-subtle pt-3 md:min-w-36 md:border-t-0 md:border-l md:pt-0 md:pl-6">
        <strong className="numeric text-3xl leading-none tracking-tight">{normalized.toFixed(1)}</strong>
        <span className="numeric text-sm font-semibold text-muted-foreground">/ 100점 환산</span>
      </div>
    </div>
  )
}
