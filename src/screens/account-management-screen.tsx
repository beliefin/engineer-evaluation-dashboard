"use client"

import { AccountManagementPanel } from "@/features/auth"
import { useAuth, useEvaluation } from "@/providers"

export function AccountManagementScreen() {
  const {
    session,
    accounts,
    pending,
    createAccount,
    updateAccount,
    resetPassword,
    deleteAccount,
  } = useAuth()
  const { snapshot } = useEvaluation()
  if (session === null || snapshot === null) return null

  return (
    <AccountManagementPanel
      accounts={accounts}
      currentAccountId={session.id}
      evaluatorOptions={snapshot.evaluators.map((evaluator) => ({
        id: evaluator.id,
        label: `${evaluator.displayName} · ${evaluator.employeeCode}`,
      }))}
      engineerOptions={snapshot.engineers.map((engineer) => ({
        id: engineer.id,
        label: `${engineer.displayName} · ${engineer.employeeCode}`,
      }))}
      onCreate={createAccount}
      onDelete={deleteAccount}
      onResetPassword={resetPassword}
      onUpdate={updateAccount}
      pending={pending}
    />
  )
}
