"use client"

import { useState } from "react"
import { KeyRoundIcon, PencilIcon, PlusIcon, PowerIcon, Trash2Icon } from "lucide-react"

import type { AuthAccount } from "@/auth"
import { APP_SHELL_ROLE_LABELS } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile"

import { AccountEditorDialog } from "./account-editor-dialog"
import { DeleteAccountDialog } from "./delete-account-dialog"
import { PasswordResetDialog } from "./password-reset-dialog"
import { ToggleAccountDialog } from "./toggle-account-dialog"
import type {
  AccountManagementProps,
  AuthEngineerOption,
  AuthEvaluatorOption,
} from "./types"

type EditorState =
  | Readonly<{ kind: "create" }>
  | Readonly<{ kind: "edit"; account: AuthAccount }>
  | null

type AccountActionsProps = Readonly<{
  account: AuthAccount
  current: boolean
  pending: boolean
  onEdit: () => void
  onReset: () => void
  onToggle: () => void
  onDelete: () => void
}>

function AccountActions({
  account,
  current,
  pending,
  onEdit,
  onReset,
  onToggle,
  onDelete,
}: AccountActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button aria-label={`${account.displayName} 계정 편집`} disabled={pending} onClick={onEdit} size="sm" type="button" variant="ghost"><PencilIcon aria-hidden="true" />편집</Button>
      <Button aria-label={`${account.displayName} 비밀번호 재설정`} disabled={pending} onClick={onReset} size="sm" type="button" variant="ghost"><KeyRoundIcon aria-hidden="true" />비밀번호</Button>
      <Button aria-label={`${account.displayName} 계정 ${account.active ? "비활성화" : "활성화"}`} disabled={current || pending} onClick={onToggle} size="sm" type="button" variant="ghost"><PowerIcon aria-hidden="true" />{account.active ? "비활성" : "활성"}</Button>
      <Button aria-label={`${account.displayName} 계정 삭제`} disabled={current || pending} onClick={onDelete} size="sm" type="button" variant="ghost"><Trash2Icon aria-hidden="true" />삭제</Button>
    </div>
  )
}

function linkedRosterLabel(
  account: AuthAccount,
  evaluatorOptions: ReadonlyArray<AuthEvaluatorOption>,
  engineerOptions: ReadonlyArray<AuthEngineerOption>,
): string {
  const labels: string[] = []
  if (account.roles.includes("evaluator")) {
    labels.push(evaluatorOptions.find((option) => option.id === account.evaluatorId)?.label ?? "평가자 연결 없음")
  }
  if (account.roles.includes("engineer")) {
    labels.push(engineerOptions.find((option) => option.id === account.engineerId)?.label ?? "엔지니어 연결 없음")
  }
  return labels.length > 0 ? labels.join(" · ") : "-"
}

function accountRoleLabel(account: AuthAccount): string {
  return account.roles.map((role) => APP_SHELL_ROLE_LABELS[role]).join(" · ")
}

function accountAccessLabel(account: AuthAccount): string {
  return account.canViewInsights ? " · 현황·분석 열람" : ""
}

export function AccountManagementPanel({
  accounts,
  currentAccountId,
  evaluatorOptions,
  engineerOptions,
  pending = false,
  onCreate,
  onUpdate,
  onResetPassword,
  onDelete,
}: AccountManagementProps) {
  const isMobile = useIsMobile()
  const [editor, setEditor] = useState<EditorState>(null)
  const [resetTarget, setResetTarget] = useState<AuthAccount | null>(null)
  const [toggleTarget, setToggleTarget] = useState<AuthAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AuthAccount | null>(null)
  const activeCount = accounts.filter((account) => account.active).length
  const operatorCount = accounts.filter((account) => account.roles.includes("operator")).length

  function actionsFor(account: AuthAccount) {
    const current = account.id === currentAccountId
    return (
      <AccountActions
        account={account}
        current={current}
        onDelete={() => setDeleteTarget(account)}
        onEdit={() => setEditor({ kind: "edit", account })}
        onReset={() => setResetTarget(account)}
        onToggle={() => setToggleTarget(account)}
        pending={pending}
      />
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-primary uppercase">접근 제어</p>
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] sm:text-3xl">계정 관리</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">로그인 계정, 역할, 명단 연결과 사용 상태를 관리합니다.</p>
        </div>
        <Button disabled={pending} onClick={() => setEditor({ kind: "create" })} type="button"><PlusIcon aria-hidden="true" />계정 추가</Button>
      </header>

      <section aria-label="계정 요약" className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card">
        <div className="px-4 py-4"><p className="text-xs text-muted-foreground">전체</p><p className="mt-1 text-xl font-bold tabular-nums">{accounts.length}</p></div>
        <div className="px-4 py-4"><p className="text-xs text-muted-foreground">활성</p><p className="mt-1 text-xl font-bold tabular-nums text-[var(--success)]">{activeCount}</p></div>
        <div className="px-4 py-4"><p className="text-xs text-muted-foreground">운영자</p><p className="mt-1 text-xl font-bold tabular-nums">{operatorCount}</p></div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="account-list-heading">
        <div className="border-b border-border px-4 py-4 sm:px-5"><h2 className="text-base font-semibold" id="account-list-heading">로그인 계정</h2><p className="mt-1 text-sm text-muted-foreground">현재 로그인 계정은 잠금과 삭제가 제한됩니다.</p></div>
        {isMobile ? (
          <ul className="divide-y divide-border">
            {accounts.map((account) => (
              <li className="space-y-3 px-4 py-4" key={account.id}>
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{account.displayName}</p><p className="mt-0.5 text-xs text-muted-foreground">{account.username}</p></div><Badge variant={account.active ? "secondary" : "destructive"}>{account.active ? "활성" : "비활성"}</Badge></div>
                <p className="text-sm text-muted-foreground">{accountRoleLabel(account)}{accountAccessLabel(account)} · {linkedRosterLabel(account, evaluatorOptions, engineerOptions)}</p>
                {actionsFor(account)}
              </li>
            ))}
          </ul>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>아이디 / 이름</TableHead><TableHead>역할</TableHead><TableHead>연결 대상</TableHead><TableHead>상태</TableHead><TableHead className="text-right">관리</TableHead></TableRow></TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell><span className="block font-semibold">{account.username}</span><span className="mt-0.5 block text-xs text-muted-foreground">{account.displayName}</span></TableCell>
                  <TableCell>{accountRoleLabel(account)}{accountAccessLabel(account)}</TableCell>
                  <TableCell>{linkedRosterLabel(account, evaluatorOptions, engineerOptions)}</TableCell>
                  <TableCell><Badge variant={account.active ? "secondary" : "destructive"}>{account.active ? "활성" : "비활성"}</Badge></TableCell>
                  <TableCell>{actionsFor(account)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {editor ? <AccountEditorDialog account={editor.kind === "edit" ? editor.account : null} currentAccountId={currentAccountId} engineerOptions={engineerOptions} evaluatorOptions={evaluatorOptions} key={editor.kind === "edit" ? editor.account.id : "create"} onCreate={onCreate} onOpenChange={(open) => { if (!open) setEditor(null) }} onUpdate={onUpdate} open pending={pending} /> : null}
      {resetTarget ? <PasswordResetDialog account={resetTarget} key={resetTarget.id} onOpenChange={(open) => { if (!open) setResetTarget(null) }} onReset={onResetPassword} open pending={pending} /> : null}
      {toggleTarget ? <ToggleAccountDialog account={toggleTarget} key={toggleTarget.id} onOpenChange={(open) => { if (!open) setToggleTarget(null) }} onUpdate={onUpdate} open pending={pending} /> : null}
      {deleteTarget ? <DeleteAccountDialog account={deleteTarget} key={deleteTarget.id} onDelete={onDelete} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} open pending={pending} /> : null}
    </div>
  )
}
