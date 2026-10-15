"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import "./evaluator-comparison-signal.css"

import { AlertTriangle, Check, UsersRound } from "lucide-react"
import { useId, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { AnalysisPanel } from "./analysis-panel"
import { formatDecimal, formatScore } from "./format"
import type {
  EvaluatorCalibrationDatum,
  EvaluatorScoreComparisonDatum,
  EvaluatorScoreObservationDatum,
} from "./types"

type EvaluatorScoreComparisonProps = Readonly<{
  comparisons: readonly EvaluatorScoreComparisonDatum[]
  calibrations: readonly EvaluatorCalibrationDatum[]
  outlierThreshold: number
  isLoading?: boolean
}>

type TaskOption = Readonly<{
  id: string
  label: string
}>

function taskOptions(
  comparisons: readonly EvaluatorScoreComparisonDatum[],
): readonly TaskOption[] {
  const options = new Map<string, TaskOption>()
  for (const comparison of comparisons) {
    if (!options.has(comparison.taskId)) {
      options.set(comparison.taskId, {
        id: comparison.taskId,
        label: comparison.taskLabel,
      })
    }
  }
  return Array.from(options.values())
}

function signedScore(value: number): string {
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${formatDecimal(value)}점`
}

function observationLabel(observation: EvaluatorScoreObservationDatum): string {
  return `${observation.evaluatorLabel} ${formatScore(observation.score)}, 평균 대비 ${signedScore(observation.deltaFromConsensus)}`
}

function calibrationLabel(calibration: EvaluatorCalibrationDatum): string {
  if (calibration.meanSignedDelta >= 5) return "높게 평가 경향"
  if (calibration.meanSignedDelta <= -5) return "낮게 평가 경향"
  return "동일 인원 평균과 유사"
}

function sharedEvaluatorLabels(
  comparisons: readonly EvaluatorScoreComparisonDatum[],
): readonly string[] {
  const first = comparisons[0]
  if (first === undefined || comparisons.length < 2) return []
  const sharedIds = new Set(first.observations.map((entry) => entry.evaluatorId))
  for (const comparison of comparisons.slice(1)) {
    const evaluatorIds = new Set(
      comparison.observations.map((entry) => entry.evaluatorId),
    )
    for (const evaluatorId of sharedIds) {
      if (!evaluatorIds.has(evaluatorId)) sharedIds.delete(evaluatorId)
    }
  }
  return first.observations
    .filter((entry) => sharedIds.has(entry.evaluatorId))
    .map((entry) => entry.evaluatorLabel)
}

function ScoreRail({
  comparison,
}: Readonly<{ comparison: EvaluatorScoreComparisonDatum }>) {

  return (
    <div>
      <div
        aria-label={`${comparison.engineerLabel} 평가자 원점수 범위 ${formatScore(comparison.minimumScore)}부터 ${formatScore(comparison.maximumScore)}`}
        className="signal-comparison-rail relative h-8 rounded-sm border border-border-subtle bg-muted/60" data-minimum={comparison.minimumScore} data-maximum={comparison.maximumScore}
        role="img"
      >
        <span
          aria-hidden="true"
          className="signal-comparison-range absolute top-1/2 h-0.5 -translate-y-1/2 bg-primary/55"
          style={{
            left: `${comparison.minimumScore}%`,
            width: `${comparison.scoreRange}%`,
          }}
        />
        <span
          aria-hidden="true"
          className="signal-comparison-consensus absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-sm" data-score={comparison.consensusScore}
          style={{ left: `${comparison.consensusScore}%` }}
        />
        {comparison.observations.map((observation) => (
          <span
            key={observation.evaluatorId}
            aria-label={observationLabel(observation)}
            data-observation-score={observation.score}
            data-outlier={observation.isOutlier}
            className={
              observation.isOutlier
                ? "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warning bg-card shadow-sm"
                : "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-card"
            }
            role="img"
            style={{ left: `${observation.score}%` }}
          />
        ))}
      </div>
      <div className="signal-comparison-axis" aria-hidden="true">
        {[0, 20, 40, 60, 80, 100].map((tick) => <span key={tick} style={{ left: `${tick}%` }}>{tick}</span>)}
      </div>
      <div className="signal-comparison-rail-caption mt-2 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span aria-hidden="true" className="size-2 rounded-full border-2 border-primary bg-card" />
          합의 평균 {formatScore(comparison.consensusScore)}
        </span>
        <span className="text-xs text-muted-foreground">
          범위 {formatScore(comparison.scoreRange)}
        </span>
      </div>
    </div>
  )
}

function ObservationList({
  observations,
}: Readonly<{ observations: readonly EvaluatorScoreObservationDatum[] }>) {
  return (
    <HorizontalScroll className="signal-comparison-observation-scroll" role="region" aria-label="평가자 원점수 표 가로 스크롤 영역" tabIndex={0}>
      <table className="signal-comparison-observations">
        <caption className="sr-only">평가자 원점수와 합의 평균 대비 편차</caption>
        <thead><tr><th scope="col">평가자</th><th scope="col">원점수</th><th scope="col">평균 대비</th></tr></thead>
        <tbody>
          {observations.map((observation) => (
            <tr key={observation.evaluatorId} data-outlier={observation.isOutlier}>
              <th scope="row">{observation.evaluatorLabel}</th>
              <td className="numeric">{formatScore(observation.score)}</td>
              <td className="numeric">{signedScore(observation.deltaFromConsensus)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </HorizontalScroll>
  )
}

function CalibrationCard({
  calibration,
}: Readonly<{ calibration: EvaluatorCalibrationDatum }>) {
  const isMarked = Math.abs(calibration.meanSignedDelta) >= 5

  return (
    <li
      data-calibration-marked={isMarked}
      className={
        isMarked
          ? "border border-warning/35 bg-warning-soft px-3 py-3"
          : "border border-border-subtle bg-background px-3 py-3"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{calibration.evaluatorLabel}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            비교 가능 평가 {calibration.comparisonCount}건
          </p>
        </div>
        <span className={isMarked ? "text-xs font-semibold text-warning" : "text-xs text-muted-foreground"}>
          {calibrationLabel(calibration)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">평균 원점수</dt>
          <dd className="numeric mt-0.5 font-semibold">{formatScore(calibration.averageScore)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">평균 대비</dt>
          <dd className={isMarked ? "numeric mt-0.5 font-semibold text-warning" : "numeric mt-0.5 font-semibold"}>
            {signedScore(calibration.meanSignedDelta)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">이상치</dt>
          <dd className="numeric mt-0.5 font-semibold">{calibration.outlierCount}건</dd>
        </div>
      </dl>
    </li>
  )
}

export function EvaluatorScoreComparison({
  comparisons,
  calibrations,
  outlierThreshold,
  isLoading = false,
}: EvaluatorScoreComparisonProps) {
  const id = useId()
  const tasks = useMemo(() => taskOptions(comparisons), [comparisons])
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "")

  const taskComparisons = useMemo(
    () => comparisons.filter((comparison) => comparison.taskId === selectedTaskId),
    [comparisons, selectedTaskId],
  )
  const engineerIds = useMemo(
    () => taskComparisons.map((comparison) => comparison.engineerId),
    [taskComparisons],
  )
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<readonly string[]>([])

  const selectedIdSet = new Set(selectedEngineerIds)
  const selectedComparisons = taskComparisons.filter((comparison) =>
    selectedIdSet.has(comparison.engineerId),
  )
  const taskCalibrations = calibrations
    .filter((calibration) => calibration.taskId === selectedTaskId)
    .toSorted((left, right) =>
      Math.abs(right.meanSignedDelta) - Math.abs(left.meanSignedDelta),
    )
  const sharedEvaluators = sharedEvaluatorLabels(selectedComparisons)
  const flaggedComparisons = selectedComparisons
    .filter((comparison) => comparison.outlierCount > 0)
    .toSorted((left, right) => right.scoreRange - left.scoreRange)

  function toggleEngineer(engineerId: string) {
    setSelectedEngineerIds((current) =>
      current.includes(engineerId)
        ? current.filter((entry) => entry !== engineerId)
        : [...current, engineerId],
    )
  }

  function selectTask(taskId: string) {
    setSelectedTaskId(taskId)
    setSelectedEngineerIds([])
  }

  return (
    <div className="signal-comparison">
    <AnalysisPanel
      title="개인별 평가자 점수 비교"
      description={`같은 엔지니어·같은 과제에서 제출된 평가자 원점수와 합의 평균을 함께 확인합니다. 평균 대비 ±${formatDecimal(outlierThreshold)}점 이상은 검토 신호로 표시합니다.`}
      isEmpty={comparisons.length === 0}
      isLoading={isLoading}
    >
      <div className="space-y-5">
        <div className="signal-comparison-controls grid gap-3 border-b border-border-subtle pb-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-1.5">
            <label htmlFor={`${id}-task`} className="text-xs font-medium text-muted-foreground">
              비교할 평가 과제
            </label>
            <Select value={selectedTaskId} onValueChange={selectTask}>
              <SelectTrigger id={`${id}-task`} className="w-full bg-card lg:max-w-sm">
                <SelectValue placeholder="평가 과제를 선택하세요" />
              </SelectTrigger>
              <SelectContent className="signal-comparison-popup">
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            선택 {selectedComparisons.length}명 · 제출 점수 {selectedComparisons.reduce((total, comparison) => total + comparison.submittedCount, 0)}건
          </p>
        </div>

        <div className="signal-comparison-workspace grid min-w-0 gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <section aria-labelledby={`${id}-engineer-heading`} className="signal-comparison-roster border border-border-subtle bg-muted/35">
            <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-3">
              <div>
                <h3 id={`${id}-engineer-heading`} className="text-sm font-semibold">비교 대상</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">체크를 바꾸면 오른쪽 비교가 즉시 갱신됩니다.</p>
              </div>
            </div>
            <div className="flex gap-2 border-b border-border-subtle px-3 py-2">
              <Button size="sm" type="button" variant="outline" onClick={() => setSelectedEngineerIds(engineerIds)}>
                전체 선택
              </Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setSelectedEngineerIds([])}>
                전체 해제
              </Button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2" aria-label="비교 대상 엔지니어">
              {taskComparisons.map((comparison) => {
                const checked = selectedIdSet.has(comparison.engineerId)
                return (
                  <li key={comparison.engineerId} className="border-b border-border-subtle last:border-b-0">
                    <label className="flex cursor-pointer items-start gap-2 px-2 py-2.5 text-sm hover:bg-background" data-selected={checked}>
                      <input
                        aria-label={`${comparison.engineerLabel} 선택`}
                        checked={checked}
                        className="mt-0.5 size-4 accent-primary"
                        onChange={() => toggleEngineer(comparison.engineerId)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{comparison.engineerLabel}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {comparison.teamLabel} · {formatScore(comparison.consensusScore)}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby={`${id}-comparison-heading`} className="signal-comparison-results min-w-0">
            <div className="signal-comparison-results-heading flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 id={`${id}-comparison-heading`} className="text-sm font-semibold">선택 인원 원점수 비교</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  선은 평가자 점수 범위, 중심 점은 합의 평균입니다.
                </p>
              </div>
              {selectedComparisons.length > 1 ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UsersRound aria-hidden="true" className="size-3.5" />
                  공통 평가자 {sharedEvaluators.length}명
                </span>
              ) : null}
            </div>

            {selectedComparisons.length === 0 ? (
              <div className="mt-3 border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                비교할 엔지니어를 하나 이상 선택해 주세요.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {selectedComparisons.map((comparison) => (
                  <article key={comparison.engineerId} className="signal-comparison-card border border-border-subtle bg-background p-3 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{comparison.engineerLabel}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {comparison.teamLabel} · 평가자 {comparison.submittedCount}명
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {comparison.outlierCount > 0 ? (
                          <span className="inline-flex items-center gap-1 border border-warning/35 bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
                            <AlertTriangle aria-hidden="true" className="size-3" />
                            이상 편차 {comparison.outlierCount}건
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 border border-success/30 bg-success-soft px-2 py-1 text-xs font-medium text-success">
                            <Check aria-hidden="true" className="size-3" />
                            이상 편차 없음
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <ScoreRail comparison={comparison} />
                    </div>
                    <div className="mt-3">
                      <ObservationList observations={comparison.observations} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedComparisons.length > 1 ? (
          <section className="signal-comparison-explanation border-l-2 border-primary bg-muted/35 px-3 py-3" aria-label="비교 해석 안내">
            {sharedEvaluators.length === 0 ? (
              <p className="text-sm leading-6 text-foreground">
                선택 인원 사이에 공통 평가자가 없습니다. 점수 차이에는 발표 품질뿐 아니라 평가자 구성 차이가 함께 반영될 수 있으므로, 아래 평가자 보정 진단을 같이 확인해 주세요.
              </p>
            ) : (
              <p className="text-sm leading-6 text-foreground">
                공통 평가자: {sharedEvaluators.join(", ")}. 공통 평가자의 점수도 함께 보며 인원별 점수 차이를 해석할 수 있습니다.
              </p>
            )}
          </section>
        ) : null}

        <section aria-labelledby={`${id}-calibration-heading`} className="signal-comparison-calibration border-t border-border-subtle pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id={`${id}-calibration-heading`} className="text-sm font-semibold">평가자 보정 진단</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                같은 엔지니어를 둘 이상이 평가한 경우만 사용합니다. 평균 대비 ±5점 이상은 평가 경향 검토 신호이며, 확정 판정은 아닙니다.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">개별 이상치 기준 ±{formatDecimal(outlierThreshold)}점</span>
          </div>
          {taskCalibrations.length === 0 ? (
            <p className="mt-3 border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
              동일 인원을 두 명 이상이 제출 평가한 데이터가 아직 없습니다.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {taskCalibrations.map((calibration) => (
                <CalibrationCard key={calibration.evaluatorId} calibration={calibration} />
              ))}
            </ul>
          )}
        </section>

        {flaggedComparisons.length > 0 ? (
          <section className="border border-warning/35 bg-warning-soft p-3" aria-labelledby={`${id}-review-heading`}>
            <div className="flex items-start gap-2">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <h3 id={`${id}-review-heading`} className="text-sm font-semibold text-warning">추가 검토 우선 대상</h3>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  {flaggedComparisons.slice(0, 3).map((comparison) => `${comparison.engineerLabel} (${formatScore(comparison.scoreRange)} 범위)`).join(", ")}
                  {flaggedComparisons.length > 3 ? ` 외 ${flaggedComparisons.length - 3}명` : ""}에서 평가자 간 편차가 확인됐습니다. 발표 자료, 평가 기준 해석, 평가자 구성 차이를 함께 확인해 주세요.
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </AnalysisPanel>
    </div>
  )
}
