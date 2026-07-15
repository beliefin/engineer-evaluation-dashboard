"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import type {
  EvaluationSnapshot,
  Role,
} from "@/domain"
import {
  createLocalStorageEvaluationRepository,
  type EvaluationRepository,
  type RepositoryActor,
} from "@/repository"

import {
  createEvaluationActions,
  type EvaluationActions,
  type MutateRepository,
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
  saveState: SaveState
  loadState: EvaluationLoadState
  errorMessage: string | null
  setActiveCycleId: (cycleId: string) => void
  setActiveEvaluatorId: (evaluatorId: string) => void
  retryLoad: () => void
}> & EvaluationActions

const EvaluationContext = createContext<EvaluationContextValue | null>(null)
const DEMO_EVALUATOR_KEY = "engineer-evaluation-dashboard:demo-evaluator"
const DEMO_CYCLE_KEY = "engineer-evaluation-dashboard:demo-cycle"
const LOAD_ERROR_MESSAGE =
  "샘플 데이터를 불러오지 못했습니다. 다시 시도하거나 샘플 데이터로 복구해 주세요."

export function EvaluationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { session } = useAuth()
  const repositoryRef = useRef<EvaluationRepository | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [snapshot, setSnapshot] = useState<EvaluationSnapshot | null>(null)
  const [activeCycleId, setActiveCycleIdState] = useState("")
  const [proxyEvaluatorId, setProxyEvaluatorId] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [loadState, setLoadState] = useState<EvaluationLoadState>({ status: "loading" })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const role = session?.role ?? "operator"
  const activeEvaluatorId = role === "evaluator"
    ? (session?.evaluatorId ?? "")
    : proxyEvaluatorId

  const commitSnapshot = useCallback((loaded: EvaluationSnapshot) => {
    setSnapshot(loaded)
    setActiveCycleIdState((current) =>
      loaded.cycles.some((cycle) => cycle.id === current)
        ? current
        : (loaded.cycles[0]?.id ?? ""),
    )
    setProxyEvaluatorId((current) =>
      loaded.evaluators.some((evaluator) => evaluator.id === current)
        ? current
        : (loaded.evaluators[0]?.id ?? ""),
    )
    setLoadState({ status: "ready" })
    setErrorMessage(null)
  }, [])

  const failLoad = useCallback((error: unknown) => {
    const kind =
      error instanceof DOMException && error.name === "SecurityError"
        ? "storage_unavailable"
        : "repository_load_failed"
    setSnapshot(null)
    setLoadState({ status: "error", error: { kind, message: LOAD_ERROR_MESSAGE } })
  }, [])

  useEffect(() => {
    const repository = createLocalStorageEvaluationRepository({ storage: window.localStorage })
    repositoryRef.current = repository
    let active = true

    try {
      const loaded = repository.loadSnapshot()
      const storedEvaluatorId = window.sessionStorage.getItem(DEMO_EVALUATOR_KEY)
      const storedCycleId = window.sessionStorage.getItem(DEMO_CYCLE_KEY)
      queueMicrotask(() => {
        if (!active) return
        if (storedEvaluatorId !== null) setProxyEvaluatorId(storedEvaluatorId)
        if (storedCycleId !== null) setActiveCycleIdState(storedCycleId)
        commitSnapshot(loaded)
      })
    } catch (error) {
      queueMicrotask(() => {
        if (active) failLoad(error)
      })
    }
    return () => {
      active = false
    }
  }, [commitSnapshot, failLoad])

  useEffect(
    () => () => {
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current)
    },
    [],
  )

  const actor = useMemo<RepositoryActor>(() => {
    const evaluatorId = activeEvaluatorId || snapshot?.evaluators[0]?.id || "demo-evaluator"
    const id = role === "evaluator"
      ? evaluatorId
      : role === "engineer"
        ? (session?.engineerId ?? "unlinked-engineer")
        : (session?.id ?? `demo-${role}`)
    return { id, role }
  }, [activeEvaluatorId, role, session, snapshot])

  const setActiveEvaluatorId = useCallback((evaluatorId: string) => {
    if (role !== "operator") return
    window.sessionStorage.setItem(DEMO_EVALUATOR_KEY, evaluatorId)
    setProxyEvaluatorId(evaluatorId)
  }, [role])

  const setActiveCycleId = useCallback((cycleId: string) => {
    window.sessionStorage.setItem(DEMO_CYCLE_KEY, cycleId)
    setActiveCycleIdState(cycleId)
  }, [])

  const retryLoad = useCallback(() => {
    const repository = repositoryRef.current
    if (repository === null) return

    setLoadState({ status: "loading" })
    queueMicrotask(() => {
      try {
        commitSnapshot(repository.loadSnapshot())
      } catch (error) {
        failLoad(error)
      }
    })
  }, [commitSnapshot, failLoad])

  const mutate = useCallback<MutateRepository>((mutation, successMessage) => {
    const repository = repositoryRef.current
    if (repository === null) return false

    setSaveState("saving")
    setErrorMessage(null)
    try {
      const next = mutation(repository)
      commitSnapshot(next)
      setSaveState("saved")
      if (successMessage) toast.success(successMessage)
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => setSaveState("idle"), 1_800)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장 중 오류가 발생했습니다."
      setSaveState("error")
      setErrorMessage(message)
      toast.error(message)
      return false
    }
  }, [commitSnapshot])

  const actions = useMemo(
    () => createEvaluationActions({
      activeCycleId,
      actor,
      mutate,
      selectCycle: setActiveCycleId,
    }),
    [activeCycleId, actor, mutate, setActiveCycleId],
  )

  const value = useMemo<EvaluationContextValue>(
    () => ({
      snapshot,
      role,
      activeCycleId,
      activeEvaluatorId,
      saveState,
      loadState,
      errorMessage,
      setActiveCycleId,
      setActiveEvaluatorId,
      retryLoad,
      ...actions,
    }),
    [
      activeCycleId,
      activeEvaluatorId,
      actions,
      errorMessage,
      loadState,
      retryLoad,
      role,
      saveState,
      setActiveCycleId,
      setActiveEvaluatorId,
      snapshot,
    ],
  )

  return <EvaluationContext value={value}>{children}</EvaluationContext>
}

export function useEvaluation(): EvaluationContextValue {
  const context = useContext(EvaluationContext)
  if (context === null) throw new Error("useEvaluation must be used within EvaluationProvider")
  return context
}
