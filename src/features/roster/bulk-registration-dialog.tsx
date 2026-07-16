"use client"

import { useId, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { ClipboardPasteIcon } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { BulkPreview } from "./bulk-preview"
import { parseEngineerRoster, parseEvaluatorRoster } from "./parser"
import { TeamSelect } from "./team-select"
import { DepartmentSelect } from "./department-select"
import type {
  EngineerRegistration,
  EvaluatorRegistration,
  RosterDepartment,
  RosterTeam,
} from "./types"
import { defaultRosterDepartment } from "./types"

interface BulkRegistrationDialogProps {
  readonly kind: "engineer" | "evaluator"
  readonly disabled: boolean
  readonly onAddEngineers: (rows: readonly EngineerRegistration[]) => boolean
  readonly onAddEvaluators: (rows: readonly EvaluatorRegistration[]) => boolean
}

export function BulkRegistrationDialog({
  kind,
  disabled,
  onAddEngineers,
  onAddEvaluators,
}: BulkRegistrationDialogProps) {
  const id = useId()
  const label = kind === "engineer" ? "엔지니어" : "평가자"
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [defaultTeam, setDefaultTeam] = useState<RosterTeam>("생산 1팀")
  const [defaultDepartment, setDefaultDepartment] = useState<RosterDepartment>("전자약품담당")
  const [submitError, setSubmitError] = useState("")
  const result = useMemo(
    () => kind === "engineer"
      ? parseEngineerRoster(text, defaultTeam, defaultDepartment)
      : parseEvaluatorRoster(text, defaultTeam, defaultDepartment),
    [defaultDepartment, defaultTeam, kind, text],
  )
  const isValid = result.rows.length > 0 && result.errors.length === 0

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setText("")
      setDefaultTeam("생산 1팀")
      setDefaultDepartment("전자약품담당")
      setSubmitError("")
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid) return
    const succeeded = kind === "engineer"
      ? onAddEngineers(parseEngineerRoster(text, defaultTeam, defaultDepartment).rows)
      : onAddEvaluators(parseEvaluatorRoster(text, defaultTeam, defaultDepartment).rows)
    if (succeeded) handleOpenChange(false)
    else setSubmitError("일괄 등록하지 못했습니다. 기존 사번과 중복되는 항목이 있는지 확인하세요.")
  }

  const formatDescription = kind === "engineer"
    ? "사번, 이름, 팀(선택), 담당(선택), 직급(선택) 순서로 붙여넣으세요."
    : "사번, 이름, 팀(선택), 담당(선택) 순서로 붙여넣으세요."

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <ClipboardPasteIcon aria-hidden="true" />
          {label} 일괄 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{label} 일괄 등록</DialogTitle>
          <DialogDescription>붙여넣은 목록 전체가 유효할 때만 한 번에 등록됩니다.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`${id}-default-division`}>기본 부문</Label>
              <Input id={`${id}-default-division`} readOnly value="1부문" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-default-team`}>기본 팀</Label>
            <TeamSelect
              id={`${id}-default-team`}
              onValueChange={(team) => {
                setDefaultTeam(team)
                setDefaultDepartment(defaultRosterDepartment(team))
              }}
              value={defaultTeam}
            />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-default-department`}>기본 담당</Label>
              <DepartmentSelect
                id={`${id}-default-department`}
                onValueChange={setDefaultDepartment}
                team={defaultTeam}
                value={defaultDepartment}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-bulk-list`}>{label} 목록</Label>
            <Textarea
              aria-describedby={`${id}-format ${id}-validation`}
              aria-invalid={result.errors.length > 0 ? true : undefined}
              className="min-h-36 font-mono text-sm"
              id={`${id}-bulk-list`}
              onChange={(event) => {
                setText(event.currentTarget.value)
                setSubmitError("")
              }}
              placeholder={kind === "engineer"
                ? "E-001, 김하늘, 생산 1팀, 전자약품담당, 엔지니어"
                : "V-001, 이서준, 생산 1팀, 전자약품담당"}
              value={text}
            />
            <p className="text-xs text-muted-foreground" id={`${id}-format`}>{formatDescription}</p>
          </div>
          <div aria-live="polite" id={`${id}-validation`}>
            {result.errors.length > 0 ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3" role="alert">
                <p className="text-sm font-semibold text-destructive">수정이 필요한 항목</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                  {result.errors.map((error, index) => (
                    <li key={`${error.line}-${error.message}-${index}`}>
                      {error.line}행: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {isValid ? (
              <div className="space-y-2">
                <Badge variant="secondary">등록 예정 {result.rows.length}명</Badge>
                <BulkPreview kind={kind} rows={result.rows} />
              </div>
            ) : null}
          </div>
          {submitError !== "" ? (
            <p aria-live="assertive" className="text-sm text-destructive" role="alert">{submitError}</p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
            <Button disabled={!isValid} type="submit">
              {isValid ? `${result.rows.length}명 일괄 등록` : "일괄 등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
