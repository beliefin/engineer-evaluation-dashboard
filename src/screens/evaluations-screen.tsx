"use client"

import { useRouter } from "next/navigation"

import { PageHeader } from "@/components/shared"
import {
  AssignedEvaluationList,
  EvaluatorParallelWorkspace,
  OperatorEvaluationWorkspace,
} from "@/features/evaluations"
import { useEvaluation } from "@/providers"
import { selectAssignedEvaluations } from "@/view-models/evaluations"

import { EvaluationFormScreen } from "./evaluation-form-screen"
import { ParallelEvaluationFormScreen } from "./parallel-evaluation-form-screen"

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
            : "본인에게 배정된 과제만 평가합니다. 같은 과제의 두 발표자는 공통 문항표의 좌우 점수 열에서 함께 평가하며, 다른 평가자의 점수·가중치는 공개하지 않습니다."
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
        <>
          <EvaluatorParallelWorkspace
            assignments={assignments}
            renderParallelForm={(leftAssignmentId, rightAssignmentId) => (
              <ParallelEvaluationFormScreen
                leftAssignmentId={leftAssignmentId}
                rightAssignmentId={rightAssignmentId}
              />
            )}
          />
          <AssignedEvaluationList
            assignments={assignments}
            onOpenEvaluation={(assignmentId) => router.push(
              `/evaluations/detail?assignmentId=${encodeURIComponent(assignmentId)}`,
            )}
          />
        </>
      )}
    </div>
  )
}
