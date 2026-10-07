"use client"

import { Badge } from "@/components/ui/badge"

import { DirectScoreInput } from "./direct-score-input"
import type { EngineerDirectScoreViewModel } from "./types"

interface HighGradeProposalInputProps {
  readonly row: EngineerDirectScoreViewModel
  readonly disabled: boolean
  readonly onScoreChange: (
    engineerId: string,
    taskId: string,
    score: number | null,
    passResult: boolean | null,
  ) => void
}

function isHighGradeProposal(taskName: string): boolean {
  return taskName.replaceAll(/\s/g, "").includes("고등급제안")
}

export function HighGradeProposalInput({
  row,
  disabled,
  onScoreChange,
}: HighGradeProposalInputProps) {
  const task = row.directTasks.find((entry) =>
    entry.method === "operator_score" && isHighGradeProposal(entry.taskName)
  )

  return (
    <section
      aria-label="고등급 제안 점수 입력"
      className="mt-5 rounded-md border border-primary/20 bg-accent/40 p-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">고등급 제안 점수</h3>
            <Badge variant="outline">직접 입력</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            운영자가 산정한 점수를 0~120점으로 입력
          </p>
          <p className="mt-1 text-xs font-medium text-primary">
            입력 상한 120점 · 최종 점수 {task?.weight ?? 10}% 반영
          </p>
        </div>

        {task === undefined ? (
          <p className="text-sm text-muted-foreground">현재 시즌에 고등급 제안 과제가 없습니다.</p>
        ) : (
          <div className="flex items-center gap-3">
            <DirectScoreInput
              disabled={disabled || task.formulaDriven === true}
              engineerName={row.engineerName}
              fieldLabel={task.taskName}
              maxScore={120}
              onChange={(score) => onScoreChange(row.engineerId, task.taskId, score, null)}
              value={task.score}
            />
            <span className="text-sm text-muted-foreground">점</span>
          </div>
        )}
      </div>
    </section>
  )
}
