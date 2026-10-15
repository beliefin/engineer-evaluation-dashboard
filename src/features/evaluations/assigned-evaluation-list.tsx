"use client"

import { useMemo, useState } from "react"

import { Progress } from "@/components/ui/progress"

import "./assignment-signal.css"

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
    <section aria-labelledby="assigned-evaluations-title" className="signal-assignment-register">
      <header className="signal-assignment-heading">
        <div>
          <p>Evaluation register</p>
          <h2 id="assigned-evaluations-title">{showEvaluatorFilter ? "전체 평가 입력" : "내 평가 배정"}</h2>
        </div>
        <p className="numeric">총 {assignments.length}건 중 {filteredAssignments.length}건 표시</p>
      </header>
      <div className="signal-assignment-filters">
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
      </div>
      {filteredAssignments.length === 0 ? (
        <div className="signal-assignment-empty" role="status">
          <p>조건에 맞는 평가가 없습니다</p>
          <p>검색어나 진행 상태를 변경해 보세요.</p>
        </div>
      ) : (
        <>
          <div className="signal-assignment-columns" aria-hidden="true">
            <span>엔지니어</span><span>소속 팀</span><span>과제</span><span>진행 상태</span>
            <span>입력 진행</span><span>평가 대상 기간</span><span>최근 수정일</span>
          </div>
          <ul className="signal-assignment-rows">
            {filteredAssignments.map((item) => {
              const progress = item.totalItems <= 0
                ? 0
                : Math.min(100, Math.max(0, Math.round((item.answeredCount / item.totalItems) * 100)))
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvaluation(item.id)}
                    aria-label={`${item.engineerName} 평가 열기, ${getEvaluationStatusLabel(item.status)}`}
                    className="signal-assignment-row"
                  >
                    <span className="signal-assignment-name"><strong>{item.engineerName}</strong></span>
                    <span className="signal-assignment-team">{item.teamName}</span>
                    <span className="signal-assignment-task">
                      <span>{item.categoryLabel}</span>
                      {showEvaluatorFilter ? <span className="signal-assignment-evaluator">평가자 <strong>{item.evaluatorName}</strong></span> : null}
                    </span>
                    <span className="signal-assignment-status"><EvaluationStatusBadge status={item.status} /></span>
                    <span className="signal-assignment-progress">
                      <span className="signal-assignment-mobile-label">입력 진행</span>
                      <Progress value={progress} aria-label={`입력 진행률 ${progress}%`} />
                      <span className="numeric">{item.answeredCount}/{item.totalItems}</span>
                      <span className="numeric">{progress}%</span>
                    </span>
                    <span className="signal-assignment-cycle">{item.cycleLabel}</span>
                    <span className="signal-assignment-updated">{item.updatedAtLabel}<span className="signal-assignment-mobile-label"> 업데이트</span></span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
