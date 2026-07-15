"use client"

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import {
  loadRemoteEvaluation, persistRemoteEvaluation, type RemoteEvaluationCommand,
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

function readSessionSelection(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function EvaluationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { session } = useAuth()
  const remoteMode = isSupabaseConfigured()
  const sessionId = remoteMode ? (session?.id ?? null) : null
  const repositoryRef = useRef<EvaluationRepository | null>(null)
  const revisionRef = useRef(0)
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve())
  const pendingWritesRef = useRef(0)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [snapshot, setSnapshot] = useState<EvaluationSnapshot | null>(null)
  const [activeCycleId, setActiveCycleIdState] = useState("")
  const [proxyEvaluatorId, setProxyEvaluatorId] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [loadState, setLoadState] = useState<EvaluationLoadState>({ status: "loading" })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const role = session?.role ?? "operator"
  const activeEvaluatorId = role === "evaluator" ? (session?.evaluatorId ?? "") : proxyEvaluatorId

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

  const installRemoteState = useCallback((state: Awaited<ReturnType<typeof loadRemoteEvaluation>>) => {
    revisionRef.current = state.revision
    repositoryRef.current = createSnapshotRepository(state.snapshot)
    commitSnapshot(state.snapshot)
  }, [commitSnapshot])

  useEffect(() => {
    let active = true
    setLoadState({ status: "loading" })
    if (remoteMode) {
      if (sessionId === null) return () => { active = false }
      void loadRemoteEvaluation().then((state) => {
        if (active) installRemoteState(state)
      }).catch((error: unknown) => {
        if (active) failLoad(error)
      })
    } else {
      try {
        const repository = createLocalStorageEvaluationRepository({ storage: window.localStorage })
        repositoryRef.current = repository
        const loaded = repository.loadSnapshot()
        queueMicrotask(() => { if (active) commitSnapshot(loaded) })
      } catch (error) {
        queueMicrotask(() => { if (active) failLoad(error) })
      }
    }
    return () => { active = false }
  }, [commitSnapshot, failLoad, installRemoteState, remoteMode, sessionId])

  useEffect(() => () => {
    if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current)
  }, [])

  const actor = useMemo<RepositoryActor>(() => {
    const evaluatorId = activeEvaluatorId || snapshot?.evaluators[0]?.id || "unlinked-evaluator"
    const id = role === "evaluator" ? evaluatorId
      : role === "engineer" ? (session?.engineerId ?? "unlinked-engineer")
      : (session?.id ?? `local-${role}`)
    return { id, role }
  }, [activeEvaluatorId, role, session, snapshot])

  const setActiveEvaluatorId = useCallback((evaluatorId: string) => {
    if (role !== "operator") return
    window.sessionStorage.setItem(EVALUATOR_KEY, evaluatorId)
    setProxyEvaluatorId(evaluatorId)
  }, [role])

  const setActiveCycleId = useCallback((cycleId: string) => {
    window.sessionStorage.setItem(CYCLE_KEY, cycleId)
    setActiveCycleIdState(cycleId)
  }, [])

  const retryLoad = useCallback(() => {
    setLoadState({ status: "loading" })
    if (remoteMode) {
      void loadRemoteEvaluation().then(installRemoteState).catch(failLoad)
      return
    }
    try {
      const loaded = repositoryRef.current?.loadSnapshot()
      if (loaded !== undefined) commitSnapshot(loaded)
    } catch (error) { failLoad(error) }
  }, [commitSnapshot, failLoad, installRemoteState, remoteMode])

  const queueRemoteWrite = useCallback((command: RemoteEvaluationCommand, next: EvaluationSnapshot, message?: string) => {
    pendingWritesRef.current += 1
    setSaveState("saving")
    writeQueueRef.current = writeQueueRef.current.catch(() => undefined).then(async () => {
      try {
        const saved = await persistRemoteEvaluation(command, next, revisionRef.current)
        revisionRef.current = saved.revision
        pendingWritesRef.current -= 1
        if (pendingWritesRef.current === 0) {
          repositoryRef.current = createSnapshotRepository(saved.snapshot)
          commitSnapshot(saved.snapshot)
          setSaveState("saved")
          if (message) toast.success(message)
        }
      } catch (error) {
        pendingWritesRef.current = 0
        const text = error instanceof Error ? error.message : "서버 저장 중 오류가 발생했습니다."
        setSaveState("error")
        setErrorMessage(text)
        toast.error(text)
        try {
          installRemoteState(await loadRemoteEvaluation())
        } catch {
          setErrorMessage(text)
        }
      }
    })
  }, [commitSnapshot, installRemoteState])

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
    activeCycleId, actor, mutate, selectCycle: setActiveCycleId,
  }), [activeCycleId, actor, mutate, setActiveCycleId])

  const value = useMemo<EvaluationContextValue>(() => ({
    snapshot, role, activeCycleId, activeEvaluatorId,
    backendMode: remoteMode ? "supabase" : "local", saveState, loadState, errorMessage,
    setActiveCycleId, setActiveEvaluatorId, retryLoad, ...actions,
  }), [snapshot, role, activeCycleId, activeEvaluatorId, remoteMode, saveState, loadState,
    errorMessage, setActiveCycleId, setActiveEvaluatorId, retryLoad, actions])

  return <EvaluationContext value={value}>{children}</EvaluationContext>
}

export function useEvaluation(): EvaluationContextValue {
  const context = useContext(EvaluationContext)
  if (context === null) throw new Error("useEvaluation must be used within EvaluationProvider")
  return context
}
