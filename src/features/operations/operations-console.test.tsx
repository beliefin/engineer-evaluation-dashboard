import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { OperationsConsole } from "./operations-console"

const VIEW_MODEL = {
  cycleLabel: "2026 상반기",
  cycleCount: 1,
  cycleLocked: false,
  cycleStatus: "active",
  cycleStartsAt: "2026-01-02",
  cycleEndsAt: "2026-06-30",
  tasks: [],
  evaluatorOptions: [],
  weightTotal: 0,
  engineerTaskWeights: [],
  directScores: [],
  rosterEngineers: [],
  rosterEvaluators: [],
  submittedSheets: [],
} as const

describe("OperationsConsole", () => {
  it("keeps the deferred reopen workflow out of the operator UI", () => {
    render(
      <OperationsConsole
        onDirectScoreChange={vi.fn()}
        onSaveLanguageRecord={vi.fn(() => true)}
        onDeleteLanguageRecord={vi.fn(() => true)}
        onSaveCertificationRecord={vi.fn(() => true)}
        onDeleteCertificationRecord={vi.fn(() => true)}
        onVerifySourceRecord={vi.fn(() => true)}
        onAddEngineers={vi.fn(() => true)}
        onAddEvaluators={vi.fn(() => true)}
        onDeleteEngineer={vi.fn(() => true)}
        onDeleteEvaluator={vi.fn(() => true)}
        onUpdateEngineer={vi.fn(() => true)}
        onUpdateEvaluator={vi.fn(() => true)}
        onResetDemoData={vi.fn()}
        onCreateCycle={vi.fn(() => true)}
        onUpdateCycle={vi.fn(() => true)}
        onSetCycleLock={vi.fn(() => true)}
        onSaveTask={vi.fn(() => true)}
        onDeleteTask={vi.fn(() => true)}
        onEngineerTaskWeightsChange={vi.fn(() => true)}
        viewModel={VIEW_MODEL}
      />,
    )

    expect(screen.queryByRole("tab", { name: "재오픈" })).not.toBeInTheDocument()
    expect(screen.queryByText("제출 평가지 재오픈")).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "명단 등록" })).toBeInTheDocument()
  })
})
