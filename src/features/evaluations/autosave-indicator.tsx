import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CloudIcon,
  LoaderCircleIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import type { AutosaveStatus } from "./types"

interface AutosaveIndicatorProps {
  readonly status: AutosaveStatus
  readonly lastSavedAtLabel: string | null
}

function getStatusLabel(status: AutosaveStatus): string {
  switch (status) {
    case "idle":
      return "변경사항 자동 저장"
    case "saving":
      return "저장 중"
    case "saved":
      return "저장 완료"
    case "error":
      return "저장 실패"
  }
}

export function AutosaveIndicator({ status, lastSavedAtLabel }: AutosaveIndicatorProps) {
  const label = getStatusLabel(status)

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
        status === "saved" && "text-success",
        status === "error" && "text-destructive"
      )}
    >
      {status === "idle" ? <CloudIcon className="size-3.5" aria-hidden="true" /> : null}
      {status === "saving" ? (
        <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden="true" />
      ) : null}
      {status === "saved" ? <CheckCircle2Icon className="size-3.5" aria-hidden="true" /> : null}
      {status === "error" ? <AlertCircleIcon className="size-3.5" aria-hidden="true" /> : null}
      <span>{label}</span>
      {status === "saved" && lastSavedAtLabel !== null ? (
        <span className="font-normal text-muted-foreground">· {lastSavedAtLabel}</span>
      ) : null}
    </span>
  )
}
