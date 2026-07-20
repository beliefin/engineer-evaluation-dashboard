"use client"

import { LogOut, RefreshCw, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

import { ErrorState, LoadingPageSkeleton } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { InitialPasswordChangeDialog } from "@/features/auth"
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
import { APP_SHELL_HOME_PATHS, type AppShellRole } from "./types"

export function RemoteEvaluationLoadError({
  description,
  onLogout,
  onRetry,
}: Readonly<{
  description: string
  onLogout: () => void
  onRetry: () => void
}>) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1440px] items-center px-4 py-6 sm:px-5 lg:px-6">
      <ErrorState
        action={(
          <>
            <Button onClick={onRetry} type="button" variant="outline">
              <RefreshCw aria-hidden="true" />
              다시 시도
            </Button>
            <Button onClick={onLogout} type="button" variant="outline">
              <LogOut aria-hidden="true" />
              로그아웃
            </Button>
          </>
        )}
        className="mx-auto w-full max-w-2xl"
        description={description}
        title="운영 데이터를 불러오지 못했습니다"
      />
    </main>
  )
}

export function ConnectedAppShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter()
  const {
    session,
    loadState: authLoadState,
    errorMessage: authErrorMessage,
    logout,
    switchRole,
    pending: authPending,
    changeOwnPassword,
  } = useAuth()
  const [postponedPasswordChangeFor, setPostponedPasswordChangeFor] = useState<string | null>(null)
  const {
    snapshot,
    role,
    activeCycleId,
    activeEvaluatorId,
    backendMode,
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

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  if (authLoadState === "error") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[1440px] items-center px-4 py-6 sm:px-5 lg:px-6">
        <ErrorState
          description={authErrorMessage ?? "로그인 정보를 불러오지 못했습니다."}
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
      if (backendMode === "supabase") {
        return (
          <RemoteEvaluationLoadError
            description={errorMessage ?? loadState.error.message}
            onLogout={handleLogout}
            onRetry={retryLoad}
          />
        )
      }
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

  function handleRoleChange(nextRole: AppShellRole) {
    switchRole(nextRole)
    router.replace(APP_SHELL_HOME_PATHS[nextRole])
  }

  return (
    <>
      <AppShell
      activeCycleId={activeCycleId}
      activeEvaluatorId={activeEvaluatorId}
      actorLabel={session.displayName}
      canViewInsights={session.canViewInsights}
      availableRoles={session.roles}
      cycles={snapshot.cycles.map((cycle) => ({ id: cycle.id, label: cycle.name }))}
      evaluatorOptions={snapshot.evaluators.map((evaluator) => ({
        id: evaluator.id,
        label: evaluator.displayName,
      }))}
      onCycleChange={setActiveCycleId}
      onEvaluatorChange={setActiveEvaluatorId}
      onLogout={handleLogout}
      onRoleChange={handleRoleChange}
      role={role}
      saveState={saveState}
    >
      {children}
      </AppShell>
      <InitialPasswordChangeDialog
        key={session.id}
        onChangePassword={changeOwnPassword}
        onPostpone={() => setPostponedPasswordChangeFor(session.id)}
        open={session.mustChangePassword && postponedPasswordChangeFor !== session.id}
        pending={authPending}
      />
    </>
  )
}
