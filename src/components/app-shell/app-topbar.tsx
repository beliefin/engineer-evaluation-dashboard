"use client"

import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { AppBrand } from "./app-sidebar"
import { MobileMenu } from "./mobile-menu"
import { SampleDataBadge } from "./sample-data-badge"
import { SaveStateIndicator } from "./save-state-indicator"
import { ShellControls } from "./shell-controls"
import {
  APP_SHELL_HOME_PATHS,
  type AppShellCycleOption,
  type AppShellEvaluatorOption,
  type AppShellRole,
  type AppShellSaveState,
} from "./types"

interface AppTopbarProps {
  readonly role: AppShellRole
  readonly cycles: readonly AppShellCycleOption[]
  readonly evaluatorOptions: readonly AppShellEvaluatorOption[]
  readonly activeCycleId: string
  readonly activeEvaluatorId: string
  readonly saveState: AppShellSaveState
  readonly onCycleChange: (cycleId: string) => void
  readonly onEvaluatorChange: (evaluatorId: string) => void
  readonly onLogout: () => void
  readonly actorLabel?: string | undefined
}

export function AppTopbar({
  role,
  cycles,
  evaluatorOptions,
  activeCycleId,
  activeEvaluatorId,
  saveState,
  onCycleChange,
  onEvaluatorChange,
  onLogout,
  actorLabel,
}: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-[52px] items-center border-b border-border bg-card px-3 sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
        <MobileMenu
          activeCycleId={activeCycleId}
          activeEvaluatorId={activeEvaluatorId}
          actorLabel={actorLabel}
          cycles={cycles}
          evaluatorOptions={evaluatorOptions}
          onCycleChange={onCycleChange}
          onEvaluatorChange={onEvaluatorChange}
          onLogout={onLogout}
          role={role}
        />
        <AppBrand compact href={APP_SHELL_HOME_PATHS[role]} />
      </div>

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="truncate text-xs text-muted-foreground">
          평가 운영 콘솔 · 모든 점수는 0~100 기준
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 lg:gap-3">
        <div className="hidden lg:block">
          <ShellControls
            activeCycleId={activeCycleId}
            activeEvaluatorId={activeEvaluatorId}
            cycles={cycles}
            evaluatorOptions={evaluatorOptions}
            idPrefix="desktop-shell"
            onCycleChange={onCycleChange}
            onEvaluatorChange={onEvaluatorChange}
            role={role}
          />
        </div>
        <span aria-hidden="true" className="hidden h-5 w-px bg-border lg:block" />
        <SaveStateIndicator compact={false} state={saveState} />
        <SampleDataBadge />
        <Button
          aria-label={`${actorLabel ?? "현재 계정"} 로그아웃`}
          className="hidden lg:inline-flex"
          onClick={onLogout}
          size="sm"
          type="button"
          variant="ghost"
        >
          <LogOutIcon aria-hidden="true" />
          로그아웃
        </Button>
      </div>
    </header>
  )
}
