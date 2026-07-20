import type { ReactNode } from "react"

export type AppShellRole = "operator" | "evaluator" | "approver" | "engineer"

export type AppShellSaveState =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "locked"

export interface AppShellCycleOption {
  readonly id: string
  readonly label: string
  readonly disabled?: boolean
}

export interface AppShellEvaluatorOption {
  readonly id: string
  readonly label: string
}

export interface AppShellProps {
  readonly children: ReactNode
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

export const APP_SHELL_ROLE_LABELS: Readonly<Record<AppShellRole, string>> = {
  operator: "운영자",
  evaluator: "평가자",
  approver: "승인자",
  engineer: "엔지니어",
}

export const APP_SHELL_HOME_PATHS: Readonly<Record<AppShellRole, string>> = {
  operator: "/dashboard",
  evaluator: "/today",
  approver: "/dashboard",
  engineer: "/my",
}
