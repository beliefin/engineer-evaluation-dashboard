"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react"
import { toast } from "sonner"

import {
  loadRemoteEvaluation,
  persistRemoteEvaluation,
  type EvaluationView,
  type RemoteEvaluationCommand,
  type RemoteEvaluationState,
  type ViewerRanking,
} from "@/backend/evaluation-backend"
import { createSnapshotRepository } from "@/backend/snapshot-repository"
import type { EvaluationSnapshot, Role } from "@/domain"
import type { EvaluationRepository } from "@/repository"

import { RemoteWriteQueue, type RemoteWriteMode } from "./remote-write-queue"
import {
  preserveOptimisticInput,
  withCanonicalAuditPrefix,
} from "./remote-snapshot-reconciliation"

export type SaveState = "idle" | "saving" | "saved" | "error" | "locked"

type RemotePersistenceOptions = Readonly<{
  repositoryRef: RefObject<EvaluationRepository | null>
  requestedView: EvaluationView
  role: Role
  setErrorMessage: Dispatch<SetStateAction<string | null>>
  setSaveState: Dispatch<SetStateAction<SaveState>>
  setSnapshot: Dispatch<SetStateAction<EvaluationSnapshot | null>>
  setViewerRankings: Dispatch<SetStateAction<readonly ViewerRanking[]>>
}>

export function useRemoteEvaluationPersistence(options: RemotePersistenceOptions) {
  const {
    repositoryRef,
    requestedView,
    role,
    setErrorMessage,
    setSaveState,
    setSnapshot,
    setViewerRankings,
  } = options
  const revisionRef = useRef(0)
  const snapshotRef = useRef<EvaluationSnapshot | null>(null)
  const canonicalSnapshotRef = useRef<EvaluationSnapshot | null>(null)
  const writeGenerationRef = useRef(0)
  const writeFailedRef = useRef(false)
  const queueRef = useRef<RemoteWriteQueue<RemoteEvaluationState> | null>(null)
  const handlePendingChange = useCallback((count: number) => {
    if (count > 0) setSaveState("saving")
  }, [setSaveState])
  const handleSuccess = useCallback((
    saved: RemoteEvaluationState,
    message: string | undefined,
    remaining: number,
  ) => {
    revisionRef.current = saved.revision
    canonicalSnapshotRef.current = saved.snapshot
    setViewerRankings(saved.viewerRankings)
    const current = snapshotRef.current
    const reconciled = current === null || remaining === 0
      ? saved.snapshot
      : withCanonicalAuditPrefix(current, saved.snapshot)
    snapshotRef.current = reconciled
    repositoryRef.current = createSnapshotRepository(reconciled)
    setSnapshot(reconciled)
    if (message !== undefined) toast.success(message)
    if (remaining === 0 && !writeFailedRef.current) setSaveState("saved")
  }, [repositoryRef, setSaveState, setSnapshot, setViewerRankings])
  const handleError = useCallback((error: unknown) => {
    writeFailedRef.current = true
    const text = error instanceof Error ? error.message : "서버 저장 중 오류가 발생했습니다."
    setSaveState("error")
    setErrorMessage(text)
    toast.error(`${text} 입력 내용은 화면에 보존되었습니다.`)
  }, [setErrorMessage, setSaveState])
  useEffect(() => {
    const queue = new RemoteWriteQueue<RemoteEvaluationState>({
      draftDelayMs: 700,
      onPendingChange: handlePendingChange,
      onSuccess: handleSuccess,
      onError: handleError,
    })
    queueRef.current = queue
    return () => {
      queue.dispose()
      queueRef.current = null
    }
  }, [handleError, handlePendingChange, handleSuccess])

  const rememberSnapshot = useCallback((snapshot: EvaluationSnapshot) => {
    snapshotRef.current = snapshot
  }, [])

  const rememberRemoteState = useCallback((state: RemoteEvaluationState) => {
    revisionRef.current = state.revision
    canonicalSnapshotRef.current = state.snapshot
  }, [])

  const enqueue = useCallback((
    command: RemoteEvaluationCommand,
    next: EvaluationSnapshot,
    message?: string,
  ) => {
    const queue = queueRef.current
    if (queue === null) throw new RangeError("원격 저장 대기열이 준비되지 않았습니다.")
    if (queue.pendingCount === 0) writeFailedRef.current = false
    const mode: RemoteWriteMode = command.type === "sheet"
      ? (command.operation === "save_draft" ? "draft" : "final")
      : "immediate"
    const key = command.type === "sheet" ? command.sheetId : undefined
    const generation = writeGenerationRef.current
    queue.enqueue({
      mode,
      key,
      message,
      run: async () => {
        if (generation !== writeGenerationRef.current) {
          throw new Error("앞선 저장 충돌로 대기 중이던 변경을 취소했습니다. 최신 화면에서 다시 저장해 주세요.")
        }
        try {
          const canonical = canonicalSnapshotRef.current
          const requestSnapshot = command.type === "operator" && canonical !== null
            ? withCanonicalAuditPrefix(next, canonical)
            : next
          return await persistRemoteEvaluation(command, requestSnapshot, revisionRef.current, role)
        } catch (error) {
          if (command.type !== "sheet") {
            const refreshed = await loadRemoteEvaluation(role, requestedView).catch(() => null)
            const canonical = refreshed?.snapshot ?? canonicalSnapshotRef.current
            if (refreshed !== null) {
              revisionRef.current = refreshed.revision
              canonicalSnapshotRef.current = refreshed.snapshot
              setViewerRankings(refreshed.viewerRankings)
            }
            if (canonical !== null && snapshotRef.current !== null) {
              const preserved = preserveOptimisticInput(snapshotRef.current, canonical)
              snapshotRef.current = preserved
              repositoryRef.current = createSnapshotRepository(preserved)
              setSnapshot(preserved)
            }
            writeGenerationRef.current += 1
          }
          throw error
        }
      },
    })
  }, [repositoryRef, requestedView, role, setSnapshot, setViewerRankings])

  return useMemo(
    () => ({ enqueue, rememberRemoteState, rememberSnapshot } as const),
    [enqueue, rememberRemoteState, rememberSnapshot],
  )
}
