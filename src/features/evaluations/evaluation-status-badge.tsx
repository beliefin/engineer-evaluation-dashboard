import {
  CircleDashedIcon,
  CircleDotDashedIcon,
  LockKeyholeIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { AssignedEvaluationStatus } from "./types"

const statusStyles: Readonly<Record<AssignedEvaluationStatus, string>> = {
  pending: "border-border bg-muted text-muted-foreground",
  in_progress: "border-warning/20 bg-warning-soft text-warning",
  submitted: "border-success/20 bg-success-soft text-success",
}

export function getEvaluationStatusLabel(status: AssignedEvaluationStatus): string {
  switch (status) {
    case "pending":
      return "미작성"
    case "in_progress":
      return "작성 중"
    case "submitted":
      return "제출 완료"
  }
}

export function EvaluationStatusBadge({
  status,
}: {
  readonly status: AssignedEvaluationStatus
}) {
  const label = getEvaluationStatusLabel(status)

  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-semibold", statusStyles[status])}
    >
      {status === "pending" ? <CircleDashedIcon aria-hidden="true" /> : null}
      {status === "in_progress" ? <CircleDotDashedIcon aria-hidden="true" /> : null}
      {status === "submitted" ? <LockKeyholeIcon aria-hidden="true" /> : null}
      {label}
    </Badge>
  )
}
