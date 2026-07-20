import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type EvaluationStatus =
  | "completed"
  | "in_progress"
  | "pending"
  | "unconfirmed"
  | "locked"

type DemoRole = "operator" | "evaluator" | "approver" | "engineer"

type BadgeConfig = {
  label: string
  className: string
}

const statusConfig: Record<EvaluationStatus, BadgeConfig> = {
  completed: {
    label: "완료",
    className: "border-success/30 bg-success-soft text-success",
  },
  in_progress: {
    label: "진행 중",
    className: "border-warning/30 bg-warning-soft text-warning",
  },
  pending: {
    label: "대기",
    className: "border-border bg-muted text-muted-foreground",
  },
  unconfirmed: {
    label: "미확정",
    className: "border-destructive/30 bg-danger-soft text-destructive",
  },
  locked: {
    label: "제출 잠금",
    className: "border-border bg-secondary text-secondary-foreground",
  },
}

const roleConfig: Record<DemoRole, BadgeConfig> = {
  operator: {
    label: "운영자",
    className: "border-primary/30 bg-accent text-accent-foreground",
  },
  evaluator: {
    label: "평가자",
    className: "border-border bg-card text-foreground",
  },
  approver: {
    label: "승인자",
    className: "border-success/30 bg-success-soft text-success",
  },
  engineer: {
    label: "엔지니어",
    className: "border-primary/30 bg-accent text-accent-foreground",
  },
}

type StatusBadgeProps = {
  status: EvaluationStatus
  label?: string | undefined
  className?: string | undefined
}

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const visibleLabel = label ?? config.label

  return (
    <Badge
      variant="outline"
      aria-label={`상태: ${visibleLabel}`}
      className={cn(config.className, className)}
    >
      {visibleLabel}
    </Badge>
  )
}

type RoleBadgeProps = {
  role: DemoRole
  className?: string | undefined
}

function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]

  return (
    <Badge
      variant="outline"
      aria-label={`역할: ${config.label}`}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

export { RoleBadge, StatusBadge }
export type { DemoRole, EvaluationStatus, RoleBadgeProps, StatusBadgeProps }
