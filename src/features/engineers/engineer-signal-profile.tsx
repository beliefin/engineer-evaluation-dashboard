import type { CSSProperties } from "react"

import type { EngineerEvaluationStoryViewModel } from "./engineer-detail.types"

function scoreLabel(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })
}

function ComparisonBar({ value, maximum, kind }: Readonly<{ value: number | null; maximum: number; kind: "own" | "average" }>) {
  const width = value === null ? 0 : Math.max(0, (value / maximum) * 100)
  return (
    <div className={`signal-engineer-profile-track is-${kind}`}>
      <div className="signal-engineer-profile-fill" style={{ width: `${width}%` }} />
      <span className="numeric signal-engineer-profile-value" style={{ left: `${width}%` }}>{scoreLabel(value)}</span>
    </div>
  )
}

export function EngineerSignalProfile({ story }: Readonly<{ story: EngineerEvaluationStoryViewModel }>) {
  const points = story.taskComparisons
  const maximumScore = Math.max(100, ...points.flatMap((point) => [point.ownScore ?? 0, point.sampleSize === 0 ? 0 : point.averageScore]))
  const maximum = Math.ceil(maximumScore / 20) * 20
  const tickCount = Math.min(8, maximum / 20)
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => ({
    value: Math.round((maximum * index) / tickCount),
    percentage: (100 * index) / tickCount,
  }))

  return (
    <section aria-labelledby="signal-competency-profile-title" className="signal-engineer-profile-panel">
      <div className="signal-engineer-section-bar signal-engineer-profile-heading">
        <h2 id="signal-competency-profile-title">개인 역량 프로필</h2>
        <div className="signal-engineer-profile-legend" aria-label="차트 범례">
          <span><i className="is-own" aria-hidden="true" />내 점수</span>
          <span><i className="is-average" aria-hidden="true" />전체 평균</span>
        </div>
      </div>
      <div className="signal-engineer-profile-body">
        {points.length === 0 ? <p className="signal-engineer-empty">비교할 평가 분야가 없습니다.</p> : (
          <>
            <div className="signal-engineer-profile-chart" aria-hidden="true" style={{ "--signal-profile-ticks": tickCount } as CSSProperties}>
              <div className="signal-engineer-profile-axis"><div>{ticks.map((tick) => <span key={tick.value} style={{ left: `${tick.percentage}%` }}>{tick.value}</span>)}</div></div>
              {points.map((point) => (
                <div className="signal-engineer-profile-row" key={point.key}>
                  <span className="signal-engineer-profile-label">{point.label}</span>
                  <div className="signal-engineer-profile-bars">
                    <div className="signal-engineer-profile-grid">{ticks.map((tick) => <span key={tick.value} style={{ left: `${tick.percentage}%` }} />)}</div>
                    <ComparisonBar value={point.ownScore} maximum={maximum} kind="own" />
                    <ComparisonBar value={point.sampleSize === 0 ? null : point.averageScore} maximum={maximum} kind="average" />
                  </div>
                </div>
              ))}
            </div>
            <div className="sr-only"><table>
              <caption>개인 역량 프로필. 내 점수와 전체 평균의 공통 점수 축은 0점부터 {maximum}점입니다.</caption>
              <thead><tr><th scope="col">평가 분야</th><th scope="col">내 점수</th><th scope="col">전체 평균</th><th scope="col">평균 산출 인원</th></tr></thead>
              <tbody>{points.map((point) => <tr key={point.key}><th scope="row">{point.label}</th><td>{point.ownScore === null ? "미확정" : `${scoreLabel(point.ownScore)}점`}</td><td>{point.sampleSize === 0 ? "확정 점수 없음" : `${scoreLabel(point.averageScore)}점`}</td><td>{point.sampleSize}명</td></tr>)}</tbody>
            </table></div>
          </>
        )}
      </div>
    </section>
  )
}
