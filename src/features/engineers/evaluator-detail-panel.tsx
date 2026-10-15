import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { isSupabaseConfigured } from "@/backend/supabase-client"

import { DetailStatusBadge } from "./detail-status-badge"
import type { EvaluatorScoreViewModel } from "./engineer-detail.types"
import styles from "./evaluator-detail-signal.module.css"

interface EvaluatorDetailPanelProps {
  readonly evaluatorScores: readonly EvaluatorScoreViewModel[]
}

function formatScore(score: number | null) {
  return score === null ? "—" : score.toFixed(1)
}

export function EvaluatorDetailPanel({
  evaluatorScores,
}: EvaluatorDetailPanelProps) {
  return (
    <section aria-labelledby="evaluator-detail-title" className={styles.panel}>
      <h2 className={styles.heading} id="evaluator-detail-title">평가자별 상세</h2>
      <div className={styles.sectionBar}>
        <p className={styles.permission}>상세 열람 권한 · {isSupabaseConfigured() ? "운영 데이터" : "샘플 데이터"}</p>
        <p className={styles.explanation}>
          설정 가중치는 양수 원값이며, 실제 반영 비율은 평가 분야별 합계로 정규화한 값입니다.
        </p>
      </div>

      {evaluatorScores.length === 0 ? (
        <p className={styles.empty}>등록된 평가자 배정 내역이 없습니다.</p>
      ) : (
        <>
          <ul className={styles.scoreCards} aria-label="평가자별 상세 목록">
            {evaluatorScores.map((score) => (
              <li key={score.id}>
                <div className={styles.cardHeading}>
                  <div>
                    <h3>{score.evaluatorName}</h3>
                    <p>{score.categoryLabel}</p>
                  </div>
                  <DetailStatusBadge className={styles.status ?? ""} status={score.status} />
                </div>
                <dl>
                  <div><dt>원점수</dt><dd>{formatScore(score.rawScore)}</dd></div>
                  <div><dt>설정 가중치</dt><dd>{score.configuredWeight.toFixed(2)}</dd></div>
                  <div><dt>실제 반영 비율</dt><dd>{score.normalizedRatioPercent.toFixed(1)}%</dd></div>
                </dl>
              </li>
            ))}
          </ul>
          <HorizontalScroll aria-label="평가자별 상세 표, 가로로 스크롤 가능" className={styles.tableScroll} role="region" tabIndex={0}>
            <table className={styles.scoreTable}>
              <caption className="sr-only">평가자별 원점수, 설정 가중치, 실제 반영 비율과 제출 상태</caption>
              <thead>
                <tr>
                  <th scope="col">평가자</th>
                  <th scope="col">평가 분야</th>
                  <th scope="col">원점수</th>
                  <th scope="col">설정 가중치</th>
                  <th scope="col">실제 반영 비율</th>
                  <th scope="col">제출 상태</th>
                </tr>
              </thead>
              <tbody>
                {evaluatorScores.map((score) => (
                  <tr key={score.id}>
                    <td>{score.evaluatorName}</td>
                    <td>{score.categoryLabel}</td>
                    <td>{formatScore(score.rawScore)}</td>
                    <td>{score.configuredWeight.toFixed(2)}</td>
                    <td>{score.normalizedRatioPercent.toFixed(1)}%</td>
                    <td><DetailStatusBadge className={styles.status ?? ""} status={score.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </HorizontalScroll>
        </>
      )}
    </section>
  )
}
