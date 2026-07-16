"use client"

import { CircleAlert, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type {
  EngineerScoreAdjustmentViewModel,
  ScoreAdjustmentDraft,
  ScoreAdjustmentEntryViewModel,
} from "./types"

type ScoreAdjustmentPanelProps = Readonly<{
  rows: ReadonlyArray<EngineerScoreAdjustmentViewModel>
  disabled: boolean
  onSave: (adjustment: ScoreAdjustmentDraft) => boolean
  onDelete: (adjustmentId: string) => boolean
}>

function formatScore(value: number | null): string {
  return value === null ? "미확정" : value.toFixed(2)
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`
}

export function ScoreAdjustmentPanel({
  rows,
  disabled,
  onSave,
  onDelete,
}: ScoreAdjustmentPanelProps) {
  const [selectedEngineerId, setSelectedEngineerId] = useState(rows[0]?.engineerId ?? "")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const effectiveEngineerId = rows.some((row) => row.engineerId === selectedEngineerId)
    ? selectedEngineerId
    : (rows[0]?.engineerId ?? "")
  const selected = rows.find((row) => row.engineerId === effectiveEngineerId)
  const numericAmount = Number(amount)
  const preview = selected?.baseScore === null || selected?.baseScore === undefined || !Number.isFinite(numericAmount)
    ? null
    : Math.min(100, Math.max(0, selected.baseScore + selected.adjustmentTotal + numericAmount))

  function saveAdjustment() {
    if (!Number.isFinite(numericAmount) || numericAmount === 0 || numericAmount < -100 || numericAmount > 100) {
      setError("0이 아닌 가점 또는 감점 값을 입력해 주세요.")
      return
    }
    const trimmedReason = reason.trim()
    if (trimmedReason.length === 0) {
      setError("가·감점 적용 사유를 입력해 주세요.")
      return
    }
    if (selected === undefined) {
      setError("가·감점을 적용할 엔지니어를 선택해 주세요.")
      return
    }
    const saved = onSave({
      adjustmentId: null,
      engineerId: selected.engineerId,
      amount: numericAmount,
      reason: trimmedReason,
    })
    if (saved) {
      setAmount("")
      setReason("")
      setError(null)
    }
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm font-semibold">등록된 엔지니어가 없습니다.</p>
        <p className="mt-1 text-sm text-muted-foreground">명단을 먼저 등록한 뒤 가·감점을 입력해 주세요.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="score-adjustment-title" className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="score-adjustment-title" className="text-lg font-bold">개인 총점 가·감점</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              운영 판단에 따른 가점은 양수, 감점은 음수로 입력합니다. 완료된 기본 가중 총점에 합산하며 최종 점수는 0~100점 범위로 제한됩니다.
            </p>
          </div>
          <Badge className="w-fit" variant="outline">사유 필수 · 이력 보존</Badge>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="max-w-md space-y-2">
          <Label htmlFor="score-adjustment-engineer">엔지니어</Label>
          <Select
            disabled={disabled}
            onValueChange={(value) => {
              setSelectedEngineerId(value)
              setError(null)
            }}
            value={effectiveEngineerId}
          >
            <SelectTrigger className="w-full" id="score-adjustment-engineer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rows.map((row) => (
                <SelectItem key={row.engineerId} value={row.engineerId}>
                  {row.engineerName} · {row.employeeLabel} · {row.teamName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected === undefined ? null : (
          <>
            <dl className="grid overflow-hidden rounded-lg border sm:grid-cols-3">
              <ScoreMetric label="기본 가중 총점" value={formatScore(selected.baseScore)} />
              <ScoreMetric
                label="누적 가·감점"
                tone={selected.adjustmentTotal > 0 ? "positive" : selected.adjustmentTotal < 0 ? "negative" : "neutral"}
                value={formatSigned(selected.adjustmentTotal)}
              />
              <ScoreMetric label="현재 최종 점수" value={formatScore(selected.finalScore)} />
            </dl>

            <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="score-adjustment-amount">가·감점 값</Label>
                <Input
                  aria-describedby="score-adjustment-help"
                  aria-invalid={error !== null}
                  disabled={disabled}
                  id="score-adjustment-amount"
                  max={100}
                  min={-100}
                  onChange={(event) => {
                    setAmount(event.target.value)
                    setError(null)
                  }}
                  placeholder="예: 3 또는 -2.5"
                  step={0.1}
                  type="number"
                  value={amount}
                />
                <p className="text-xs text-muted-foreground" id="score-adjustment-help">
                  양수는 가점, 음수는 감점입니다.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="score-adjustment-reason">적용 사유</Label>
                <Textarea
                  aria-invalid={error !== null}
                  className="min-h-20"
                  disabled={disabled}
                  id="score-adjustment-reason"
                  maxLength={300}
                  onChange={(event) => {
                    setReason(event.target.value)
                    setError(null)
                  }}
                  placeholder="적용 근거를 구체적으로 입력해 주세요."
                  value={reason}
                />
              </div>
              <Button disabled={disabled} onClick={saveAdjustment} type="button">
                <Plus aria-hidden="true" />
                가·감점 반영
              </Button>
              {error === null ? null : (
                <p className="flex items-center gap-2 text-sm text-destructive lg:col-span-3" role="alert">
                  <CircleAlert aria-hidden="true" className="size-4" />
                  {error}
                </p>
              )}
              {preview === null || amount.length === 0 || numericAmount === 0 ? null : (
                <p className="text-xs text-muted-foreground lg:col-span-3">
                  입력값 반영 예상 최종 점수: <strong className="numeric text-foreground">{preview.toFixed(2)}</strong>
                </p>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">적용 이력</h3>
                <span className="text-xs text-muted-foreground">{selected.adjustments.length}건</span>
              </div>
              {selected.adjustments.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  등록된 가·감점이 없습니다.
                </div>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {selected.adjustments.map((adjustment) => (
                    <li className="flex items-start gap-4 p-4" key={adjustment.id}>
                      <Badge variant={adjustment.amount > 0 ? "default" : "destructive"}>
                        {adjustment.amount > 0 ? "가점" : "감점"}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <strong className={`numeric text-base ${adjustment.amount > 0 ? "text-emerald-700" : "text-destructive"}`}>
                            {formatSigned(adjustment.amount)}
                          </strong>
                          <span className="text-xs text-muted-foreground">{adjustment.updatedAtLabel}</span>
                        </div>
                        <p className="mt-1 break-words text-sm leading-6">{adjustment.reason}</p>
                      </div>
                      <AdjustmentDeleteDialog
                        adjustment={adjustment}
                        disabled={disabled}
                        onDelete={onDelete}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function ScoreMetric({
  label,
  value,
  tone = "neutral",
}: Readonly<{
  label: string
  value: string
  tone?: "positive" | "negative" | "neutral"
}>) {
  return (
    <div className="border-b p-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={`numeric mt-2 text-xl font-bold ${
        tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-destructive" : ""
      }`}>{value}</dd>
    </div>
  )
}

function AdjustmentDeleteDialog({
  adjustment,
  disabled,
  onDelete,
}: Readonly<{
  adjustment: ScoreAdjustmentEntryViewModel
  disabled: boolean
  onDelete: (adjustmentId: string) => boolean
}>) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={`${adjustment.reason} 삭제`}
          disabled={disabled}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>가·감점 내역 삭제</DialogTitle>
          <DialogDescription>
            {formatSigned(adjustment.amount)}점 · {adjustment.reason} 내역을 삭제합니다. 삭제 사실도 감사 이력에 남습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
          <Button
            onClick={() => {
              if (onDelete(adjustment.id)) setOpen(false)
            }}
            type="button"
            variant="destructive"
          >
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
