"use client"

import Link from "next/link"

import { AccessDenied, EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EngineerDetail } from "@/features/engineers"
import { useEvaluation } from "@/providers"
import { selectEngineerDetail } from "@/view-models/engineers"

export function EngineerDetailScreen({ engineerId }: Readonly<{ engineerId: string }>) {
  const { snapshot, activeCycleId, role, canViewInsights } = useEvaluation()
  if (snapshot === null) return null
  const evaluatorInsightAccess = role === "evaluator" && canViewInsights
  if (role !== "operator" && role !== "approver" && !evaluatorInsightAccess) {
    return <AccessDenied allowedRoles={["operator", "approver"]} currentRole={role} />
  }

  const model = selectEngineerDetail(snapshot, activeCycleId, engineerId, role)
  if (model === null) {
    return (
      <EmptyState
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">전체 현황으로 돌아가기</Link>
          </Button>
        }
        description="선택한 평가 시즌에서 해당 샘플 엔지니어를 찾을 수 없습니다."
        title="엔지니어 결과가 없습니다"
      />
    )
  }

  return (
    <div className="signal-detail-screen">
      <Link className="signal-detail-return" href="/dashboard">‹ 전체 현황으로 돌아가기</Link>
      <EngineerDetail model={model} role={role} />
    </div>
  )
}
