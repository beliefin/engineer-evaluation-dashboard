"use client"

import { useId, useMemo, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { EvaluatorResidualMatrix } from "./evaluator-residual-matrix"
import { formatCount, formatScore } from "./format"
import { RankSensitivityRail } from "./rank-sensitivity-rail"
import { ReliabilityQuadrant } from "./reliability-quadrant"
import type {
  EvaluationReliabilityDatum,
  EvaluatorExclusionSensitivityDatum,
  EvaluatorResidualDatum,
} from "./types"

import "./analysis-summary-signal.css"

type EvaluationReliabilityAnalysisProps = Readonly<{
  reliability: readonly EvaluationReliabilityDatum[]
  residuals: readonly EvaluatorResidualDatum[]
  sensitivities: readonly EvaluatorExclusionSensitivityDatum[]
  outlierThreshold: number
  standardDeviationThreshold: number
  rankShiftAlert: number
  isLoading?: boolean
}>

type TaskOption = Readonly<{ id: string; label: string }>

function taskOptions(data: readonly EvaluationReliabilityDatum[]): readonly TaskOption[] {
  const tasks = new Map<string, TaskOption>()
  for (const entry of data) {
    if (!tasks.has(entry.taskId)) {
      tasks.set(entry.taskId, { id: entry.taskId, label: entry.taskLabel })
    }
  }
  return Array.from(tasks.values())
}

export function EvaluationReliabilityAnalysis({
  reliability,
  residuals,
  sensitivities,
  outlierThreshold,
  standardDeviationThreshold,
  rankShiftAlert,
  isLoading = false,
}: EvaluationReliabilityAnalysisProps) {
  const id = useId()
  const tasks = useMemo(() => taskOptions(reliability), [reliability])
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "")
  const activeTaskId = tasks.some((task) => task.id === selectedTaskId)
    ? selectedTaskId
    : tasks[0]?.id ?? ""
  const taskReliability = reliability.filter((entry) => entry.taskId === activeTaskId)
  const taskResiduals = residuals.filter((entry) => entry.taskId === activeTaskId)
  const taskSensitivities = sensitivities.filter((entry) => entry.taskId === activeTaskId)
  const selectedTaskLabel = tasks.find((task) => task.id === activeTaskId)?.label ?? "선택한 과제"
  const highDisagreementCount = taskReliability.filter((entry) => entry.isHighDisagreement).length
  const averageDeviation = taskReliability.length === 0
    ? 0
    : taskReliability.reduce((total, entry) => total + entry.standardDeviation, 0) / taskReliability.length

  return (
    <section aria-labelledby={`${id}-heading`} className="signal-analysis-reliability scroll-mt-24 space-y-5">
      <div className="signal-analysis-reliability-heading">
        <div>
          <h2 id={`${id}-heading`} className="text-xl font-semibold tracking-tight">평가 신뢰도 진단</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            제출 원점수 기준의 평가자 간 이견·특정 평가자 영향·과제 내 순위 변동 가능성 확인. 공식 점수는 변경 없음
          </p>
        </div>
        <div className="signal-analysis-task-selector">
          <label htmlFor={`${id}-task`} className="text-xs font-medium text-muted-foreground">분석할 평가 과제</label>
          <Select value={activeTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger id={`${id}-task`} className="w-full bg-card">
              <SelectValue placeholder="평가 과제를 선택하세요" />
            </SelectTrigger>
            <SelectContent className="signal-analysis-select-popup">
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>{task.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <dl className="signal-analysis-reliability-metrics grid border-y border-border-subtle sm:grid-cols-3">
        <div className="px-3 py-3 sm:border-r sm:border-border-subtle">
          <dt className="text-xs text-muted-foreground">비교 가능 대상</dt>
          <dd className="numeric mt-1 text-lg font-semibold">{formatCount(taskReliability.length, "명")}</dd>
        </div>
        <div className="px-3 py-3 sm:border-r sm:border-border-subtle">
          <dt className="text-xs text-muted-foreground">이견 확인 대상</dt>
          <dd className="numeric mt-1 text-lg font-semibold text-warning">{formatCount(highDisagreementCount, "명")}</dd>
        </div>
        <div className="px-3 py-3">
          <dt className="text-xs text-muted-foreground">평균 평가자 이견</dt>
          <dd className="numeric mt-1 text-lg font-semibold">{formatScore(averageDeviation)}</dd>
        </div>
      </dl>
      <div className="signal-analysis-reliability-charts">
        <ReliabilityQuadrant
          data={taskReliability}
          isLoading={isLoading}
          standardDeviationThreshold={standardDeviationThreshold}
          taskLabel={selectedTaskLabel}
        />
        <EvaluatorResidualMatrix
          data={taskResiduals}
          isLoading={isLoading}
          outlierThreshold={outlierThreshold}
          taskLabel={selectedTaskLabel}
        />
      </div>
      <RankSensitivityRail
        key={activeTaskId}
        isLoading={isLoading}
        rankShiftAlert={rankShiftAlert}
        scenarios={taskSensitivities}
        taskLabel={selectedTaskLabel}
      />
    </section>
  )
}
