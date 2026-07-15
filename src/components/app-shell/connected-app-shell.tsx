"use client"

import { RefreshCw, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

import { ErrorState, LoadingPageSkeleton } from "@/components/shared"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth, useEvaluation } from "@/providers"

import { AppShell } from "./app-shell"

export function ConnectedAppShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter()
  const {
    session,
    loadState: authLoadState,
    errorMessage: authErrorMessage,
    logout,
  } = useAuth()
  const {
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
    resetDemoData,
  } = useEvaluation()

  useEffect(() => {
    if (authLoadState === "ready" && session === null) router.replace("/login")
  }, [authLoadState, router, session])

  if (authLoadState === "error") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[1440px] items-center px-4 py-6 sm:px-5 lg:px-6">
        <ErrorState
          description={authErrorMessage ?? "샘플 인증 저장소를 불러오지 못했습니다."}
          title="로그인 정보를 불러오지 못했습니다"
        />
      </main>
    )
  }

  if (authLoadState === "loading" || session === null) {
    return (
      <div className="mx-auto min-h-dvh max-w-[1440px] px-4 py-6 sm:px-5 lg:px-6">
        <LoadingPageSkeleton />
      </div>
    )
  }

  switch (loadState.status) {
    case "error":
      return (
        <main className="mx-auto flex min-h-dvh max-w-[1440px] items-center px-4 py-6 sm:px-5 lg:px-6">
          <Dialog>
            <ErrorState
              action={
                <>
                  <Button onClick={retryLoad} type="button" variant="outline">
                    <RefreshCw aria-hidden="true" />
                    다시 시도
                  </Button>
                  <DialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <RotateCcw aria-hidden="true" />
                      샘플 데이터 초기화
                    </Button>
                  </DialogTrigger>
                </>
              }
              className="mx-auto w-full max-w-2xl"
              description={errorMessage ?? loadState.error.message}
              title="샘플 데이터를 불러오지 못했습니다"
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>샘플 데이터를 초기화할까요?</DialogTitle>
                <DialogDescription>
                  이 브라우저에 저장된 데모 변경 내용을 지우고 최초 샘플 상태로
                  복구합니다. 기존 변경 내용은 복원할 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    취소
                  </Button>
                </DialogClose>
                <Button onClick={resetDemoData} type="button" variant="destructive">
                  초기화 실행
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      )
    case "loading":
      return (
        <div className="mx-auto min-h-dvh max-w-[1440px] px-4 py-6 sm:px-5 lg:px-6">
          <LoadingPageSkeleton />
        </div>
      )
    case "ready":
      break
    default: {
      const exhaustiveState: never = loadState
      return exhaustiveState
    }
  }

  if (snapshot === null) {
    return null
  }

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  return (
    <AppShell
      activeCycleId={activeCycleId}
      activeEvaluatorId={activeEvaluatorId}
      actorLabel={session.displayName}
      cycles={snapshot.cycles.map((cycle) => ({ id: cycle.id, label: cycle.name }))}
      evaluatorOptions={snapshot.evaluators.map((evaluator) => ({
        id: evaluator.id,
        label: evaluator.displayName,
      }))}
      onCycleChange={setActiveCycleId}
      onEvaluatorChange={setActiveEvaluatorId}
      onLogout={handleLogout}
      role={role}
      saveState={saveState}
    >
      {children}
    </AppShell>
  )
}
