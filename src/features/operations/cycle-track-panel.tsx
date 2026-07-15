"use client"

import { CheckCircle2, CircleDashed } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { OperationPanel } from "./operation-panel"
import type { OperationsTrack } from "./types"

interface CycleTrackPanelProps {
  readonly cycleLabel: string
  readonly track: OperationsTrack
  readonly disabled: boolean
  readonly onTrackChange: (track: OperationsTrack) => void
}

const TRACK_OPTIONS: readonly {
  readonly value: OperationsTrack
  readonly label: string
  readonly description: string
}[] = [
  {
    value: "unselected",
    label: "미선택",
    description: "핵심 평가 분야를 아직 선택하지 않았습니다.",
  },
  {
    value: "ots",
    label: "OTS 시나리오 제작",
    description: "두 번째 35% 분야를 OTS로 설정합니다.",
  },
  {
    value: "dx",
    label: "DX 툴 활용",
    description: "두 번째 35% 분야를 DX로 설정합니다.",
  },
]

export function CycleTrackPanel({
  cycleLabel,
  track,
  disabled,
  onTrackChange,
}: CycleTrackPanelProps) {
  return (
    <OperationPanel
      aside={<Badge variant="secondary">시즌 전체 적용</Badge>}
      description="선택값은 모든 엔지니어와 평가자 배정에 공통 적용됩니다."
      title="OTS / DX 평가 분야 설정"
    >
      <fieldset disabled={disabled}>
        <legend className="mb-3 text-sm font-medium">
          {cycleLabel} 핵심 평가 분야
        </legend>
        <div className="grid gap-3 lg:grid-cols-3">
          {TRACK_OPTIONS.map((option) => {
            const selected = track === option.value

            return (
              <label
                className="group flex min-h-28 cursor-pointer gap-3 rounded-md border bg-background p-4 transition-colors has-checked:border-primary has-checked:bg-accent disabled:pointer-events-none"
                key={option.value}
              >
                <input
                  checked={selected}
                  className="sr-only"
                  disabled={disabled}
                  name="cycle-track"
                  onChange={() => onTrackChange(option.value)}
                  type="radio"
                  value={option.value}
                />
                {selected ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                ) : (
                  <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-pretty text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </OperationPanel>
  )
}
