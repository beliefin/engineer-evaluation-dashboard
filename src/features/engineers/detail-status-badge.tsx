import {
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  Clock3,
  FilePenLine,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type {
  EngineerResultStatus,
  EvaluatorSubmissionStatus,
} from "./engineer-detail.types"

type DetailStatus = EngineerResultStatus | EvaluatorSubmissionStatus

interface DetailStatusBadgeProps {
  readonly status: DetailStatus
  readonly className?: string
}

export function DetailStatusBadge({
  status,
  className,
}: DetailStatusBadgeProps) {
  if (status === "complete" || status === "submitted") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-success/20 bg-success-soft text-success",
          className
        )}
      >
        <CircleCheckBig aria-hidden="true" data-icon="inline-start" />
        {status === "complete" ? "평가 완료" : "제출 완료"}
      </Badge>
    )
  }

  if (status === "in_progress" || status === "draft") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-warning/20 bg-warning-soft text-warning",
          className
        )}
      >
        {status === "draft" ? (
          <FilePenLine aria-hidden="true" data-icon="inline-start" />
        ) : (
          <Clock3 aria-hidden="true" data-icon="inline-start" />
        )}
        {status === "draft" ? "임시저장" : "진행 중"}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        status === "unconfirmed"
          ? "border-destructive/20 bg-danger-soft text-destructive"
          : "border-border bg-muted text-muted-foreground",
        className
      )}
    >
      {status === "unconfirmed" ? (
        <CircleAlert aria-hidden="true" data-icon="inline-start" />
      ) : (
        <CircleDashed aria-hidden="true" data-icon="inline-start" />
      )}
      {status === "unconfirmed" ? "미확정" : "미제출"}
    </Badge>
  )
}
