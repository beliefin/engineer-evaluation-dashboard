import { Circle, CircleCheck, Equal, LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import type { RankingStatus } from "./dashboard-view-models"

interface RankingStatusBadgeProps {
  readonly status: RankingStatus
  readonly isTied?: boolean
}

export function RankingStatusBadge({ status, isTied = false }: RankingStatusBadgeProps) {
  if (status === "not_started") {
    return (
      <Badge
        variant="outline"
        className="rounded-md border-border bg-muted text-muted-foreground"
      >
        <Circle aria-hidden="true" data-icon="inline-start" />
        미진행
      </Badge>
    )
  }

  if (status === "in_progress") {
    return (
      <Badge
        variant="outline"
        className="rounded-md border-warning/20 bg-warning-soft text-warning"
      >
        <LoaderCircle aria-hidden="true" data-icon="inline-start" />
        진행 중
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="rounded-md border-success/20 bg-success-soft text-success"
    >
      {isTied
        ? <Equal aria-hidden="true" data-icon="inline-start" />
        : <CircleCheck aria-hidden="true" data-icon="inline-start" />}
      {isTied ? "최종 확정 · 공동 순위" : "최종 확정"}
    </Badge>
  )
}
