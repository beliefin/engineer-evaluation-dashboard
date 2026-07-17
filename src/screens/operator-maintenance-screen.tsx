"use client"

import { useEffect, useState } from "react"
import { ArchiveRestoreIcon, DatabaseBackupIcon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"

import { createEvaluationBackup, loadOperatorMaintenance, restoreEvaluationBackup, type EvaluationBackup, type OperatorMaintenance } from "@/backend/operator-maintenance"
import { resetRosterInitialPasswords } from "@/backend/account-maintenance"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEvaluation } from "@/providers"

const OPERATION_LABELS: Readonly<Record<string, string>> = {
  backup_created: "백업 생성", state_restored: "백업 복구", save_draft: "평가 초안 저장",
  submit_sheet: "평가 제출", account_created: "계정 생성", account_updated: "계정 수정",
  password_reset: "비밀번호 재설정",
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function OperatorMaintenanceScreen() {
  const { backendMode, retryLoad } = useEvaluation()
  const [data, setData] = useState<OperatorMaintenance | null>(null)
  const [label, setLabel] = useState("")
  const [restoreTarget, setRestoreTarget] = useState<EvaluationBackup | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (backendMode !== "supabase") return
    setPending(true); setError(null)
    try { setData(await loadOperatorMaintenance()) }
    catch (caught) { setError(caught instanceof Error ? caught.message : "운영 이력을 불러오지 못했습니다.") }
    finally { setPending(false) }
  }

  useEffect(() => {
    if (backendMode !== "supabase") return
    let active = true
    void loadOperatorMaintenance().then((next) => {
      if (active) setData(next)
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : "운영 이력을 불러오지 못했습니다.")
    }).finally(() => {
      if (active) setPending(false)
    })
    return () => { active = false }
  }, [backendMode])

  async function handleCreateBackup() {
    const nextLabel = label.trim()
    if (nextLabel.length === 0) { setError("백업 이름을 입력해 주세요."); return }
    setPending(true); setError(null)
    try { setData(await createEvaluationBackup(nextLabel)); setLabel(""); toast.success("현재 평가 데이터를 백업했습니다.") }
    catch (caught) { setError(caught instanceof Error ? caught.message : "백업을 만들지 못했습니다.") }
    finally { setPending(false) }
  }

  async function handleRestore() {
    if (restoreTarget === null || data === null) return
    setPending(true); setError(null)
    try {
      setData(await restoreEvaluationBackup(restoreTarget.id, data.currentRevision))
      setRestoreTarget(null); retryLoad(); toast.success("선택한 백업으로 평가 데이터를 복구했습니다.")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "백업을 복구하지 못했습니다."); setRestoreTarget(null)
    } finally { setPending(false) }
  }

  async function handleResetRosterPasswords() {
    setPending(true); setError(null)
    try {
      const count = await resetRosterInitialPasswords()
      toast.success(`${count}개 명단 연결 계정의 초기 비밀번호를 사번 4자리로 설정했습니다.`)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "초기 비밀번호를 적용하지 못했습니다.")
      setPending(false)
    }
  }

  if (backendMode !== "supabase") {
    return <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">백업과 변경 이력은 서버 연결 모드에서 사용할 수 있습니다.</p>
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-xs font-semibold tracking-[0.08em] text-primary uppercase">운영 안전</p><h1 className="text-[26px] font-bold tracking-[-0.02em] sm:text-3xl">백업 및 변경 이력</h1><p className="mt-2 text-sm text-muted-foreground">중요 변경 전 상태를 저장하고, 누가 어떤 데이터를 변경했는지 확인합니다.</p></div>
        <Button disabled={pending} onClick={() => void refresh()} type="button" variant="outline"><RefreshCwIcon aria-hidden="true" />새로고침</Button>
      </header>
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{error}</p> : null}
      <section className="flex flex-col gap-3 rounded-lg border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">명단 계정 초기 비밀번호</h2><p className="mt-1 text-sm text-muted-foreground">엔지니어·평가자 계정 비밀번호를 연결 명단의 사번 4자리로 맞추고 다음 로그인 시 변경 안내를 표시합니다.</p></div><Button disabled={pending} onClick={() => void handleResetRosterPasswords()} type="button" variant="outline">사번 4자리 적용</Button></section>
      <section className="rounded-lg border bg-card" aria-labelledby="backup-heading">
        <div className="border-b px-5 py-4"><h2 className="font-semibold" id="backup-heading">평가 데이터 백업</h2><p className="mt-1 text-sm text-muted-foreground">복구 시 현재 상태를 자동으로 한 번 더 백업합니다.</p></div>
        <div className="grid gap-3 border-b p-5 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="backup-label">백업 이름</Label><Input id="backup-label" maxLength={100} onChange={(event) => setLabel(event.currentTarget.value)} placeholder="예: 평가 시작 전 설정" value={label} /></div><Button disabled={pending} onClick={() => void handleCreateBackup()} type="button"><DatabaseBackupIcon aria-hidden="true" />현재 상태 백업</Button></div>
        <ul className="divide-y">{data?.backups.length ? data.backups.map((backup) => <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={backup.id}><div><p className="font-medium">{backup.label}</p><p className="mt-1 text-xs text-muted-foreground">revision {backup.revision} · {formatDate(backup.createdAt)} · {backup.createdBy ?? "시스템"}</p></div><Button disabled={pending} onClick={() => setRestoreTarget(backup)} size="sm" type="button" variant="outline"><ArchiveRestoreIcon aria-hidden="true" />이 상태로 복구</Button></li>) : <li className="px-5 py-8 text-center text-sm text-muted-foreground">저장된 백업이 없습니다.</li>}</ul>
      </section>
      <section className="overflow-hidden rounded-lg border bg-card" aria-labelledby="audit-heading">
        <div className="border-b px-5 py-4"><h2 className="font-semibold" id="audit-heading">최근 변경 이력</h2><p className="mt-1 text-sm text-muted-foreground">최근 100건을 최신순으로 표시합니다.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted/50 text-left"><tr><th className="px-4 py-3">시각</th><th className="px-4 py-3">작업</th><th className="px-4 py-3">사용자</th><th className="px-4 py-3">대상</th><th className="px-4 py-3 text-right">revision</th></tr></thead><tbody className="divide-y">{data?.auditEvents.map((event) => <tr key={event.id}><td className="px-4 py-3 text-muted-foreground">{formatDate(event.createdAt)}</td><td className="px-4 py-3 font-medium">{OPERATION_LABELS[event.operation] ?? event.operation}</td><td className="px-4 py-3">{event.actorName}</td><td className="max-w-52 truncate px-4 py-3 text-muted-foreground">{event.targetId ?? "-"}</td><td className="px-4 py-3 text-right tabular-nums">{event.revision}</td></tr>)}</tbody></table></div>
      </section>
      <Dialog onOpenChange={(open) => { if (!open) setRestoreTarget(null) }} open={restoreTarget !== null}><DialogContent showCloseButton={false}><DialogHeader><DialogTitle>백업을 복구할까요?</DialogTitle><DialogDescription>현재 평가 데이터는 자동 백업한 뒤 ‘{restoreTarget?.label}’ 상태로 교체됩니다.</DialogDescription></DialogHeader><DialogFooter><Button disabled={pending} onClick={() => setRestoreTarget(null)} type="button" variant="outline">취소</Button><Button disabled={pending} onClick={() => void handleRestore()} type="button" variant="destructive">복구 실행</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
