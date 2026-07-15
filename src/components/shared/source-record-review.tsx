import { StatusBadge } from "./status-badge"

type SourceRecordReviewProps = Readonly<{
  status: "pending" | "verified" | "seed"
  sourceLabel: string
  updatedAtLabel: string
}>

export function SourceRecordReview({
  status,
  sourceLabel,
  updatedAtLabel,
}: SourceRecordReviewProps) {
  const badge = status === "pending"
    ? <StatusBadge label="운영자 검토 대기" status="in_progress" />
    : status === "verified"
      ? <StatusBadge label="검토 완료" status="completed" />
      : <StatusBadge label="샘플 초기값" status="pending" />

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {badge}
      <span className="text-xs text-muted-foreground">
        {sourceLabel} · {updatedAtLabel}
      </span>
    </div>
  )
}
