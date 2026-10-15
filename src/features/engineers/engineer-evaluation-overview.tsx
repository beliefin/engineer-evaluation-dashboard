import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import { Check, ChevronDown } from "lucide-react"

import { isSupabaseConfigured } from "@/backend/supabase-client"
import { EngineerEvaluationStory } from "./engineer-evaluation-story"
import { EngineerSelectedInsights } from "./engineer-selected-insights"
import type { CategoryScoreViewModel, EngineerDetailViewModel, EngineerResultStatus } from "./engineer-detail.types"

import styles from "./engineer-evaluation-overview.module.css"

function statusLabel(status: EngineerResultStatus): string {
  return status === "complete" ? "평가 완료" : status === "in_progress" ? "진행 중" : "미확정"
}

function scoreLabel(score: number | null, digits: number): string {
  return score === null ? "—" : score.toFixed(digits)
}

function CategoryStatus({ status }: Readonly<{ status: EngineerResultStatus }>) {
  return (
    <span className={styles.categoryStatus}>
      <span className={`${styles.statusMark} ${status === "complete" ? styles.complete : ""}`} aria-hidden="true">
        {status === "complete" ? <Check /> : null}
      </span>
      {statusLabel(status)}
    </span>
  )
}

function ScorePosition({ category, maximum }: Readonly<{ category: CategoryScoreViewModel; maximum: number }>) {
  const value = Math.max(0, category.rawScore ?? 0)
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={`${category.label} 원점수 ${scoreLabel(category.rawScore, 1)}점`}
      aria-valuemin={0}
      aria-valuemax={maximum}
      aria-valuenow={category.rawScore === null ? undefined : value}
      aria-valuetext={category.rawScore === null ? "미확정" : `${scoreLabel(category.rawScore, 1)}점`}
    >
      <span style={{ width: `${value / maximum * 100}%` }} />
    </div>
  )
}

function contributionLabel(category: CategoryScoreViewModel): string {
  return `${scoreLabel(category.contribution, 2)} / ${category.maxContribution}`
}

export function EngineerEvaluationOverview({ model, contextLabel = "엔지니어 상세" }: Readonly<{
  model: EngineerDetailViewModel
  contextLabel?: string
}>) {
  const { engineer, result, categories, story } = model
  const scoreMaximum = Math.max(100, ...categories.map((category) => category.rawScore ?? 0))
  const completionPercent = Math.min(100, Math.max(0, result.totalCategoryCount === 0
    ? 0 : (result.completedCategoryCount / result.totalCategoryCount) * 100))

  return (
    <div className={styles.root}>
      <section aria-labelledby="engineer-detail-title">
        <div className={styles.headingGrid}>
          <div className={styles.identityBlock}>
            <div className={styles.context}>
              <span>{contextLabel}</span>
              <span className={styles.dataSource}>{isSupabaseConfigured() ? "운영 데이터" : "샘플 데이터"}</span>
              <span className={`${styles.statusBadge} ${result.status === "complete" ? styles.complete : ""}`}>{statusLabel(result.status)}</span>
            </div>
            <h1 id="engineer-detail-title">{engineer.displayName}</h1>
            <dl className={styles.identity}>
              <div><dt>엔지니어 코드</dt><dd>{engineer.engineerCode}</dd></div>
              <div><dt>소속 팀</dt><dd>{engineer.teamName}</dd></div>
              <div><dt>평가 시즌</dt><dd>{engineer.seasonLabel}</dd></div>
            </dl>
          </div>
          <div className={styles.finalScore}>
            <h2>최종 점수</h2>
            <div className={styles.scoreBody}>
              {result.status === "complete" ? (
                <p className={styles.score}><strong>{result.finalScore.toFixed(2)}</strong><span>/ 100</span></p>
              ) : (
                <>
                  <p className={styles.unconfirmed}>미확정</p>
                  {story.score === null ? null : <p className={styles.currentScore}>현재 반영 {story.score.toFixed(2)}점</p>}
                </>
              )}
              <p className={styles.scoreNote}>모든 필수 평가와 직접점수 완료 후 최종 점수 확정</p>
              {result.adjustmentTotal === 0 && result.adjustments.length === 0 ? null : (
                <dl className={styles.adjustmentTotals}>
                  <div><dt>기본 가중 총점</dt><dd>{scoreLabel(result.baseScore, 2)}</dd></div>
                  <div><dt>가·감점 합계</dt><dd>{result.adjustmentTotal > 0 ? "+" : ""}{result.adjustmentTotal.toFixed(2)}</dd></div>
                </dl>
              )}
              {result.adjustments.length === 0 ? null : (
                <details className={styles.adjustments}>
                  <summary>가·감점 내역 {result.adjustments.length}건</summary>
                  <ul>{result.adjustments.map((adjustment) => (
                    <li key={adjustment.id}>
                      <strong>{adjustment.amount > 0 ? "+" : ""}{adjustment.amount.toFixed(2)}</strong>{" "}{adjustment.reason}
                      <span className={styles.adjustmentDate}>{adjustment.updatedAtLabel}</span>
                    </li>
                  ))}</ul>
                </details>
              )}
            </div>
          </div>
        </div>
        <div className={styles.completion}>
          <h2>분야별 평가 완료도</h2>
          <p className={styles.completionCount}>{result.completedCategoryCount} / {result.totalCategoryCount}</p>
          <div className={styles.completionBar}>
            <div
              className={styles.progress}
              role="progressbar"
              aria-label={`과제별 평가 ${result.totalCategoryCount}개 중 ${result.completedCategoryCount}개 완료`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPercent}
            ><span style={{ width: `${completionPercent}%` }} /></div>
            <span>{completionPercent.toFixed(0)}%</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="category-score-title" className={styles.categories}>
        <div className={styles.sectionBar}>
          <h2 id="category-score-title">분야별 점수</h2>
          <p>원점수·반영 비율·환산점수 표시. 미완료 과제는 미확정 처리</p>
        </div>
        {categories.length === 0 ? <p className={styles.empty}>등록된 평가 분야가 없습니다.</p> : (
          <>
            <HorizontalScroll className={styles.tableScroll} tabIndex={0} aria-label="분야별 점수 표, 작은 화면에서 가로 스크롤">
              <table className={styles.scoreTable}>
                <caption className="sr-only">평가 분야별 원점수, 반영 비율, 환산점수, 점수 위치와 진행 상태. 점수 위치의 공통 축은 0점부터 {scoreMaximum}점입니다.</caption>
                <colgroup><col /><col /><col /><col /><col /><col /></colgroup>
                <thead><tr><th scope="col">평가 분야</th><th scope="col">원점수</th><th scope="col">반영 비율</th><th scope="col">환산점수</th><th scope="col">점수 위치{scoreMaximum > 100 ? <span className={styles.scaleNote}>0–{scoreMaximum}점</span> : null}</th><th scope="col">상태</th></tr></thead>
                <tbody>{categories.map((category) => (
                  <tr key={category.key}>
                    <th scope="row">{category.label}</th>
                    <td>{scoreLabel(category.rawScore, 1)}</td>
                    <td>{category.reflectionRatioPercent.toFixed(1)}%</td>
                    <td>{contributionLabel(category)}</td>
                    <td><ScorePosition category={category} maximum={scoreMaximum} /></td>
                    <td><CategoryStatus status={category.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </HorizontalScroll>
            <ul className={styles.categoryCards} aria-label={`분야별 점수 목록${scoreMaximum > 100 ? `, 점수 위치 공통 축 0–${scoreMaximum}점` : ""}`}>
              {categories.map((category) => (
                <li key={category.key}>
                  <div className={styles.categoryHeading}><h3>{category.label}</h3><CategoryStatus status={category.status} /></div>
                  <dl>
                    <div><dt>원점수</dt><dd>{scoreLabel(category.rawScore, 1)}</dd></div>
                    <div><dt>반영 비율</dt><dd>{category.reflectionRatioPercent.toFixed(1)}%</dd></div>
                    <div><dt>환산점수</dt><dd>{contributionLabel(category)}</dd></div>
                  </dl>
                  {scoreMaximum > 100 ? <p className={styles.scaleNote}>점수 위치 · 0–{scoreMaximum}점</p> : null}
                  <ScorePosition category={category} maximum={scoreMaximum} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <EngineerSelectedInsights categories={categories} story={story} />
      <details className={styles.storyDisclosure}>
        <summary>한 명의 평가 스토리<ChevronDown aria-hidden="true" /></summary>
        <div className={styles.storyContent}><EngineerEvaluationStory story={story} /></div>
      </details>
    </div>
  )
}
