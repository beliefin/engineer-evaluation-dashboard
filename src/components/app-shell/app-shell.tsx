"use client"

import { SampleDataBadge } from "./sample-data-badge"
import { SaveStateIndicator } from "./save-state-indicator"
import { AppTopbar } from "./app-topbar"
import type { AppShellProps } from "./types"

export function AppShell({
  children,
  role,
  canViewInsights,
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
    <div className="signal-shell min-h-dvh w-full bg-background">
      <a
        className="fixed top-2 left-2 z-[100] -translate-y-16 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:translate-y-0"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>
      <div className="signal-shell-inner">
        <AppTopbar
          activeCycleId={activeCycleId}
          activeEvaluatorId={activeEvaluatorId}
          actorLabel={actorLabel}
          canViewInsights={canViewInsights}
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
          className="signal-main print:max-w-none print:p-0"
          id="main-content"
        >
          {children}
        </main>
        <footer className="signal-footer print:hidden"><span>엔지니어 역량평가 <span aria-hidden="true">│</span> {cycles.find((cycle) => cycle.id === activeCycleId)?.label}</span><span className="signal-footer-status"><SaveStateIndicator compact={false} state={saveState} /><SampleDataBadge /></span></footer>
      </div>
    </div>
  )
}
