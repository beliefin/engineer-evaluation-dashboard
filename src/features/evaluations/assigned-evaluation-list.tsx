"use client"

import { useMemo, useState } from "react"
import { ChevronRightIcon } from "lucide-react"

import { Progress } from "@/components/ui/progress"

import { AssignmentFilters, type AssignmentStatusFilter } from "./assignment-filters"
import {
  EvaluationStatusBadge,
  getEvaluationStatusLabel,
} from "./evaluation-status-badge"
import type { AssignedEvaluationViewModel } from "./types"

interface AssignedEvaluationListProps {
  readonly assignments: readonly AssignedEvaluationViewModel[]
  readonly onOpenEvaluation: (assignmentId: string) => void
  readonly showEvaluatorFilter?: boolean
}

function matchesSearch(item: AssignedEvaluationViewModel, query: string): boolean {
  const haystack = [
    item.engineerName,
    item.teamName,
    item.evaluatorName,
    item.categoryLabel,
    item.cycleLabel,
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR")
  return haystack.includes(query.trim().toLocaleLowerCase("ko-KR"))
}

export function AssignedEvaluationList({
  assignments,
  onOpenEvaluation,
  showEvaluatorFilter = false,
}: AssignedEvaluationListProps) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<AssignmentStatusFilter>("all")
  const [evaluatorFilter, setEvaluatorFilter] = useState("all")
  const evaluatorOptions = useMemo(() => {
    if (!showEvaluatorFilter) return []
    const uniqueEvaluators = new Map<string, string>()
    for (const assignment of assignments) {
      uniqueEvaluators.set(assignment.evaluatorId, assignment.evaluatorName)
    }
    return Array.from(uniqueEvaluators, ([id, name]) => ({ id, name })).toSorted(
      (left, right) => left.name.localeCompare(right.name, "ko"),
    )
  }, [assignments, showEvaluatorFilter])
  const filteredAssignments = useMemo(
    () =>
      assignments.filter(
        (item) =>
          matchesSearch(item, query) &&
          (statusFilter === "all" || item.status === statusFilter) &&
          (evaluatorFilter === "all" || item.evaluatorId === evaluatorFilter)
      ),
    [assignments, evaluatorFilter, query, statusFilter]
  )

  return (
    <section
      aria-labelledby="assigned-evaluations-title"
      className="overflow-hidden rounded-md border border-border bg-card"
    >
      <header className="flex flex-col gap-4 border-b border-border-subtle p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="shrink-0">
          <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">Evaluation register</p>
          <h2 id="assigned-evaluations-title" className="whitespace-nowrap text-xl font-semibold tracking-tight">
            {showEvaluatorFilter ? "전체 평가 입력" : "내 평가 배정"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {assignments.length}건 중 {filteredAssignments.length}건 표시
          </p>
        </div>

        <AssignmentFilters
          onQueryChange={setQuery}
          onReset={() => {
            setQuery("")
            setStatusFilter("all")
            setEvaluatorFilter("all")
          }}
          evaluatorId={evaluatorFilter}
          evaluatorOptions={evaluatorOptions}
          onEvaluatorChange={setEvaluatorFilter}
          onStatusChange={setStatusFilter}
          query={query}
          status={statusFilter}
        />
      </header>

      {filteredAssignments.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="font-semibold">조건에 맞는 평가가 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">검색어나 진행 상태를 변경해 보세요.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {filteredAssignments.map((item) => {
            const progress =
              item.totalItems <= 0
                ? 0
                : Math.min(100, Math.max(0, Math.round((item.answeredCount / item.totalItems) * 100)))
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenEvaluation(item.id)}
                  aria-label={`${item.engineerName} 평가 열기, ${getEvaluationStatusLabel(item.status)}`}
                  className="grid w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/45 focus-visible:bg-accent/45 md:grid-cols-[minmax(0,1fr)_180px_108px_20px] md:items-center"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-sm font-semibold">{item.engineerName}</strong>
                      <EvaluationStatusBadge status={item.status} />
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {item.teamName} · {item.categoryLabel}
                    </span>
                    {showEvaluatorFilter ? (
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <span>평가자</span>
                        <strong className="font-semibold text-foreground">{item.evaluatorName}</strong>
                      </span>
                    ) : null}
                    <span className="mt-1 block text-xs text-muted-foreground md:hidden">
                      {item.cycleLabel} · {item.updatedAtLabel} 업데이트
                    </span>
                  </span>

                  <span className="grid gap-2">
                    <span className="flex justify-between text-xs text-muted-foreground">
                      <span>입력 진행</span>
                      <span className="numeric font-semibold text-foreground">
                        {item.answeredCount}/{item.totalItems}
                      </span>
                    </span>
                    <Progress value={progress} aria-label={`입력 진행률 ${progress}%`} />
                  </span>

                  <span className="hidden text-right text-xs text-muted-foreground md:block">
                    <span className="block">{item.cycleLabel}</span>
                    <span className="mt-1 block">{item.updatedAtLabel}</span>
                  </span>

                  <ChevronRightIcon className="hidden size-4 text-muted-foreground md:block" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
