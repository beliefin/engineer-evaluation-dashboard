import { CircleCheck, Equal } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import type { RankingStatus } from "./dashboard-view-models"

interface RankingStatusBadgeProps {
  readonly status: RankingStatus
}

export function RankingStatusBadge({ status }: RankingStatusBadgeProps) {
  if (status === "tied") {
    return (
      <Badge
        variant="outline"
        className="rounded-md border-primary/20 bg-accent text-accent-foreground"
      >
        <Equal aria-hidden="true" data-icon="inline-start" />
        공동 순위
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="rounded-md border-success/20 bg-success-soft text-success"
    >
      <CircleCheck aria-hidden="true" data-icon="inline-start" />
      순위 확정
    </Badge>
  )
}
