import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createSeedSnapshot } from "@/data/seed"

import { EvaluationProvider, useEvaluation } from "./evaluation-provider"

const backend = vi.hoisted(() => ({
  load: vi.fn(),
  persist: vi.fn(),
}))

vi.mock("@/backend/evaluation-backend", () => ({
  loadRemoteEvaluation: backend.load,
  persistRemoteEvaluation: backend.persist,
}))

vi.mock("@/backend/supabase-client", () => ({
  isSupabaseConfigured: () => true,
}))

vi.mock("./auth-provider", () => ({
  useAuth: () => ({
    session: {
      id: "operator-account",
      role: "operator",
      roles: ["operator"],
      evaluatorId: null,
      engineerId: null,
      canViewInsights: true,
    },
  }),
}))

function RemoteSaveProbe() {
  const { snapshot, saveDraft, saveState, errorMessage } = useEvaluation()
  const sheet = snapshot?.scoreSheets[0]
  const firstScore = sheet?.scores[0]?.score ?? null

  return (
    <div>
      <output aria-label="저장 상태">{saveState}</output>
      <output aria-label="현재 점수">{firstScore ?? "없음"}</output>
      <output aria-label="저장 오류">{errorMessage ?? ""}</output>
      <button
        disabled={sheet === undefined}
        onClick={() => {
          if (sheet === undefined) return
          for (const score of [7, 8, 9]) {
            saveDraft(
              sheet.id,
              sheet.scores.map((entry, index) => ({
                ...entry,
                score: index === 0 ? score : entry.score,
              })),
              sheet.passResult,
            )
          }
        }}
        type="button"
      >
        빠른 점수 입력
      </button>
    </div>
  )
}

describe("EvaluationProvider remote draft persistence", () => {
  beforeEach(() => {
    backend.load.mockReset()
    backend.persist.mockReset()
    const snapshot = createSeedSnapshot()
    backend.load.mockResolvedValue({ snapshot, revision: 10 })
    backend.persist.mockImplementation(async (_command, nextSnapshot) => ({
      snapshot: nextSnapshot,
      revision: 11,
    }))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("coalesces rapid score changes into one remote request with the latest score", async () => {
    render(
      <EvaluationProvider>
        <RemoteSaveProbe />
      </EvaluationProvider>,
    )
    const button = await screen.findByRole("button", { name: "빠른 점수 입력" })
    vi.useFakeTimers()

    fireEvent.click(button)
    expect(backend.persist).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(backend.persist).toHaveBeenCalledTimes(1)
    const savedSnapshot = backend.persist.mock.calls[0]?.[1]
    expect(savedSnapshot?.scoreSheets[0]?.scores[0]?.score).toBe(9)
    expect(screen.getByLabelText("저장 상태")).toHaveTextContent("saved")
  })

  it("preserves optimistic scores and does not reload over them when persistence fails", async () => {
    backend.persist.mockRejectedValueOnce(new Error("동시 저장 실패"))
    render(
      <EvaluationProvider>
        <RemoteSaveProbe />
      </EvaluationProvider>,
    )
    const button = await screen.findByRole("button", { name: "빠른 점수 입력" })
    vi.useFakeTimers()

    fireEvent.click(button)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(screen.getByLabelText("현재 점수")).toHaveTextContent("9")
    expect(screen.getByLabelText("저장 상태")).toHaveTextContent("error")
    expect(screen.getByLabelText("저장 오류")).toHaveTextContent("동시 저장 실패")
    expect(backend.load).toHaveBeenCalledTimes(1)
  })
})
