"use client"

import { LockKeyhole } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { EvaluationTaskDialog, METHOD_LABELS } from "./evaluation-task-dialog"
import { OperationPanel } from "./operation-panel"
import styles from "./configuration-signal.module.css"
import type {
  EvaluationTaskDraft,
  EvaluationTaskViewModel,
} from "./types"

type Props = Readonly<{
  tasks: readonly EvaluationTaskViewModel[]
  weightTotal: number
  disabled: boolean
  onSave: (task: EvaluationTaskDraft) => boolean
  onDelete: (taskId: string) => boolean
}>

export function EvaluationTaskPanel({ tasks, weightTotal, disabled, onSave, onDelete }: Props) {
  const seasonTotalIs100 = Math.abs(weightTotal - 100) < 0.000_001
  return (
    <div className={styles.tasks}>
    <OperationPanel
      aside={<div className={styles.taskHeadingActions}><span className={styles.total}>합계 <strong>{weightTotal}%</strong></span><EvaluationTaskDialog disabled={disabled} onSave={onSave} /></div>}
      description={<>과제별 평가 방식·세부 문항·<span className="whitespace-nowrap">시즌 기본 가중치</span> 설정. 평가자는 엔지니어별 배정 탭에서 지정</>}
      title="시즌 과제 구성"
    >
      {tasks.length === 0 ? (
        <div className="rounded-md border border-dashed px-5 py-12 text-center"><p className="font-medium">등록된 과제가 없습니다.</p><p className="mt-1 text-sm text-muted-foreground">과제를 추가해 이번 시즌의 평가 틀을 만드세요.</p></div>
      ) : (
        <div aria-label="시즌 과제 구성 표" className={styles.taskTableFrame} role="region" tabIndex={0}>
          <table className={styles.taskTable}>
            <thead>
              <tr>
                <th scope="col">순서</th>
                <th scope="col">과제명</th>
                <th scope="col">평가 방식</th>
                <th scope="col">가중치</th>
                <th scope="col">과제 설명</th>
                <th scope="col">문항 수 / 입력 방식</th>
                <th scope="col">제출 현황</th>
                <th scope="col">잠금 상태</th>
                <th scope="col">설정 수정</th>
                <th scope="col">삭제</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.taskId}>
                  <td className={styles.taskOrder}>{task.order}</td>
                  <th className={styles.taskName} scope="row">{task.name}</th>
                  <td><Badge className={styles.method} variant="outline">{METHOD_LABELS[task.method]}</Badge></td>
                  <td className={styles.taskWeight}>{task.weight}%</td>
                  <td className={styles.taskDescription}>{task.description || "평가 안내 없음"}</td>
                  <td className={styles.taskMethodHelp}>{task.method === "evaluator_score" ? `평가 항목 ${task.items.length}개` : "P/F 또는 단일 결과 입력"} · {task.method.startsWith("evaluator") ? "엔지니어별 평가자 배정" : "운영자 입력"}</td>
                  <td className={styles.taskSubmitted}>{task.locked ? `${task.submittedCount}건` : "—"}</td>
                  <td>{task.locked ? <span className={styles.locked}><LockKeyhole aria-hidden="true" /> 잠김</span> : "-"}</td>
                  <td><EvaluationTaskDialog disabled={disabled || task.locked} initial={task} onSave={onSave} /></td>
                  <td><Button aria-label={`${task.name} 삭제`} disabled={disabled || task.locked} onClick={() => { if (window.confirm(`'${task.name}' 과제를 삭제할까요? 입력 데이터도 함께 삭제됩니다.`)) onDelete(task.taskId) }} size="sm" variant="outline">삭제</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!seasonTotalIs100 ? <p className={styles.weightNote}>현재 시즌 과제 가중치 합계 {weightTotal}%. 택1 과제 구성은 100% 초과 가능. 최종 순위 반영을 위한 엔지니어별 적용 가중치 합계는 100%</p> : null}
    </OperationPanel>
    </div>
  )
}
