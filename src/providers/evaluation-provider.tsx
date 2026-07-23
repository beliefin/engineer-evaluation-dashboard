"use client"

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { usePathname } from "next/navigation"

import {
  loadRemoteEvaluation, persistRemoteEvaluation, type EvaluationView, type RemoteEvaluationCommand,
  type RemoteEvaluationState,
} from "@/backend/evaluation-backend"
import { createSnapshotRepository } from "@/backend/snapshot-repository"
import { isSupabaseConfigured } from "@/backend/supabase-client"
import type { EvaluationSnapshot, Role } from "@/domain"
import {
  createLocalStorageEvaluationRepository, type EvaluationRepository, type RepositoryActor,
} from "@/repository"

import {
  createEvaluationActions, type EvaluationActions, type MutateRepository,
} from "./evaluation-actions"
import { useAuth } from "./auth-provider"
import { RemoteWriteQueue, type RemoteWriteMode } from "./remote-write-queue"

export type SaveState = "idle" | "saving" | "saved" | "error" | "locked"
export type EvaluationLoadError = Readonly<{
  kind: "repository_load_failed" | "storage_unavailable"
  message: string
}>
export type EvaluationLoadState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "ready" }>
  | Readonly<{ status: "error"; error: EvaluationLoadError }>

type EvaluationContextValue = Readonly<{
  snapshot: EvaluationSnapshot | null
  role: Role
  canViewInsights: boolean
  activeCycleId: string
  activeEvaluatorId: string
  backendMode: "supabase" | "local"
  saveState: SaveState
  loadState: EvaluationLoadState
  errorMessage: string | null
  setActiveCycleId: (cycleId: string) => void
  setActiveEvaluatorId: (evaluatorId: string) => void
  retryLoad: () => void
}> & EvaluationActions

const EvaluationContext = createContext<EvaluationContextValue | null>(null)
const EVALUATOR_KEY = "engineer-evaluation-dashboard:selected-evaluator"
const CYCLE_KEY = "engineer-evaluation-dashboard:selected-cycle"
const LOAD_ERROR_MESSAGE = "운영 데이터를 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요."

export function evaluationViewForPath(
  role: Role,
  canViewInsights: boolean,
  pathname: string,
): EvaluationView {
  const insightsRoute = /\/(dashboard|analysis)\/?$/.test(pathname)
  return role === "evaluator" && canViewInsights && insightsRoute ? "insights" : "default"
}

function readSessionSelection(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionSelection(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    return
  }
}

export function EvaluationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { session } = useAuth()
  const pathname = usePathname()
  const remoteMode = isSupabaseConfigured()
  const sessionId = remoteMode ? (session?.id ?? null) : null
  const repositoryRef = useRef<EvaluationRepository | null>(null)
  const revisionRef = useRef(0)
  const writeFailedRef = useRef(false)
  const [snapshot, setSnapshot] = useState<EvaluationSnapshot | null>(null)
  const [loadedView, setLoadedView] = useState<EvaluationView | null>(null)
  const [activeCycleId, setActiveCycleIdState] = useState("")
  const [proxyEvaluatorId, setProxyEvaluatorId] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [loadState, setLoadState] = useState<EvaluationLoadState>({ status: "loading" })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const role = session?.role ?? "operator"
  const canViewInsights = session?.canViewInsights ?? false
  const requestedView = evaluationViewForPath(role, canViewInsights, pathname)
  const activeEvaluatorId = role === "evaluator" ? (session?.evaluatorId ?? "") : proxyEvaluatorId
  const remoteWriteQueue = useMemo(() => new RemoteWriteQueue<RemoteEvaluationState>({
    draftDelayMs: 700,
    onPendingChange: (count) => {
      if (count > 0) setSaveState("saving")
    },
    onSuccess: (saved, message, remaining) => {
      revisionRef.current = saved.revision
      if (message !== undefined) toast.success(message)
      if (remaining === 0 && !writeFailedRef.current) setSaveState("saved")
    },
    onError: (error) => {
      writeFailedRef.current = true
      const text = error instanceof Error ? error.message : "서버 저장 중 오류가 발생했습니다."
      setSaveState("error")
      setErrorMessage(text)
      toast.error(`${text} 입력 내용은 화면에 보존되었습니다.`)
    },
  }), [])

  const commitSnapshot = useCallback((loaded: EvaluationSnapshot) => {
    setSnapshot(loaded)
    setActiveCycleIdState((current) => {
      const preferred = current || readSessionSelection(CYCLE_KEY) || ""
      return loaded.cycles.some((cycle) => cycle.id === preferred)
        ? preferred : (loaded.cycles[0]?.id ?? "")
    })
    setProxyEvaluatorId((current) => {
      const preferred = current || readSessionSelection(EVALUATOR_KEY) || ""
      return loaded.evaluators.some((entry) => entry.id === preferred)
        ? preferred : (loaded.evaluators[0]?.id ?? "")
    })
    setLoadState({ status: "ready" })
    setErrorMessage(null)
  }, [])

  const failLoad = useCallback((error: unknown) => {
    const kind = error instanceof DOMException && error.name === "SecurityError"
      ? "storage_unavailable" : "repository_load_failed"
    setSnapshot(null)
    setLoadState({ status: "error", error: { kind, message: LOAD_ERROR_MESSAGE } })
  }, [])

  const installRemoteState = useCallback((
    state: Awaited<ReturnType<typeof loadRemoteEvaluation>>,
    view: EvaluationView,
  ) => {
    revisionRef.current = state.revision
    repositoryRef.current = createSnapshotRepository(state.snapshot)
    setLoadedView(view)
    commitSnapshot(state.snapshot)
  }, [commitSnapshot])

  useEffect(() => {
    let active = true
    setLoadState({ status: "loading" })
    setLoadedView(null)
    if (remoteMode) {
      if (sessionId === null) return () => { active = false }
      void loadRemoteEvaluation(role, requestedView).then((state) => {
        if (active) installRemoteState(state, requestedView)
      }).catch((error: unknown) => {
        if (active) failLoad(error)
      })
    } else {
      try {
        const repository = createLocalStorageEvaluationRepository({ storage: window.localStorage })
        repositoryRef.current = repository
        const loaded = repository.loadSnapshot()
        queueMicrotask(() => {
          if (active) {
            setLoadedView("default")
            commitSnapshot(loaded)
          }
        })
      } catch (error) {
        queueMicrotask(() => { if (active) failLoad(error) })
      }
    }
    return () => { active = false }
  }, [commitSnapshot, failLoad, installRemoteState, remoteMode, requestedView, role, sessionId])

  useEffect(() => () => remoteWriteQueue.dispose(), [remoteWriteQueue])

  const actor = useMemo<RepositoryActor>(() => {
    const evaluatorId = activeEvaluatorId || snapshot?.evaluators[0]?.id || "unlinked-evaluator"
    const id = role === "evaluator" ? evaluatorId
      : role === "engineer" ? (session?.engineerId ?? "unlinked-engineer")
      : (session?.id ?? `local-${role}`)
    return { id, role }
  }, [activeEvaluatorId, role, session, snapshot])

  const setActiveEvaluatorId = useCallback((evaluatorId: string) => {
    if (role !== "operator") return
    setProxyEvaluatorId(evaluatorId)
    writeSessionSelection(EVALUATOR_KEY, evaluatorId)
  }, [role])

  const setActiveCycleId = useCallback((cycleId: string) => {
    setActiveCycleIdState(cycleId)
    writeSessionSelection(CYCLE_KEY, cycleId)
  }, [])

  const retryLoad = useCallback(() => {
    setLoadState({ status: "loading" })
    if (remoteMode) {
      setLoadedView(null)
      void loadRemoteEvaluation(role, requestedView)
        .then((state) => installRemoteState(state, requestedView))
        .catch(failLoad)
      return
    }
    try {
      const loaded = repositoryRef.current?.loadSnapshot()
      if (loaded !== undefined) commitSnapshot(loaded)
    } catch (error) { failLoad(error) }
  }, [commitSnapshot, failLoad, installRemoteState, remoteMode, requestedView, role])

  const queueRemoteWrite = useCallback((command: RemoteEvaluationCommand, next: EvaluationSnapshot, message?: string) => {
    if (remoteWriteQueue.pendingCount === 0) writeFailedRef.current = false
    const mode: RemoteWriteMode = command.type === "sheet"
      ? (command.operation === "save_draft" ? "draft" : "final")
      : "immediate"
    const key = command.type === "sheet" ? command.sheetId : undefined
    remoteWriteQueue.enqueue({
      mode,
      key,
      message,
      run: async () => {
        try {
          return await persistRemoteEvaluation(command, next, revisionRef.current, role)
        } catch (error) {
          if (command.type !== "sheet") {
            const refreshed = await loadRemoteEvaluation(role, requestedView).catch(() => null)
            if (refreshed !== null) installRemoteState(refreshed, requestedView)
          }
          throw error
        }
      },
    })
  }, [installRemoteState, remoteWriteQueue, requestedView, role])

  const mutate = useCallback<MutateRepository>((mutation, successMessage, remoteCommand) => {
    const repository = repositoryRef.current
    if (repository === null || (remoteMode && remoteCommand === undefined)) return false
    setSaveState("saving")
    setErrorMessage(null)
    try {
      const next = mutation(repository)
      commitSnapshot(next)
      if (remoteMode && remoteCommand !== undefined) queueRemoteWrite(remoteCommand, next, successMessage)
      else {
        setSaveState("saved")
        if (successMessage) toast.success(successMessage)
      }
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장 중 오류가 발생했습니다."
      setSaveState("error")
      setErrorMessage(message)
      toast.error(message)
      return false
    }
  }, [commitSnapshot, queueRemoteWrite, remoteMode])

  const actions = useMemo(() => createEvaluationActions({
    activeCycleId, actor, mutate, selectCycle: setActiveCycleId, snapshot,
  }), [activeCycleId, actor, mutate, setActiveCycleId, snapshot])

  const value = useMemo<EvaluationContextValue>(() => {
    const projectionMatches = !remoteMode || loadedView === requestedView
    return {
      snapshot: projectionMatches ? snapshot : null,
      role,
      canViewInsights,
      activeCycleId,
      activeEvaluatorId,
      backendMode: remoteMode ? "supabase" : "local",
      saveState,
      loadState: projectionMatches ? loadState : { status: "loading" },
      errorMessage,
      setActiveCycleId,
      setActiveEvaluatorId,
      retryLoad,
      ...actions,
    }
  }, [remoteMode, loadedView, requestedView, snapshot, role, canViewInsights, activeCycleId,
    activeEvaluatorId, saveState, loadState, errorMessage, setActiveCycleId,
    setActiveEvaluatorId, retryLoad, actions])

  return <EvaluationContext value={value}>{children}</EvaluationContext>
}

export function useEvaluation(): EvaluationContextValue {
  const context = useContext(EvaluationContext)
  if (context === null) throw new Error("useEvaluation must be used within EvaluationProvider")
  return context
}
