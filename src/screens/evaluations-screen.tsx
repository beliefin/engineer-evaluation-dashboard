"use client"

import { useRouter } from "next/navigation"

import { PageHeader } from "@/components/shared"
import { AssignedEvaluationList, OperatorEvaluationWorkspace } from "@/features/evaluations"
import { useEvaluation } from "@/providers"
import { selectAssignedEvaluations } from "@/view-models/evaluations"

import { EvaluationFormScreen } from "./evaluation-form-screen"

export function EvaluationsScreen() {
  const router = useRouter()
  const { snapshot, activeCycleId, activeEvaluatorId, backendMode, role } = useEvaluation()
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
            ? "엔지니어를 먼저 선택하고 실제 배정된 과제와 평가자 순서로 점수·P/F를 입력합니다. 운영자 입력은 저장 후에도 잠기지 않습니다."
            : "본인에게 배정된 과제만 평가합니다. 다른 평가자의 점수·가중치는 공개하지 않습니다."
        }
        context={`평가 입력 작업 공간 · ${backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}`}
        title={operatorMode ? "전체 평가 입력" : "내 평가 업무"}
      />
      {operatorMode ? (
        <OperatorEvaluationWorkspace
          assignments={assignments}
          engineers={snapshot.engineers
            .map((engineer) => ({
              id: engineer.id,
              name: engineer.displayName,
              employeeCode: engineer.employeeCode,
              teamName: engineer.team,
            }))
            .toSorted((left, right) => left.name.localeCompare(right.name, "ko"))}
          renderForm={(assignmentId) => <EvaluationFormScreen assignmentId={assignmentId} />}
        />
      ) : (
        <AssignedEvaluationList
          assignments={assignments}
          onOpenEvaluation={(assignmentId) => router.push(
            `/evaluations/detail?assignmentId=${encodeURIComponent(assignmentId)}`,
          )}
        />
      )}
    </div>
  )
}
