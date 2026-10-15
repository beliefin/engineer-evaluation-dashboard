"use client"

import { LogOutIcon, Settings2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import { AppNavigation } from "./app-navigation"
import { MobileMenu } from "./mobile-menu"
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
  readonly canViewInsights: boolean
  readonly availableRoles: readonly AppShellRole[]
  readonly cycles: readonly AppShellCycleOption[]
  readonly evaluatorOptions: readonly AppShellEvaluatorOption[]
  readonly activeCycleId: string
  readonly activeEvaluatorId: string
  readonly saveState: AppShellSaveState
  readonly onCycleChange: (cycleId: string) => void
  readonly onEvaluatorChange: (evaluatorId: string) => void
  readonly onLogout: () => void
  readonly onRoleChange: (role: AppShellRole) => void
  readonly actorLabel?: string | undefined
}

export function AppTopbar({
  role,
  canViewInsights,
  availableRoles,
  cycles,
  evaluatorOptions,
  activeCycleId,
  activeEvaluatorId,
  onCycleChange,
  onEvaluatorChange,
  onLogout,
  onRoleChange,
  actorLabel,
}: AppTopbarProps) {
  return (
    <header className="signal-topbar signal-shell-topbar print:hidden">
      <div className="signal-mobile-menu">
        <MobileMenu activeCycleId={activeCycleId} activeEvaluatorId={activeEvaluatorId} actorLabel={actorLabel} canViewInsights={canViewInsights} availableRoles={availableRoles} cycles={cycles} evaluatorOptions={evaluatorOptions} onCycleChange={onCycleChange} onEvaluatorChange={onEvaluatorChange} onLogout={onLogout} onRoleChange={onRoleChange} role={role} />
      </div>
      <Link className="signal-brand" aria-label="엔지니어 역량평가 메인으로 이동" href={APP_SHELL_HOME_PATHS[role]}>엔지니어 역량평가</Link>
      <div className="signal-primary-navigation"><AppNavigation layout="horizontal" role={role} canViewInsights={canViewInsights} /></div>
      <div className="signal-topbar-controls">
        <select className="signal-cycle" aria-label="평가 시즌" value={activeCycleId} onChange={(event) => onCycleChange(event.currentTarget.value)}>
          {cycles.map((cycle) => <option disabled={cycle.disabled ?? false} key={cycle.id} value={cycle.id}>{cycle.label}</option>)}
        </select>
        <details className="signal-account-menu">
          <summary aria-label="계정 및 운영 메뉴"><Settings2 size={20} aria-hidden="true" /></summary>
          <div className="signal-account-panel">
            <p className="signal-shell-actor font-bold">{actorLabel ?? "현재 계정"}</p>
            <ShellControls activeCycleId={activeCycleId} availableRoles={availableRoles} activeEvaluatorId={activeEvaluatorId} cycles={cycles} evaluatorOptions={evaluatorOptions} idPrefix="desktop-shell" onCycleChange={onCycleChange} onEvaluatorChange={onEvaluatorChange} onRoleChange={onRoleChange} role={role} orientation="vertical" />
            <AppNavigation layout="secondary" role={role} canViewInsights={canViewInsights} />
            <Button className="signal-shell-logout" aria-label={`${actorLabel ?? "현재 계정"} 로그아웃`} onClick={onLogout} size="sm" type="button" variant="outline"><LogOutIcon aria-hidden="true" />로그아웃</Button>
          </div>
        </details>
      </div>
    </header>
  )
}
