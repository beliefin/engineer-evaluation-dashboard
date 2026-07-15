"use client"

import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { AccessDenied, EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EngineerDetail } from "@/features/engineers"
import { useEvaluation } from "@/providers"
import { selectEngineerDetail } from "@/view-models/engineers"

export function EngineerDetailScreen({ engineerId }: Readonly<{ engineerId: string }>) {
  const { snapshot, activeCycleId, role } = useEvaluation()
  if (snapshot === null) return null
  if (role !== "operator" && role !== "approver") {
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
    <div className="space-y-5">
      <Button asChild className="-ml-2" size="sm" variant="ghost">
        <Link href="/dashboard">
          <ArrowLeftIcon aria-hidden="true" />
          전체 순위로 돌아가기
        </Link>
      </Button>
      <EngineerDetail model={model} role={role} />
    </div>
  )
}
