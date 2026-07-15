"use client"

import { useRouter } from "next/navigation"

import { PageHeader } from "@/components/shared"
import { AssignedEvaluationList } from "@/features/evaluations"
import { useEvaluation } from "@/providers"
import { selectAssignedEvaluations } from "@/view-models/evaluations"

export function EvaluationsScreen() {
  const router = useRouter()
  const { snapshot, activeCycleId, activeEvaluatorId, role } = useEvaluation()
  if (snapshot === null) return null

  const operatorMode = role === "operator"
  const assignments = selectAssignedEvaluations(
    snapshot,
    activeCycleId,
    operatorMode ? undefined : activeEvaluatorId,
  )
  return (
    <div className="space-y-6">
      <PageHeader
        description={
          operatorMode
            ? "현재 평가 시즌의 모든 평가지에 점수·P/F를 입력할 수 있습니다. 가중치와 다른 평가자 결과는 숨깁니다."
            : "본인에게 배정된 과제만 평가합니다. 다른 평가자의 점수·가중치는 공개하지 않습니다."
        }
        context="평가 입력 작업 공간 · 샘플 데이터"
        title={operatorMode ? "전체 평가 입력" : "내 평가 업무"}
      />
      <AssignedEvaluationList
        assignments={assignments}
        onOpenEvaluation={(assignmentId) => router.push(`/evaluations/${assignmentId}`)}
        showEvaluatorFilter={operatorMode}
      />
    </div>
  )
}
