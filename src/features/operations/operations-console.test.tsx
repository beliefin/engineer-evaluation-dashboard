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
  evaluatorPreset: [],
  weightTotal: 0,
  engineerTaskWeights: [],
  evaluatorAssignments: [],
  directScores: [],
  scoreAdjustments: [],
  rosterEngineers: [],
  rosterEvaluators: [],
  submittedSheets: [],
} as const

describe("OperationsConsole", () => {
  it("shows submitted evaluation unlock controls to the operator", () => {
    render(
      <OperationsConsole
        onDirectScoreChange={vi.fn()}
        onSaveScoreAdjustment={vi.fn(() => true)}
        onDeleteScoreAdjustment={vi.fn(() => true)}
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
        onUpdateEvaluatorAssignments={vi.fn(() => true)}
        onUpdateEvaluatorPreset={vi.fn(() => true)}
        onReopenSheet={vi.fn(() => true)}
        activeTab="unlocks"
        viewModel={VIEW_MODEL}
      />,
    )

    expect(screen.getByRole("tab", { name: "평가 잠금 해제" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "자격·어학 평가표" })).toBeInTheDocument()
    expect(screen.getByText("평가 잠금 해제 요청")).toBeInTheDocument()
  })
})
