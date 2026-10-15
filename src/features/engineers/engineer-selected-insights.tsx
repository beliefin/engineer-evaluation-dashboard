import type { CSSProperties } from "react"

import type { CategoryScoreViewModel, EngineerEvaluationStoryViewModel } from "./engineer-detail.types"

import styles from "./engineer-selected-insights.module.css"

const roundToOne = (value: number): number => Math.round(value * 10) / 10

function score(value: number | null): string {
  return value === null ? "미확정" : `${value.toFixed(1)}점`
}

function radarPoint(index: number, count: number, radius: number): Readonly<{ x: number; y: number }> {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index / count)
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius }
}

function RadarProfile({ story }: Readonly<{ story: EngineerEvaluationStoryViewModel }>) {
  const points = story.profile
  const maximum = Math.ceil(Math.max(100, ...points.flatMap((point) => [point.score, point.averageScore])) / 20) * 20
  if (points.length < 3) {
    return <p className={styles.empty}>확정된 분야가 3개 이상일 때 개인 역량 프로필을 표시합니다.</p>
  }
  const grid = [1, 2, 3, 4].map((step) => (
    points.map((_, index) => {
      const point = radarPoint(index, points.length, step * 8)
      return `${point.x},${point.y}`
    }).join(" ")
  ))
  const polygon = (values: readonly number[]) => values.map((value, index) => {
    const point = radarPoint(index, points.length, Math.max(0, value) / maximum * 32)
    return `${point.x},${point.y}`
  }).join(" ")
  return (
    <div className={styles.radarLayout}>
      <div className={styles.radarGraphic} role="img" aria-label={`개인 역량 프로필. 점수 범위는 0점부터 ${maximum}점이며, 노랑은 내 점수, 회색은 동일 과제 완료자의 평균 점수입니다.`}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {grid.map((pointsString, index) => <polygon key={index} points={pointsString} className={styles.radarGrid} />)}
          {points.map((_, index) => {
            const end = radarPoint(index, points.length, 32)
            return <line key={index} x1="50" y1="50" x2={end.x} y2={end.y} className={styles.radarAxis} />
          })}
          <polygon points={polygon(points.map((point) => point.averageScore))} className={styles.radarAverage} />
          <polygon points={polygon(points.map((point) => point.score))} className={styles.radarOwn} />
        </svg>
        {points.map((point, index) => {
          const position = radarPoint(index, points.length, 43)
          return <span key={point.key} style={{ "--insight-x": `${position.x}%`, "--insight-y": `${position.y}%` } as CSSProperties}>{point.label}</span>
        })}
      </div>
      <dl className={styles.radarValues}>
        {points.map((point) => <div key={point.key}><dt>{point.label}</dt><dd>내 {score(point.score)} · 평균 {score(point.averageScore)}</dd></div>)}
      </dl>
    </div>
  )
}

function Contribution({ category }: Readonly<{ category: CategoryScoreViewModel }>) {
  const applied = category.status === "complete" && category.contribution !== null
  const width = applied && category.maxContribution > 0
    ? Math.min(100, Math.max(0, category.contribution / category.maxContribution * 100))
    : 0
  return (
    <li>
      <div className={styles.rowHeading}><h4>{category.label}</h4><span>{applied ? `${category.contribution.toFixed(2)} / ${category.maxContribution.toFixed(2)}점` : "미확정 · 산식 반영 전"}</span></div>
      <div className={styles.contributionTrack} aria-hidden="true"><span style={{ width: `${width}%` }} /></div>
      <p>{applied ? `실제 적용 가중치 ${category.reflectionRatioPercent.toFixed(1)}%에 따른 현재 기여도` : `적용 가중치 ${category.reflectionRatioPercent.toFixed(1)}%; 미평가를 0점으로 계산하지 않음`}</p>
    </li>
  )
}

function Difference({ point }: Readonly<{ point: EngineerEvaluationStoryViewModel["taskComparisons"][number] }>) {
  const available = point.ownScore !== null && point.sampleSize > 0
  const difference = available ? roundToOne(point.ownScore - point.averageScore) : null
  return (
    <li>
      <div className={styles.rowHeading}><h4>{point.label}</h4><span>{difference === null ? "비교 불가" : `${difference > 0 ? "+" : ""}${difference.toFixed(1)}점`}</span></div>
      <p>{available ? `내 ${score(point.ownScore)} · 평균 ${score(point.averageScore)}` : "내 점수 또는 비교 가능한 확정 점수가 없어 차이를 계산하지 않음"}</p>
      <small>동일 시즌 · 동일 과제 · 동일 평가 방식의 확정 점수 {point.sampleSize}명 기준{point.ownScore !== null ? " (본인 포함)" : ""}</small>
    </li>
  )
}

function Distribution({ point }: Readonly<{ point: EngineerEvaluationStoryViewModel["taskComparisons"][number] }>) {
  const distribution = point.distribution
  if (distribution === null) return null
  const maximum = Math.ceil(Math.max(100, distribution.maximum, point.ownScore ?? 0) / 20) * 20
  const position = (value: number) => `${Math.max(0, Math.min(100, value / maximum * 100))}%`
  return (
    <li>
      <div className={styles.rowHeading}><h4>{point.label}</h4><span>확정 {point.sampleSize}명</span></div>
      <div className={styles.distribution} role="img" aria-label={`${point.label} 분포: 최소 ${score(distribution.minimum)}, 1사분위 ${score(distribution.firstQuartile)}, 중앙값 ${score(distribution.median)}, 3사분위 ${score(distribution.thirdQuartile)}, 최대 ${score(distribution.maximum)}. ${point.ownScore === null ? "내 점수 미확정" : `내 점수 ${score(point.ownScore)}`}`}>
        <span className={styles.range} style={{ left: position(distribution.minimum), width: `calc(${position(distribution.maximum)} - ${position(distribution.minimum)})` }} />
        <span className={styles.interquartile} style={{ left: position(distribution.firstQuartile), width: `calc(${position(distribution.thirdQuartile)} - ${position(distribution.firstQuartile)})` }} />
        <span className={styles.median} style={{ left: position(distribution.median) }} />
        {point.ownScore === null ? null : <span aria-hidden="true" className={styles.ownMarker} style={{ left: position(point.ownScore) }} />}
      </div>
      <p>최소 {score(distribution.minimum)} · 중앙값 {score(distribution.median)} · 최대 {score(distribution.maximum)} / 0–{maximum}점</p>
    </li>
  )
}

export function EngineerSelectedInsights({ categories, story }: Readonly<{
  categories: readonly CategoryScoreViewModel[]
  story: EngineerEvaluationStoryViewModel
}>) {
  return (
    <section className={styles.root} aria-label="개인 평가 분석">
      <section className={styles.panel} aria-labelledby="individual-profile-title">
        <header><h2 id="individual-profile-title">개인 역량 프로필</h2></header>
        <p className={styles.caption}>확정 점수와 동일 과제 완료자 평균을 같은 축에서 비교</p>
        <RadarProfile story={story} />
      </section>
      <section className={styles.panel} aria-labelledby="task-distribution-title">
        <header><h2 id="task-distribution-title">분야별 점수 분포</h2></header>
        <p className={styles.caption}>동일 시즌·과제·평가 방식의 확정 점수만 사용</p>
        <ul className={styles.rows}>{story.taskComparisons.map((point) => <Distribution key={point.key} point={point} />)}</ul>
      </section>
      <section className={styles.panel} aria-labelledby="contribution-title">
        <header><h2 id="contribution-title">항목별 최종 점수 기여도</h2></header>
        <p className={styles.caption}>기존 최종 산식의 항목별 결과를 그대로 표시</p>
        <ul className={styles.rows}>{categories.map((category) => <Contribution key={category.key} category={category} />)}</ul>
        <p className={styles.note}>합산 전 기여도입니다. 가감점과 최종 상한 적용 전후 차이는 최종 점수 영역에서 별도로 확인합니다.</p>
      </section>
      <section className={styles.panel} aria-labelledby="average-difference-title">
        <header><h2 id="average-difference-title">평균 대비 차이</h2></header>
        <p className={styles.caption}>비교집단과 분모를 항목마다 명시</p>
        <ul className={styles.rows}>{story.taskComparisons.map((point) => <Difference key={point.key} point={point} />)}</ul>
      </section>
    </section>
  )
}
