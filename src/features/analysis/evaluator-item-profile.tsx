"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { useId, useState } from "react"

import type { EvaluatorItemProfile as EvaluatorItemProfileDatum } from "@/view-models/evaluator-detail"

import { AnalysisPanel } from "./analysis-panel"
import { EvaluatorComparisonChart } from "./evaluator-task-profile"

function signed(value: number | null): string {
  if (value === null) return "-"
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`
}

export function EvaluatorItemProfile({
  data,
}: Readonly<{ data: readonly EvaluatorItemProfileDatum[] }>) {
  const taskSelectId = useId()
  const taskOptions = Array.from(new Map(data.map((row) => [row.taskId, row.taskLabel])))
  const [requestedTaskId, setRequestedTaskId] = useState(taskOptions[0]?.[0] ?? "")
  const selectedTaskId = taskOptions.some(([taskId]) => taskId === requestedTaskId)
    ? requestedTaskId
    : (taskOptions[0]?.[0] ?? "")
  const selectedRows = data.filter((row) => row.taskId === selectedTaskId)

  return (
    <div className="signal-evaluator-scene signal-evaluator-item-scene">
      <AnalysisPanel
        title="평가 항목별 경향"
        description="평가 항목별 점수 수준과 다른 평가자 평균 비교"
        isEmpty={data.length === 0}
      >
        <div className="signal-evaluator-item-selector">
          <label htmlFor={taskSelectId}>평가 과제</label>
          <select
            id={taskSelectId}
            onChange={(event) => setRequestedTaskId(event.target.value)}
            value={selectedTaskId}
          >
            {taskOptions.map(([taskId, taskLabel]) => (
              <option key={taskId} value={taskId}>{taskLabel}</option>
            ))}
          </select>
        </div>
        <EvaluatorComparisonChart
          rows={selectedRows.map((row) => ({ id: row.itemId, label: `${row.itemNumber}번`, evaluator: row.evaluatorAverage, peer: row.peerAverage }))}
          label="평가 항목별 평가자 평균과 다른 평가자 평균 비교 막대 차트"
          peerLabel="다른 평가자 평균"
          variant="item"
        />
        <HorizontalScroll className="signal-evaluator-table-scroll" role="region" aria-label="평가 항목별 경향 상세 표, 가로 스크롤" tabIndex={0}>
          <table className="signal-evaluator-evidence-table signal-evaluator-item-table">
            <caption className="sr-only">평가 항목별 응답 수, 평가자 평균, 다른 평가자 평균과 차이</caption>
            <thead>
              <tr>
                <th scope="col">평가 항목</th>
                <th scope="col">응답 수</th>
                <th scope="col">평가자 평균</th>
                <th scope="col">다른 평가자 평균</th>
                <th scope="col">차이</th>
              </tr>
            </thead>
            <tbody>
              {selectedRows.map((row) => (
                <tr key={row.itemId}>
                  <th scope="row">
                    <span className="signal-evaluator-item-name">
                      <span className="signal-evaluator-item-number numeric">{row.itemNumber}<span className="sr-only">.</span></span>
                      <span className="signal-evaluator-item-label">{row.itemLabel}</span>
                    </span>
                  </th>
                  <td className="numeric">{row.responseCount}건</td>
                  <td className="numeric">{row.evaluatorAverage.toFixed(1)}점</td>
                  <td className="numeric">{row.peerAverage === null ? "-" : `${row.peerAverage.toFixed(1)}점`}</td>
                  <td className="numeric">{signed(row.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HorizontalScroll>
      </AnalysisPanel>
    </div>
  )
}
