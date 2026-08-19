"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { EmptyState, ErrorState, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { EvaluatorProfile } from "@/features/analysis"
import { useEvaluation } from "@/providers"
import { selectEvaluatorDetail } from "@/view-models/evaluator-detail"

export function EvaluatorDetailQueryScreen() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { snapshot, activeCycleId, backendMode } = useEvaluation()
  if (snapshot === null) return null

  const evaluators = snapshot.evaluators.toSorted((left, right) =>
    left.displayName.localeCompare(right.displayName, "ko"))
  const requestedEvaluatorId = searchParams.get("evaluatorId") ?? ""
  const evaluatorId = evaluators.some((entry) => entry.id === requestedEvaluatorId)
    ? requestedEvaluatorId
    : (evaluators[0]?.id ?? "")

  if (evaluatorId.length === 0) {
    return <EmptyState title="등록된 평가자가 없습니다" description="평가 운영 관리에서 평가자를 먼저 등록해 주세요." />
  }

  const model = selectEvaluatorDetail(snapshot, activeCycleId, evaluatorId)
  if (model === null) {
    return <ErrorState description="선택한 평가자 또는 평가 시즌의 데이터를 찾을 수 없습니다." />
  }

  function changeEvaluator(nextEvaluatorId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("evaluatorId", nextEvaluatorId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={(
          <Button asChild variant="outline">
            <Link href="/analysis">분석으로 돌아가기</Link>
          </Button>
        )}
        context={`평가 인사이트 · ${backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}`}
        description="평가자별 점수 수준·과제 및 문항 경향·동료 대비 편차·최근 평가 이력"
        title="평가자 평가 프로필"
      />
      <section className="rounded-md border border-border bg-card p-4 sm:p-5" aria-labelledby="evaluator-selector-title">
        <div className="max-w-lg">
          <h2 id="evaluator-selector-title" className="text-sm font-semibold">평가자 선택</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            현재 평가 시즌에 등록된 평가자를 선택하면 아래 분석이 즉시 바뀝니다.
          </p>
          <select
            aria-label="평가자 선택"
            className="mt-3 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => changeEvaluator(event.target.value)}
            value={evaluatorId}
          >
            {evaluators.map((evaluator) => (
              <option key={evaluator.id} value={evaluator.id}>
                {evaluator.displayName} · {evaluator.employeeCode} · {evaluator.team}
              </option>
            ))}
          </select>
        </div>
      </section>
      <EvaluatorProfile model={model} />
    </div>
  )
}
