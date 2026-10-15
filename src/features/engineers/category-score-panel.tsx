import type { CategoryScoreViewModel, EngineerFinalResultViewModel, EngineerResultStatus } from "./engineer-detail.types"

interface CategoryScorePanelProps {
  readonly categories: readonly CategoryScoreViewModel[]
  readonly result: EngineerFinalResultViewModel
}

function formatScore(value: number | null, minimumFractionDigits = 0): string {
  return value === null ? "—" : value.toLocaleString("ko-KR", { minimumFractionDigits, maximumFractionDigits: 2 })
}

function statusLabel(status: EngineerResultStatus): string {
  return status === "complete" ? "평가 완료" : status === "in_progress" ? "진행 중" : "미확정"
}

export function CategoryScorePanel({ categories, result }: CategoryScorePanelProps) {
  const totalRatio = categories.reduce((sum, category) => sum + category.reflectionRatioPercent, 0)

  return (
    <section aria-labelledby="category-score-title" className="signal-engineer-category-panel">
      <div className="signal-engineer-section-bar">
        <h2 id="category-score-title">분야별 점수</h2>
      </div>
      <div className="signal-engineer-table-scroll" tabIndex={0} aria-label="분야별 점수 표, 작은 화면에서 가로 스크롤">
        <table className="signal-engineer-score-table">
          <caption className="sr-only">평가 분야별 원점수, 반영 비율, 환산 점수와 진행 상태. 미완료 분야의 점수는 미확정입니다.</caption>
          <colgroup><col /><col /><col /><col /><col /></colgroup>
          <thead>
            <tr><th scope="col">평가 분야</th><th scope="col">원점수</th><th scope="col">반영 비율</th><th scope="col">환산 점수</th><th scope="col">상태</th></tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} className="signal-engineer-empty">등록된 평가 분야가 없습니다.</td></tr>
            ) : categories.map((category) => (
              <tr key={category.key}>
                <th scope="row">{category.label}</th>
                <td className="numeric">{formatScore(category.rawScore)}</td>
                <td className="numeric">{formatScore(category.reflectionRatioPercent)}%</td>
                <td className="numeric">{formatScore(category.contribution, 1)}</td>
                <td><span className="signal-engineer-status"><span className={`signal-engineer-status-mark${category.status === "complete" ? " is-complete" : ""}`} aria-hidden="true" />{statusLabel(category.status)}</span></td>
              </tr>
            ))}
          </tbody>
          {categories.length === 0 ? null : (
            <tfoot>
              <tr><th scope="row">합계</th><td>—</td><td className="numeric">{formatScore(totalRatio)}%</td><td className="numeric">{formatScore(result.baseScore, 1)}</td><td>{result.status === "complete" ? "—" : "미확정"}</td></tr>
              {result.adjustmentTotal === 0 ? null : (
                <tr className="signal-engineer-adjustment-row"><th scope="row">가·감점 포함 총점</th><td colSpan={2}>가·감점 {result.adjustmentTotal > 0 ? "+" : ""}{formatScore(result.adjustmentTotal, 1)}</td><td className="numeric">{formatScore(result.finalScore, 1)}</td><td>{result.status === "complete" ? "확정" : "미확정"}</td></tr>
              )}
            </tfoot>
          )}
        </table>
      </div>
    </section>
  )
}
