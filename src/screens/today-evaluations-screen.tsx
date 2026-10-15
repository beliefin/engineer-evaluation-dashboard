"use client"

import Link from "next/link"
import { useState } from "react"
import { CalendarCheck2 } from "lucide-react"

import { EmptyState, PageHeader } from "@/components/shared"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCalendarDate, toLocalDateValue } from "@/features/calendar"
import { useEvaluation } from "@/providers"
import { selectScheduledEvaluations, type ScheduledEvaluationView } from "@/view-models/today-evaluations"

import styles from "./today-evaluations-signal.module.css"

const STATUS = {
  not_started: "미작성",
  in_progress: "작성 중",
  submitted: "제출 완료",
}

function EvaluationLink({ evaluation }: { readonly evaluation: ScheduledEvaluationView }) {
  return (
    <Link
      className={styles.evaluationLink}
      href={
        `/evaluations/detail?assignmentId=${encodeURIComponent(evaluation.assignmentId)}` +
        (evaluation.parallelAssignmentId === null
          ? ""
          : `&parallelAssignmentId=${encodeURIComponent(evaluation.parallelAssignmentId)}`)
      }
    >
      {evaluation.status === "not_started" ? "평가 시작" : "평가표 열기"}
    </Link>
  )
}

function itemProgress(evaluation: ScheduledEvaluationView) {
  return evaluation.totalItems > 0
    ? `${evaluation.completedItems}/${evaluation.totalItems}개 항목`
    : "P/F 평가"
}

export function TodayEvaluationsScreen() {
  const [date, setDate] = useState(() => toLocalDateValue(new Date()))
  const { snapshot, activeCycleId, activeEvaluatorId, backendMode } = useEvaluation()
  if (snapshot === null) return null

  const evaluations = selectScheduledEvaluations(snapshot, activeCycleId, activeEvaluatorId, date)

  return (
    <div className={styles.screen}>
      <PageHeader
        actions={(
          <div className={styles.dateFilter}>
            <Label htmlFor="today-evaluation-date">평가일</Label>
            <Input
              id="today-evaluation-date"
              onChange={(event) => setDate(event.currentTarget.value)}
              type="date"
              value={date}
            />
          </div>
        )}
        className={styles.pageHeader}
        context={`평가자 작업 공간 · ${backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}`}
        description="선택 날짜의 발표 일정 확인과 평가표 바로 열기. 기본값은 오늘 날짜"
        title="오늘의 평가"
      />

      <section aria-labelledby="scheduled-evaluations-title" className={styles.schedule}>
        <div className={styles.sectionBar}>
          <h2 id="scheduled-evaluations-title">{formatCalendarDate(date)} 평가 대상</h2>
          <span className={styles.selectedDate}>선택 날짜 {date}</span>
        </div>
        <p className={styles.scheduleCount}>시작 시간순으로 {evaluations.length}건</p>

        {evaluations.length === 0 ? (
          <div className={styles.empty}>
            <EmptyState
              description="선택한 날짜에 본인에게 배정된 평가 일정이 없습니다. 전체 일정은 평가 일정 메뉴에서 확인할 수 있습니다."
              icon={CalendarCheck2}
              title="예정된 평가가 없습니다"
            />
          </div>
        ) : (
          <>
            <div aria-label="평가 일정 표, 가로로 스크롤 가능" className={styles.tableScroll} role="region" tabIndex={0}>
              <table className={styles.scheduleTable}>
                <caption className="sr-only">선택 날짜에 본인에게 배정된 평가 일정</caption>
                <thead>
                  <tr>
                    <th scope="col">시작 시간</th>
                    <th scope="col">발표자</th>
                    <th scope="col">소속 팀</th>
                    <th scope="col">평가 과제</th>
                    <th scope="col">발표 제목</th>
                    <th scope="col">일정 안내</th>
                    <th scope="col">제출 상태</th>
                    <th scope="col">평가 항목</th>
                    <th scope="col">평가표</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation) => (
                    <tr key={evaluation.eventId}>
                      <td>{evaluation.startTime ?? "시간 미정"}</td>
                      <td>{evaluation.engineerName}</td>
                      <td>{evaluation.team}</td>
                      <td>{evaluation.taskName}</td>
                      <td>{evaluation.title}</td>
                      <td>{evaluation.note ?? "—"}</td>
                      <td><span className={styles.status} data-status={evaluation.status}>{STATUS[evaluation.status]}</span></td>
                      <td>{itemProgress(evaluation)}</td>
                      <td><EvaluationLink evaluation={evaluation} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ol aria-label="선택 날짜 평가 일정 목록" className={styles.scheduleCards}>
              {evaluations.map((evaluation) => (
                <li key={evaluation.eventId}>
                  <div className={styles.cardHeading}>
                    <div>
                      <p className={styles.taskName}>{evaluation.taskName}</p>
                      <h3>{evaluation.engineerName}</h3>
                    </div>
                    <span className={styles.status} data-status={evaluation.status}>{STATUS[evaluation.status]}</span>
                  </div>
                  <p className={styles.team}>{evaluation.team}</p>
                  <dl className={styles.cardDetails}>
                    <div><dt>시작 시간</dt><dd>{evaluation.startTime ?? "시간 미정"}</dd></div>
                    <div><dt>평가 항목</dt><dd>{itemProgress(evaluation)}</dd></div>
                    <div className={styles.fullWidth}><dt>발표 제목</dt><dd>{evaluation.title}</dd></div>
                    {evaluation.note === null ? null : (
                      <div className={styles.fullWidth}><dt>일정 안내</dt><dd>{evaluation.note}</dd></div>
                    )}
                  </dl>
                  <EvaluationLink evaluation={evaluation} />
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  )
}
