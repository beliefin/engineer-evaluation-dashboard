"use client"

import { AppSidebar } from "./app-sidebar"
import { AppTopbar } from "./app-topbar"
import type { AppShellProps } from "./types"

export function AppShell({
  children,
  role,
  availableRoles,
  cycles,
  evaluatorOptions,
  activeCycleId,
  activeEvaluatorId,
  saveState,
  onCycleChange,
  onEvaluatorChange,
  onLogout,
  onRoleChange,
  actorLabel,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <a
        className="fixed top-2 left-2 z-[100] -translate-y-16 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:translate-y-0"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>
      <AppSidebar actorLabel={actorLabel} role={role} />
      <div className="min-w-0 flex-1">
        <AppTopbar
          activeCycleId={activeCycleId}
          activeEvaluatorId={activeEvaluatorId}
          actorLabel={actorLabel}
          availableRoles={availableRoles}
          cycles={cycles}
          evaluatorOptions={evaluatorOptions}
          onCycleChange={onCycleChange}
          onEvaluatorChange={onEvaluatorChange}
          onLogout={onLogout}
          onRoleChange={onRoleChange}
          role={role}
          saveState={saveState}
        />
        <main
          className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-5 lg:px-6 lg:py-8"
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
