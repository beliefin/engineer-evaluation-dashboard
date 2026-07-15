import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  PendingEvaluationRow,
  PendingEvaluationStatus,
} from "@/view-models/pending"

const STATUS_CONFIG = {
  unassigned: {
    label: "미배정",
    className: "border-destructive/20 bg-danger-soft text-destructive",
  },
  not_started: {
    label: "미시작",
    className: "border-border bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "평가 진행 중",
    className: "border-warning/20 bg-warning-soft text-warning",
  },
  direct_scores_pending: {
    label: "직접점수 대기",
    className: "border-primary/20 bg-accent text-accent-foreground",
  },
} as const satisfies Readonly<
  Record<PendingEvaluationStatus, Readonly<{ label: string; className: string }>>
>

const REASON_BUILDERS = {
  unassigned: () => "평가자 배정이 필요합니다.",
  not_started: () => "평가 입력이 시작되지 않았습니다.",
  in_progress: (row: PendingEvaluationRow) =>
    row.missingEvaluatorNames.length > 0
      ? `미제출: ${row.missingEvaluatorNames.join(", ")}`
      : "평가 진행 상태를 확인해 주세요.",
  direct_scores_pending: (row: PendingEvaluationRow) =>
    `직접점수 ${row.totalDirectScoreCount - row.enteredDirectScoreCount}개 입력이 필요합니다.`,
} as const satisfies Readonly<
  Record<PendingEvaluationStatus, (row: PendingEvaluationRow) => string>
>

export function getPendingStatusLabel(status: PendingEvaluationStatus): string {
  return STATUS_CONFIG[status].label
}

export function getPendingReason(row: PendingEvaluationRow): string {
  return REASON_BUILDERS[row.status](row)
}

type PendingStatusBadgeProps = Readonly<{
  status: PendingEvaluationStatus
  className?: string | undefined
}>

export function PendingStatusBadge({
  status,
  className,
}: PendingStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      aria-label={`상태: ${config.label}`}
      className={cn("rounded-md px-2 py-0.5", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
