"use client"

import { LockKeyhole, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { EvaluationTaskDialog, METHOD_LABELS } from "./evaluation-task-dialog"
import { OperationPanel } from "./operation-panel"
import type {
  EvaluationTaskDraft,
  EvaluationTaskViewModel,
  EvaluatorOptionViewModel,
} from "./types"

type Props = Readonly<{
  tasks: readonly EvaluationTaskViewModel[]
  evaluators: readonly EvaluatorOptionViewModel[]
  weightTotal: number
  disabled: boolean
  onSave: (task: EvaluationTaskDraft) => boolean
  onDelete: (taskId: string) => boolean
}>

export function EvaluationTaskPanel({ tasks, evaluators, weightTotal, disabled, onSave, onDelete }: Props) {
  const seasonTotalIs100 = Math.abs(weightTotal - 100) < 0.000_001
  return (
    <OperationPanel
      aside={<div className="flex items-center gap-2"><Badge variant={seasonTotalIs100 ? "secondary" : "outline"}>합계 {weightTotal}%</Badge><EvaluationTaskDialog disabled={disabled} evaluators={evaluators} onSave={onSave} /></div>}
      description={<>과제별 평가방식, 세부 문항, 평가자와 <span className="whitespace-nowrap">시즌 기본 가중치</span>를 설정합니다. 택1 과제가 있으면 시즌 합계는 100%를 초과할 수 있으며, 최종 순위는 엔지니어별 적용 가중치로 계산합니다.</>}
      title="시즌 과제 구성"
    >
      {tasks.length === 0 ? (
        <div className="rounded-md border border-dashed px-5 py-12 text-center"><p className="font-medium">등록된 과제가 없습니다.</p><p className="mt-1 text-sm text-muted-foreground">과제를 추가해 이번 시즌의 평가 틀을 만드세요.</p></div>
      ) : (
        <div className="divide-y rounded-md border">
          {tasks.map((task) => (
            <article className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" key={task.taskId}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="numeric text-xs text-muted-foreground">{task.order}</span><h3 className="font-semibold">{task.name}</h3><Badge variant="outline">{METHOD_LABELS[task.method]}</Badge><Badge variant="secondary">{task.weight}%</Badge>{task.locked ? <Badge variant="outline"><LockKeyhole aria-hidden="true" /> 제출 {task.submittedCount}</Badge> : null}</div>
                <p className="mt-2 break-keep text-pretty text-sm text-muted-foreground">{task.description || "평가 안내 없음"}</p>
                <p className="mt-2 text-xs text-muted-foreground">{task.method === "evaluator_score" ? `평가 항목 ${task.items.length}개` : "P/F 또는 단일 결과 입력"} · {task.method.startsWith("evaluator") ? `평가자 ${task.evaluatorWeights.length}명` : "운영자 입력"}</p>
              </div>
              <div className="flex items-center gap-2">
                <EvaluationTaskDialog disabled={disabled || task.locked} evaluators={evaluators} initial={task} onSave={onSave} />
                <Button aria-label={`${task.name} 삭제`} disabled={disabled || task.locked} onClick={() => { if (window.confirm(`'${task.name}' 과제를 삭제할까요? 입력 데이터도 함께 삭제됩니다.`)) onDelete(task.taskId) }} size="icon-sm" variant="ghost"><Trash2 aria-hidden="true" /></Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!seasonTotalIs100 ? <p className="mt-3 text-sm text-muted-foreground">현재 가중치 합계는 {weightTotal}%입니다. 택1 과제 구성에서는 100%를 초과할 수 있습니다. 최종 순위에 반영하려면 엔지니어별 적용 가중치 합계를 100%로 맞춰 주세요.</p> : null}
    </OperationPanel>
  )
}
