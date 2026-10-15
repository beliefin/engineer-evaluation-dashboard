import type {
  EngineerEvaluationStoryViewModel,
  EngineerFinalResultViewModel,
  EngineerIdentityViewModel,
} from "./engineer-detail.types"

interface EngineerSummaryProps {
  readonly engineer: EngineerIdentityViewModel
  readonly result: EngineerFinalResultViewModel
  readonly story: EngineerEvaluationStoryViewModel
  readonly contextLabel?: string | undefined
}

function scoreLabel(value: number): string {
  return value.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

export function EngineerSummary({ engineer, result, story, contextLabel = "엔지니어 상세" }: EngineerSummaryProps) {
  return (
    <section aria-labelledby="engineer-detail-title" className="signal-engineer-summary">
      <div className="signal-engineer-heading-row">
        <h1 id="engineer-detail-title" className="signal-engineer-title">{contextLabel}</h1>
        <dl className="signal-engineer-identity">
          <div><dt>엔지니어</dt><dd>{engineer.displayName}</dd></div>
          <div><dt>사번</dt><dd className="numeric">{engineer.engineerCode}</dd></div>
          <div><dt>소속</dt><dd>{engineer.teamName}</dd></div>
          <div><dt>평가 연도</dt><dd>{engineer.seasonLabel}</dd></div>
        </dl>
      </div>

      <dl className="signal-engineer-metrics">
        <div>
          <dt>총점</dt>
          <dd className={`numeric signal-engineer-metric-value${result.status === "complete" ? "" : " signal-engineer-metric-pending"}`}>
            {result.status === "complete" ? scoreLabel(result.finalScore) : "미확정"}
            {result.status === "complete" || story.score === null ? null : (
              <span className="signal-engineer-metric-note">현재 반영 <span className="numeric">{scoreLabel(story.score)}</span>점</span>
            )}
          </dd>
        </div>
        <div>
          <dt>순위</dt>
          <dd className="numeric signal-engineer-metric-value">
            {story.rank === null ? "—" : <>{story.rank}<span className="signal-engineer-metric-denominator">/{story.cohortCount}</span></>}
          </dd>
        </div>
        <div>
          <dt>상위</dt>
          <dd className="numeric signal-engineer-metric-value">
            {story.topPercentile === null ? "—" : <>{story.topPercentile.toFixed(1)}<span className="signal-engineer-percent">%</span></>}
          </dd>
        </div>
        <div>
          <dt>완료</dt>
          <dd className="numeric signal-engineer-metric-value">
            {result.completedCategoryCount}<span className="signal-engineer-metric-denominator">/{result.totalCategoryCount}</span>
          </dd>
        </div>
      </dl>
      {result.status === "complete" ? null : (
        <p className="signal-engineer-summary-note">모든 필수 평가와 직접점수 완료 후 최종 점수가 확정됩니다. 순위와 상위 비율은 현재 반영 점수 기준입니다.</p>
      )}
      {result.adjustmentTotal === 0 && result.adjustments.length === 0 ? null : (
        <details className="signal-engineer-adjustments">
          <summary>
            기본 가중 총점 <span className="numeric">{result.baseScore === null ? "—" : scoreLabel(result.baseScore)}</span>
            {" · "}가·감점 <span className="numeric">{result.adjustmentTotal > 0 ? "+" : ""}{scoreLabel(result.adjustmentTotal)}</span>
            {result.adjustments.length > 0 ? ` · 내역 ${result.adjustments.length}건` : ""}
          </summary>
          <ul>
            {result.adjustments.map((adjustment) => (
              <li key={adjustment.id}>
                <strong className="numeric">{adjustment.amount > 0 ? "+" : ""}{scoreLabel(adjustment.amount)}</strong>
                {" "}{adjustment.reason}
                <span className="signal-engineer-adjustment-date">{adjustment.updatedAtLabel}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
