import { cn } from "@/lib/utils"

import { AnalysisPanel } from "./analysis-panel"
import { formatCount, formatDecimal, formatScore } from "./format"
import type { AnalysisChartProps, TeamTaskPerformanceDatum } from "./types"

function deltaClass(delta: number): string {
  if (delta >= 4) return "bg-accent text-primary"
  if (delta <= -4) return "bg-warning-soft text-warning"
  return "bg-muted text-foreground"
}

function deltaLabel(delta: number): string {
  if (delta >= 1) return `↑ +${formatDecimal(delta)}`
  if (delta <= -1) return `↓ ${formatDecimal(delta)}`
  return `≈ ${formatDecimal(delta)}`
}

function performanceValue(value: number, metric: TeamTaskPerformanceDatum["metric"]): string {
  return metric === "pass-rate" ? `${formatDecimal(value)}%` : formatScore(value)
}

function performanceDelta(delta: number, metric: TeamTaskPerformanceDatum["metric"]): string {
  return `${deltaLabel(delta)}${metric === "pass-rate" ? "%p" : "점"}`
}

export function TeamTaskPerformanceMatrix({
  data,
  isLoading = false,
}: AnalysisChartProps<TeamTaskPerformanceDatum>) {
  const tasks = Array.from(
    new Map(data.map((entry) => [entry.taskId, {
      taskId: entry.taskId,
      taskLabel: entry.taskLabel,
      metric: entry.metric,
      overallScore: entry.overallScore,
    }])).values(),
  )
  const teams = Array.from(
    new Map(data.map((entry) => [entry.teamId, {
      teamId: entry.teamId,
      teamLabel: entry.teamLabel,
    }])).values(),
  )

  return (
    <AnalysisPanel
      title="팀별 과제 성과 매트릭스"
      description={"각 팀의 점수 평균과 P/F 통과율을 시즌\u00A0전체\u00A0성과와 비교합니다."}
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        ↔ 좌우로 스크롤해 모든 과제 보기
      </p>
      <div
        className="scrollbar-thin overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        role="region"
        aria-label="팀별 과제 성과표 가로 스크롤 영역"
        tabIndex={0}
      >
        <table className="w-full min-w-max border-separate border-spacing-1" aria-describedby="team-matrix-key">
          <caption className="sr-only">
            팀과 과제별 평균 점수, 시즌 전체 평균 대비 편차, 확정 인원
          </caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-28 bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                팀
              </th>
              {tasks.map((task) => (
                <th key={task.taskId} className="min-w-36 px-3 py-2 text-left align-bottom">
                  <span className="block max-w-40 text-pretty text-xs font-semibold text-foreground">
                    {task.taskLabel}
                  </span>
                  <span className="numeric mt-1 block text-xs font-normal text-muted-foreground">
                    전체 {performanceValue(task.overallScore, task.metric)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.teamId}>
                <th className="sticky left-0 z-10 bg-card px-3 py-3 text-left text-sm font-semibold text-foreground">
                  {team.teamLabel}
                </th>
                {tasks.map((task) => {
                  const cell = data.find((entry) => (
                    entry.teamId === team.teamId && entry.taskId === task.taskId
                  ))
                  if (cell === undefined) {
                    return (
                      <td key={task.taskId} className="rounded-md bg-muted px-3 py-3 text-center text-xs text-muted-foreground">
                        데이터 없음
                      </td>
                    )
                  }
                  return (
                    <td
                      key={task.taskId}
                      className={cn("rounded-md px-3 py-3 align-top", deltaClass(cell.delta))}
                    >
                      <span className="numeric block text-base font-semibold">
                        {performanceValue(cell.score, cell.metric)}
                      </span>
                      <span className="numeric mt-1 block text-xs font-medium">
                        {performanceDelta(cell.delta, cell.metric)}
                      </span>
                      <span className="mt-1 block text-xs opacity-80">
                        {formatCount(cell.completedCount, "명")} 확정
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p id="team-matrix-key" className="mt-3 text-xs text-muted-foreground">
        ↑ 시즌 전체보다 높음 · ≈ 점수 1점 또는 통과율 1%p 미만 차이 · ↓ 시즌 전체보다 낮음
      </p>
    </AnalysisPanel>
  )
}
