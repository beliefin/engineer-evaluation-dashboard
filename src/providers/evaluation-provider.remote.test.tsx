import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
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

function RemoteOperatorSaveProbe() {
  const { snapshot, updateEvaluatorPreset, saveState, errorMessage } = useEvaluation()
  const evaluatorId = snapshot?.evaluators[0]?.id
  const presetCount = snapshot?.cycles[0]?.evaluatorPreset?.length ?? 0

  return (
    <div>
      <output aria-label="운영 저장 상태">{saveState}</output>
      <output aria-label="고정 평가자 수">{presetCount}</output>
      <output aria-label="운영 저장 오류">{errorMessage ?? ""}</output>
      <button
        disabled={evaluatorId === undefined}
        onClick={() => {
          if (evaluatorId === undefined) return
          updateEvaluatorPreset([{ evaluatorId, weight: 1 }])
        }}
        type="button"
      >
        고정 평가자 저장
      </button>
    </div>
  )
}

describe("EvaluationProvider remote draft persistence", () => {
  beforeEach(() => {
    backend.load.mockReset()
    backend.persist.mockReset()
    const snapshot = createSeedSnapshot()
    backend.load.mockResolvedValue({ snapshot, revision: 10, viewerRankings: [] })
    backend.persist.mockImplementation(async (_command, nextSnapshot) => ({
      snapshot: nextSnapshot,
      revision: 11,
      viewerRankings: [],
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

  it("uses the server-canonical audit history for consecutive operator saves", async () => {
    let revision = 10
    backend.persist.mockImplementation(async (_command, nextSnapshot) => {
      revision += 1
      const lastEvent = nextSnapshot.auditEvents.at(-1)
      return {
        snapshot: {
          ...nextSnapshot,
          auditEvents: lastEvent === undefined ? [] : [
            ...nextSnapshot.auditEvents.slice(0, -1),
            { ...lastEvent, id: `server-audit-${revision}` },
          ],
        },
        revision,
        viewerRankings: [],
      }
    })
    render(
      <EvaluationProvider>
        <RemoteOperatorSaveProbe />
      </EvaluationProvider>,
    )
    const button = await screen.findByRole("button", { name: "고정 평가자 저장" })

    fireEvent.click(button)
    await waitFor(() => expect(backend.persist).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByLabelText("운영 저장 상태")).toHaveTextContent("saved"))
    fireEvent.click(button)
    await waitFor(() => expect(backend.persist).toHaveBeenCalledTimes(2))

    const secondSnapshot = backend.persist.mock.calls[1]?.[1]
    expect(secondSnapshot?.auditEvents[0]?.id).toBe("server-audit-11")
  })

  it("preserves operator input when a remote save fails", async () => {
    backend.persist.mockRejectedValueOnce(new Error("운영 저장 실패"))
    render(
      <EvaluationProvider>
        <RemoteOperatorSaveProbe />
      </EvaluationProvider>,
    )
    const button = await screen.findByRole("button", { name: "고정 평가자 저장" })

    fireEvent.click(button)
    await waitFor(() => expect(screen.getByLabelText("운영 저장 상태")).toHaveTextContent("error"))

    expect(screen.getByLabelText("고정 평가자 수")).toHaveTextContent("1")
    expect(screen.getByLabelText("운영 저장 오류")).toHaveTextContent("운영 저장 실패")
    expect(backend.load).toHaveBeenCalledTimes(2)
  })
})
