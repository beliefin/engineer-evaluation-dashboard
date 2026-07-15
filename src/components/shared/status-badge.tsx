import type { ComponentType } from "react"
import {
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  Eye,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react"

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
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

const statusConfig: Record<EvaluationStatus, BadgeConfig> = {
  completed: {
    label: "완료",
    className: "border-success/20 bg-success-soft text-success",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "진행 중",
    className: "border-warning/20 bg-warning-soft text-warning",
    icon: Clock3,
  },
  pending: {
    label: "대기",
    className: "border-border bg-muted text-muted-foreground",
    icon: CircleDashed,
  },
  unconfirmed: {
    label: "미확정",
    className: "border-destructive/20 bg-danger-soft text-destructive",
    icon: TriangleAlert,
  },
  locked: {
    label: "제출 잠금",
    className: "border-border bg-secondary text-secondary-foreground",
    icon: LockKeyhole,
  },
}

const roleConfig: Record<DemoRole, BadgeConfig> = {
  operator: {
    label: "운영자",
    className: "border-primary/20 bg-accent text-accent-foreground",
    icon: ShieldCheck,
  },
  evaluator: {
    label: "평가자",
    className: "border-border bg-card text-foreground",
    icon: ClipboardCheck,
  },
  approver: {
    label: "승인자",
    className: "border-success/20 bg-success-soft text-success",
    icon: Eye,
  },
  engineer: {
    label: "엔지니어",
    className: "border-primary/20 bg-accent text-accent-foreground",
    icon: UserRoundCheck,
  },
}

type StatusBadgeProps = {
  status: EvaluationStatus
  label?: string | undefined
  className?: string | undefined
}

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const visibleLabel = label ?? config.label

  return (
    <Badge
      variant="outline"
      aria-label={`상태: ${visibleLabel}`}
      className={cn("gap-1 rounded-md px-2 py-0.5", config.className, className)}
    >
      <Icon className="size-3" aria-hidden />
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
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      aria-label={`데모 역할: ${config.label}`}
      className={cn("gap-1 rounded-md px-2 py-0.5", config.className, className)}
    >
      <Icon className="size-3" aria-hidden />
      {config.label}
    </Badge>
  )
}

export { RoleBadge, StatusBadge }
export type { DemoRole, EvaluationStatus, RoleBadgeProps, StatusBadgeProps }
