"use client"

import { HorizontalScroll } from "@/components/ui/horizontal-scroll"

import "./dashboard-ranking-signal.css"

import { useId, type CSSProperties } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { CategoryAverageChartProps } from "./dashboard-view-models"
import { getAverageChartScale } from "./signal-dashboard"

export function CategoryAverageChart({ title, description, data }: CategoryAverageChartProps) {
  const titleId = useId()
  const hasData = data.some((item) => item.sampleSize > 0)
  const { maximum, ticks } = getAverageChartScale(data)

  return (
    <section className="signal-category-panel" aria-labelledby={titleId}>
      <h2 className="signal-dashboard-panel-title" id={titleId}>{title}</h2>
      <p className="signal-category-description">{description}</p>
      <figure aria-label={`과제별 평가자 가중 평균과 비가중 평균 비교, 공통 척도 0~${maximum}점`}>
        {hasData ? (
          <>
            <div className="signal-category-legend" aria-label="평균 종류">
              <span><i aria-hidden="true" />가중 평균</span>
              <span><i aria-hidden="true" />비가중 평균</span>
            </div>
            <HorizontalScroll className="signal-category-scroll" role="region" aria-label="과제별 평균 차트, 가로로 스크롤할 수 있습니다" tabIndex={0}>
              <div className="signal-category-chart" style={{ "--average-tick-count": ticks.length - 1 } as CSSProperties}>
                {data.map((item) => (
                  <div className="signal-category-row" key={item.id}>
                    <span className="signal-category-label">{item.label}</span>
                    <div className="signal-category-plot">
                      {(["weightedScore", "unweightedScore"] as const).map((series) => {
                        const score = item[series]
                        const seriesLabel = series === "weightedScore" ? "가중 평균" : "비가중 평균"
                        return (
                          <div
                            className={`signal-category-bar ${series === "weightedScore" ? "is-weighted" : "is-unweighted"}`}
                            key={series}
                            role="img"
                            aria-label={item.sampleSize === 0 ? `${item.label} ${seriesLabel} 확정 점수 없음` : `${item.label} ${seriesLabel} ${score.toFixed(1)}점, 완료 표본 ${item.sampleSize}명, 공통 척도 0~${maximum}점`}
                          >
                            <span
                              className="signal-category-bar-fill"
                              data-series={series}
                              data-score={item.sampleSize === 0 ? undefined : score}
                              style={{ width: `${item.sampleSize === 0 ? 0 : Math.max(0, score) / maximum * 100}%` }}
                            ><span className="signal-category-value numeric">{item.sampleSize === 0 ? "—" : score.toFixed(1)}</span></span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="signal-category-axis" aria-hidden="true">
                  {ticks.map((tick) => <span className="numeric" key={tick} style={{ left: `${tick / maximum * 100}%` }}>{tick}</span>)}
                </div>
              </div>
            </HorizontalScroll>
          </>
        ) : (
          <div role="status" className="signal-category-empty">집계할 분야 점수가 없습니다.</div>
        )}
        <details className="signal-category-data" open>
          <summary>과제 평균 표 데이터 보기</summary>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>과제</TableHead>
                <TableHead className="text-right">가중 평균</TableHead>
                <TableHead className="text-right">비가중 평균</TableHead>
                <TableHead className="text-right">완료 표본</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="numeric text-right">{item.sampleSize === 0 ? "—" : `${item.weightedScore.toFixed(1)}점`}</TableCell>
                  <TableCell className="numeric text-right">{item.sampleSize === 0 ? "—" : `${item.unweightedScore.toFixed(1)}점`}</TableCell>
                  <TableCell className="numeric text-right">{item.sampleSize}명</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </details>
      </figure>
    </section>
  )
}
