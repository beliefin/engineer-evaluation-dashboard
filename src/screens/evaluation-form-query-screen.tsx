"use client"

import { useSearchParams } from "next/navigation"

import { ErrorState } from "@/components/shared"
import { useEvaluation } from "@/providers"

import { EvaluationFormScreen } from "./evaluation-form-screen"
import { ParallelEvaluationFormScreen } from "./parallel-evaluation-form-screen"

export function EvaluationFormQueryScreen() {
  const searchParams = useSearchParams()
  const assignmentId = searchParams.get("assignmentId")
  const requestedParallelAssignmentId = searchParams.get("parallelAssignmentId")
  const { snapshot, role, activeEvaluatorId } = useEvaluation()
  if (assignmentId === null || assignmentId.trim().length === 0) {
    return <ErrorState description="열 평가표가 지정되지 않았습니다." />
  }
  const primary = snapshot?.assignments.find((assignment) => assignment.id === assignmentId)
  const parallel = requestedParallelAssignmentId === null
    ? undefined
    : snapshot?.assignments.find((assignment) => assignment.id === requestedParallelAssignmentId)
  const canOpenParallel =
    role === "evaluator" &&
    primary !== undefined &&
    parallel !== undefined &&
    primary.id !== parallel.id &&
    primary.taskId === parallel.taskId &&
    primary.evaluatorId === activeEvaluatorId &&
    parallel.evaluatorId === activeEvaluatorId

  if (canOpenParallel) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-4">
          <p className="text-xs font-semibold text-primary">동시 발표 평가</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">두 발표자 평가 입력</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            공통 평가항목 오른쪽에 두 발표자의 점수 열을 나란히 표시합니다. 저장·제출 상태는 서로 독립적입니다.
          </p>
        </div>
        <ParallelEvaluationFormScreen
          leftAssignmentId={primary.id}
          rightAssignmentId={parallel.id}
        />
      </div>
    )
  }
  return <EvaluationFormScreen assignmentId={assignmentId} />
}
