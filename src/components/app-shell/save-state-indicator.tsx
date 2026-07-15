import {
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { AppShellSaveState } from "./types"

interface SaveStatePresentation {
  readonly Icon: LucideIcon
  readonly label: string
  readonly className: string
  readonly iconClassName?: string
}

const SAVE_STATE_PRESENTATION: Readonly<
  Record<AppShellSaveState, SaveStatePresentation>
> = {
  idle: {
    Icon: CircleIcon,
    label: "저장 대기",
    className: "text-muted-foreground",
  },
  saving: {
    Icon: LoaderCircleIcon,
    label: "저장 중",
    className: "text-primary",
    iconClassName: "animate-spin",
  },
  saved: {
    Icon: CheckCircle2Icon,
    label: "저장 완료",
    className: "text-success",
  },
  error: {
    Icon: CircleAlertIcon,
    label: "저장 오류",
    className: "text-destructive",
  },
  locked: {
    Icon: LockKeyholeIcon,
    label: "제출 잠금",
    className: "text-muted-foreground",
  },
}

interface SaveStateIndicatorProps {
  readonly state: AppShellSaveState
  readonly compact?: boolean
}

export function SaveStateIndicator({
  state,
  compact = false,
}: SaveStateIndicatorProps) {
  const presentation = SAVE_STATE_PRESENTATION[state]
  const { Icon } = presentation

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex h-7 shrink-0 items-center gap-1.5 text-xs font-medium",
        presentation.className
      )}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5", presentation.iconClassName)}
      />
      <span className={cn(compact && "sr-only")}>{presentation.label}</span>
    </div>
  )
}
