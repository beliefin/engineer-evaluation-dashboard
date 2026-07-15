import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import type { PendingEvaluationRow } from "@/view-models/pending"

import { PendingEvaluationPanel } from "./pending-evaluation-panel"

const ROWS: ReadonlyArray<PendingEvaluationRow> = [
  {
    engineerId: "engineer-01",
    employeeCode: "SAMPLE-001",
    engineerName: "김생산",
    team: "생산 1팀",
    position: "엔지니어",
    status: "in_progress",
    submittedSheetCount: 3,
    totalSheetCount: 6,
    enteredDirectScoreCount: 1,
    totalDirectScoreCount: 3,
    missingEvaluatorNames: ["평가자 김", "평가자 이"],
    firstPendingAssignmentId: "assignment-01",
  },
  {
    engineerId: "engineer-02",
    employeeCode: "SAMPLE-002",
    engineerName: "이점수",
    team: "생산 2팀",
    position: "선임 엔지니어",
    status: "direct_scores_pending",
    submittedSheetCount: 6,
    totalSheetCount: 6,
    enteredDirectScoreCount: 2,
    totalDirectScoreCount: 3,
    missingEvaluatorNames: [],
    firstPendingAssignmentId: null,
  },
  {
    engineerId: "engineer-03",
    employeeCode: "SAMPLE-003",
    engineerName: "박미배정",
    team: "생산 1팀",
    position: "책임 엔지니어",
    status: "unassigned",
    submittedSheetCount: 0,
    totalSheetCount: 0,
    enteredDirectScoreCount: 0,
    totalDirectScoreCount: 3,
    missingEvaluatorNames: [],
    firstPendingAssignmentId: null,
  },
]

afterEach(cleanup)

describe("PendingEvaluationPanel", () => {
  it("shows reasons and operator actions for pending evaluations", () => {
    // Given
    const role = "operator"

    // When
    render(<PendingEvaluationPanel rows={ROWS} role={role} />)

    // Then
    expect(screen.getAllByRole("table")).toHaveLength(1)
    expect(screen.getAllByText("미제출: 평가자 김, 평가자 이").length).toBeGreaterThan(0)
    expect(screen.getAllByText("직접점수 1개 입력이 필요합니다.").length).toBeGreaterThan(0)
    expect(screen.getAllByText("평가자 배정이 필요합니다.").length).toBeGreaterThan(0)
    expect(screen.getAllByRole("link", { name: "김생산 평가 입력" })[0]).toHaveAttribute(
      "href",
      "/evaluations/assignment-01",
    )
    expect(screen.getAllByRole("link", { name: "이점수 직접점수 입력" })[0]).toHaveAttribute(
      "href",
      "/operations?tab=scores&q=%EC%9D%B4%EC%A0%90%EC%88%98",
    )
  })

  it("filters by engineer name or employee code", async () => {
    // Given
    const user = userEvent.setup()
    render(<PendingEvaluationPanel rows={ROWS} role="operator" />)

    // When
    await user.type(screen.getByRole("searchbox", { name: "미평가 대상 검색" }), "SAMPLE-002")

    // Then
    expect(screen.getAllByText("이점수").length).toBeGreaterThan(0)
    expect(screen.queryByText("김생산")).not.toBeInTheDocument()
    expect(screen.getByText("검색 결과 1명")).toBeInTheDocument()
  })

  it("links approvers to read-only engineer details", () => {
    // Given
    const rows = ROWS.filter((row) => row.engineerId === "engineer-01")

    // When
    render(<PendingEvaluationPanel rows={rows} role="approver" />)

    // Then
    expect(screen.getAllByRole("link", { name: "김생산 상세 보기" })[0]).toHaveAttribute(
      "href",
      "/engineers/engineer-01",
    )
    expect(screen.queryByRole("link", { name: "김생산 평가 입력" })).not.toBeInTheDocument()
  })
})
