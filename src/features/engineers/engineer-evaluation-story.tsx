"use client"

import type {
  EngineerEvaluationStoryViewModel,
  EngineerStoryHighlightViewModel,
} from "./engineer-detail.types"

import styles from "./engineer-evaluation-story.module.css"

type BarTone = "own" | "average" | "top"

function formatScore(value: number | null, digits = 1): string {
  return value === null ? "—" : `${value.toFixed(digits)}점`
}

function differenceLabel(highlight: EngineerStoryHighlightViewModel | null): string {
  if (highlight === null) return "평가 점수 없음"
  const difference = highlight.differenceFromAverage
  if (difference === 0) return "전체 평균과 같음"
  return `전체 평균보다 ${Math.abs(difference).toFixed(1)}점 ${difference > 0 ? "높음" : "낮음"}`
}

function chartMaximum(values: readonly (number | null)[]): number {
  return Math.ceil(Math.max(100, ...values.map((value) => value ?? 0)) / 25) * 25
}

function ScoreBar({ value, maximum, tone }: Readonly<{ value: number | null; maximum: number; tone: BarTone }>) {
  return (
    <div className={styles.track} data-story-bar={tone} data-score={value ?? "missing"} aria-hidden="true">
      <span className={styles[tone]} style={{ width: `${Math.max(0, value ?? 0) / maximum * 100}%` }} />
    </div>
  )
}

function ChartAxis({ maximum }: Readonly<{ maximum: number }>) {
  return (
    <div className={styles.axis} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((step) => <span key={step}>{Number((maximum * step / 4).toFixed(2))}</span>)}
    </div>
  )
}

function Legend({ detailed = false }: Readonly<{ detailed?: boolean }>) {
  return (
    <div className={styles.legend} aria-label="차트 범례">
      <span><i className={styles.own} aria-hidden="true" />내 점수</span>
      <span><i className={styles.average} aria-hidden="true" />전체 평균</span>
      {detailed ? <span><i className={styles.top} aria-hidden="true" />상위 25%</span> : null}
    </div>
  )
}

function HighlightMetric({ label, highlight }: Readonly<{
  label: string
  highlight: EngineerStoryHighlightViewModel | null
}>) {
  return (
    <div className={styles.highlight}>
      <dt>{label}</dt>
      <dd>{highlight?.label ?? "분석 대기"}</dd>
      <p>{differenceLabel(highlight)}</p>
    </div>
  )
}

export function EngineerEvaluationStory({ story }: Readonly<{ story: EngineerEvaluationStoryViewModel }>) {
  const profileMaximum = chartMaximum(story.profile.flatMap((point) => [point.score, point.averageScore]))
  const comparisonMaximum = chartMaximum(story.taskComparisons.flatMap((point) => [
    point.ownScore,
    point.sampleSize === 0 ? null : point.averageScore,
    point.sampleSize === 0 ? null : point.topQuartileAverage,
  ]))
  const showProfileBars = story.profile.length >= 3

  return (
    <section aria-labelledby="engineer-story-title" className={styles.root}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>INDIVIDUAL STORY</p>
        <h2 id="engineer-story-title">한 명의 평가 스토리</h2>
        <p className={styles.description}>현재 점수 구성, 시즌 내 위치, 과제별 강점·보완 지점 통합 확인</p>
      </header>

      <dl className={styles.metrics}>
        <div>
          <dt>{story.scoreLabel}</dt>
          <dd>{formatScore(story.score, 2)}</dd>
          <p>{story.scoreLabel === "최종 점수" ? "모든 적용 과제 반영 완료" : "완료된 과제만 우선 반영"}</p>
        </div>
        <div>
          <dt>현재 순위</dt>
          <dd>{story.rank === null ? "—" : `${story.rank}위`}</dd>
          <p>점수 반영 {story.cohortCount}명 기준</p>
        </div>
        <div>
          <dt>상위 백분위</dt>
          <dd>{story.topPercentile === null ? "—" : `상위 ${story.topPercentile.toFixed(1)}%`}</dd>
          <p>현재 시즌 내 상대 위치</p>
        </div>
        <HighlightMetric label="강점 상위 항목" highlight={story.strongestCategory} />
        <HighlightMetric label="보완 필요 항목" highlight={story.improvementCategory} />
      </dl>

      <section aria-labelledby="competency-profile-title" className={styles.profile}>
        <div className={styles.sectionBar}>
          <h3 id="competency-profile-title">개인 역량 프로필</h3>
          <p>과제별 점수와 전체 평균 비교</p>
          <Legend />
        </div>
        {showProfileBars ? null : (
          <p className={styles.fallback}>확정 과제 3개 이상부터 역량 프로필 표시</p>
        )}
        {story.profile.length === 0 ? (
          <p className={styles.empty}>비교할 확정 점수가 없습니다.</p>
        ) : (
          <div className={styles.profileContent}>
            <p className="sr-only">개인 역량 프로필의 공통 점수 축은 0점부터 {profileMaximum}점입니다.</p>
            <div className={styles.profileColumns} aria-hidden="true">
              <span>평가 분야</span>
              {showProfileBars ? <ChartAxis maximum={profileMaximum} /> : <span />}
              <span>내 점수</span><span>전체 평균</span>
            </div>
            <ul className={styles.profileRows} aria-label="개인 역량 프로필 수치">
              {story.profile.map((point) => (
                <li className={styles.profileRow} key={point.key}>
                  <h4>{point.label}</h4>
                  <div className={styles.profileBars}>
                    {showProfileBars ? <><ScoreBar value={point.score} maximum={profileMaximum} tone="own" /><ScoreBar value={point.averageScore} maximum={profileMaximum} tone="average" /></> : null}
                  </div>
                  <dl className={styles.profileValues}>
                    <div><dt>내 점수</dt><dd>{formatScore(point.score)}</dd></div>
                    <div><dt>전체 평균</dt><dd>{formatScore(point.averageScore)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className={styles.profileNote}>왼쪽부터 과제명, 내 점수, 전체 평균입니다.</p>
      </section>

      <section aria-labelledby="task-comparison-title" className={styles.comparisons}>
        <header className={styles.comparisonHeading}>
          <div><h3 id="task-comparison-title">과제별 상세 비교</h3><p>개인 점수·전체 평균·상위 25% 평균 비교</p></div>
          <Legend detailed />
        </header>
        <p className="sr-only">과제별 상세 비교의 공통 점수 축은 0점부터 {comparisonMaximum}점입니다. 상위 25%는 상위 사분위 집단의 평균 점수입니다.</p>
        {story.taskComparisons.length === 0 ? <p className={styles.empty}>비교할 평가 분야가 없습니다.</p> : (
          <div className={styles.comparisonContent}>
            <div className={styles.comparisonColumns} aria-hidden="true">
              <span>과제명</span><ChartAxis maximum={comparisonMaximum} /><span>내 점수</span><span>전체 평균</span><span>상위 25%</span>
            </div>
            {story.taskComparisons.map((comparison) => (
              <article className={styles.comparisonRow} key={comparison.key} aria-label={`${comparison.label} 상세 비교`}>
                <div className={styles.taskLabel}><h4>{comparison.label}</h4><p>확정 {comparison.sampleSize}명</p></div>
                <div className={styles.comparisonBars}>
                  <ScoreBar value={comparison.ownScore} maximum={comparisonMaximum} tone="own" />
                  <ScoreBar value={comparison.sampleSize === 0 ? null : comparison.averageScore} maximum={comparisonMaximum} tone="average" />
                  <ScoreBar value={comparison.sampleSize === 0 ? null : comparison.topQuartileAverage} maximum={comparisonMaximum} tone="top" />
                </div>
                <dl className={styles.comparisonValues}>
                  <div><dt>내 점수</dt><dd>{formatScore(comparison.ownScore)}</dd></div>
                  <div><dt>전체 평균</dt><dd>{formatScore(comparison.sampleSize === 0 ? null : comparison.averageScore)}</dd></div>
                  <div><dt>상위 25%</dt><dd>{formatScore(comparison.sampleSize === 0 ? null : comparison.topQuartileAverage)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
