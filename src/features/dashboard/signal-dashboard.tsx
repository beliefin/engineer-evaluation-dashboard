"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"

import type { CategoryAverageDatum, CompletedRankingRow, DashboardEvaluationTask, EngineerEvaluationProgressRow } from "./dashboard-view-models"

const statusLabels = { complete: "평가 완료", in_progress: "진행 중", not_started: "미진행" } as const

export function SignalProgressTable({ rows, tasks }: Readonly<{ rows: readonly EngineerEvaluationProgressRow[]; tasks: readonly DashboardEvaluationTask[] }>) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const filtered = rows.filter((row) => `${row.name} ${row.employeeCode}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 6) - 1))
  const pageRows = filtered.slice(currentPage * 6, currentPage * 6 + 6)
  return <section className="signal-matrix" aria-labelledby="signal-progress-title">
    <div className="signal-section-bar">
      <h2 id="signal-progress-title">엔지니어별 평가 현황</h2>
      <label className="signal-search"><Search size={17} aria-hidden="true" /><span className="sr-only">평가 현황 엔지니어 검색</span><input value={query} placeholder="엔지니어·사번 검색" onChange={(event) => { setQuery(event.target.value); setPage(0) }} type="search" />{query !== "" && <button aria-label="검색 초기화" type="button" onClick={() => { setQuery(""); setPage(0) }}><X size={16} /></button>}</label>
    </div>
    <div className="signal-table-scroll">
      <table className="signal-progress-table"><caption className="sr-only">엔지니어별 적용 과제 평가 현황</caption><thead><tr><th>엔지니어</th>{tasks.map((task) => <th key={task.id}>{task.label}</th>)}</tr></thead><tbody>
        {pageRows.map((row) => <tr key={row.id}><th scope="row"><Link href={row.href} title={`${row.employeeCode} · ${row.team}`}>{row.name}</Link></th>{tasks.map((task) => {
          const progress = row.tasks.find((entry) => entry.taskId === task.id)
          const label = progress === undefined ? "해당 없음" : statusLabels[progress.status]
          return <td key={task.id}><span className="signal-status" title={progress === undefined ? "적용 가중치가 없는 과제" : `${label} · ${progress.score === null ? "점수 없음" : `${progress.score.toFixed(1)}점`} · 가중치 ${progress.weight}%`}><span aria-hidden="true" className={`signal-square ${progress?.status === "complete" ? "is-complete" : ""}`} />{label}</span></td>
        })}</tr>)}
        {pageRows.length === 0 && <tr><td colSpan={tasks.length + 1} className="signal-empty">검색 결과가 없습니다. <button type="button" onClick={() => setQuery("")}>검색 초기화</button></td></tr>}
      </tbody></table>
    </div>
    <div className="signal-pagination"><span>총 {filtered.length}명{filtered.length > 0 ? ` 중 ${currentPage * 6 + 1}–${Math.min(filtered.length, currentPage * 6 + 6)}명` : ""}</span><span className="signal-page-actions"><button aria-label="이전 엔지니어 페이지" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} type="button"><ChevronLeft size={17} /></button><span>{currentPage + 1} / {Math.max(1, Math.ceil(filtered.length / 6))}</span><button aria-label="다음 엔지니어 페이지" disabled={(currentPage + 1) * 6 >= filtered.length} onClick={() => setPage(currentPage + 1)} type="button"><ChevronRight size={17} /></button></span></div>
  </section>
}

export function getAverageChartScale(data: readonly CategoryAverageDatum[]) {
  const scores = data.filter((item) => item.sampleSize > 0)
    .flatMap((item) => [item.weightedScore, item.unweightedScore])
    .filter((score) => Number.isFinite(score))
  const observedMaximum = Math.max(100, ...scores)
  const step = Math.max(20, Math.ceil(observedMaximum / 6 / 20) * 20)
  const maximum = Math.ceil(observedMaximum / step) * step
  return { maximum, ticks: Array.from({ length: maximum / step + 1 }, (_, index) => index * step) }
}

export function SignalAverageChart({ data }: Readonly<{ data: readonly CategoryAverageDatum[] }>) {
  const { maximum } = getAverageChartScale(data)
  return <section className="signal-average-panel" aria-labelledby="signal-average-title"><div className="signal-section-bar"><h2 id="signal-average-title">과제별 평균</h2></div><div className="signal-average-bars">
    {data.map((item) => <div className="signal-average-row" key={item.id}><span>{item.label}</span><div className="signal-average-track" role="img" aria-label={item.sampleSize === 0 ? `${item.label} 확정 점수 없음` : `${item.label} 가중 평균 ${item.weightedScore.toFixed(1)}점, 완료 표본 ${item.sampleSize}명, 척도 0~${maximum}점`}><span style={{ width: `${item.sampleSize === 0 ? 0 : item.weightedScore / maximum * 100}%` }} /></div><strong className="numeric">{item.sampleSize === 0 ? "—" : `${Number(item.weightedScore.toFixed(1))}점`}</strong></div>)}
    {!data.some((item) => item.sampleSize > 0) && <p className="signal-empty">집계할 확정 점수가 없습니다.</p>}
    {maximum > 100 && <p className="signal-chart-note">공통 척도 0–{maximum}점</p>}
  </div></section>
}

export function SignalRanking({ rows }: Readonly<{ rows: readonly CompletedRankingRow[] }>) {
  const ranked = rows.filter((row) => row.rank !== null).slice(0, 3)
  return <section className="signal-ranking-panel" aria-labelledby="signal-ranking-title"><div className="signal-section-bar"><h2 id="signal-ranking-title">종합 순위 상위 3명</h2><span className="signal-bar-note">현재 점수 기준</span></div><table className="signal-ranking-table"><thead><tr><th>순위</th><th>엔지니어</th><th>종합 점수</th></tr></thead><tbody>{ranked.map((row) => <tr key={row.id}><td className="numeric">{row.rank}{row.isTied && <span className="sr-only">공동</span>}</td><td><Link href={row.href}>{row.name}</Link></td><td className="numeric">{row.totalScore?.toFixed(1) ?? "—"}</td></tr>)}{ranked.length === 0 && <tr><td colSpan={3}>아직 반영된 점수가 없습니다.</td></tr>}</tbody></table></section>
}
