"use client"

import { useId, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { TeamSelect } from "./team-select"
import { DepartmentSelect } from "./department-select"
import { normalizeEmployeeCode } from "./parser"
import { defaultRosterDepartment } from "./types"
import type { EvaluatorRegistration, EvaluatorRosterItem, RosterDepartmentOptions } from "./types"

type EvaluatorEditorDialogProps = Readonly<{
  evaluator: EvaluatorRosterItem
  existingEmployeeCodes: readonly string[]
  departmentOptions: RosterDepartmentOptions
  onClose: () => void
  onSave: (evaluatorId: string, evaluator: EvaluatorRegistration) => boolean
}>

type FieldErrors = Readonly<{
  employeeCode?: string
  displayName?: string
  department?: string
}>

export function EvaluatorEditorDialog({
  evaluator,
  existingEmployeeCodes,
  departmentOptions,
  onClose,
  onSave,
}: EvaluatorEditorDialogProps) {
  const id = useId()
  const [employeeCode, setEmployeeCode] = useState(evaluator.employeeCode)
  const [displayName, setDisplayName] = useState(evaluator.displayName)
  const [team, setTeam] = useState(evaluator.team)
  const [department, setDepartment] = useState(evaluator.department)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = {
      employeeCode: normalizeEmployeeCode(employeeCode),
      displayName: displayName.trim(),
      division: "1부문" as const,
      team,
      department: department.trim(),
    }
    const duplicate = existingEmployeeCodes.some((code) =>
      code.toLocaleUpperCase("en-US") === next.employeeCode.toLocaleUpperCase("en-US"))
    const nextErrors: FieldErrors = {
      ...(next.employeeCode === "" ? { employeeCode: "사번을 입력해 주세요." } : {}),
      ...(duplicate ? { employeeCode: "이미 등록된 사번입니다." } : {}),
      ...(next.displayName === "" ? { displayName: "이름을 입력해 주세요." } : {}),
      ...(next.department === "" ? { department: "담당을 입력해 주세요." } : {}),
    }
    setFieldErrors(nextErrors)
    setSubmitError("")
    if (Object.keys(nextErrors).length > 0) return
    if (onSave(evaluator.id, next)) onClose()
    else setSubmitError("수정하지 못했습니다. 입력값과 시즌 잠금 상태를 확인해 주세요.")
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>평가자 정보 수정</DialogTitle>
          <DialogDescription>
            사번과 소속 정보를 수정합니다.{" "}
            <span className="whitespace-nowrap">기존 평가 기록은 유지됩니다.</span>
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <EditorInput
            error={fieldErrors.employeeCode}
            id={`${id}-employee-code`}
            label="사번"
            onChange={(value) => {
              setEmployeeCode(value)
              setFieldErrors({})
            }}
            value={employeeCode}
          />
          <EditorInput
            error={fieldErrors.displayName}
            id={`${id}-display-name`}
            label="이름"
            onChange={(value) => {
              setDisplayName(value)
              setFieldErrors({})
            }}
            value={displayName}
          />
          <div className="space-y-2">
            <Label htmlFor={`${id}-division`}>부문</Label>
            <Input id={`${id}-division`} readOnly value={evaluator.division} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-team`}>팀</Label>
            <TeamSelect
              id={`${id}-team`}
              onValueChange={(nextTeam) => {
                setTeam(nextTeam)
                setDepartment(defaultRosterDepartment(nextTeam))
              }}
              value={team}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-department`}>담당</Label>
            <DepartmentSelect
              describedBy={fieldErrors.department === undefined ? undefined : `${id}-department-error`}
              id={`${id}-department`}
              invalid={fieldErrors.department !== undefined}
              onValueChange={setDepartment}
              savedDepartments={departmentOptions[team]}
              team={team}
              value={department}
            />
            {fieldErrors.department === undefined ? null : (
              <p className="text-xs text-destructive" id={`${id}-department-error`}>{fieldErrors.department}</p>
            )}
          </div>
          {submitError === "" ? null : (
            <p className="text-sm text-destructive" role="alert">{submitError}</p>
          )}
          <DialogFooter>
            <Button onClick={onClose} type="button" variant="outline">취소</Button>
            <Button type="submit">변경사항 저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditorInput({
  id,
  label,
  value,
  error,
  onChange,
}: Readonly<{
  id: string
  label: string
  value: string
  error: string | undefined
  onChange: (value: string) => void
}>) {
  const errorId = `${id}-error`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-describedby={error === undefined ? undefined : errorId}
        aria-invalid={error === undefined ? undefined : true}
        id={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      />
      {error === undefined ? null : (
        <p className="text-xs text-destructive" id={errorId}>{error}</p>
      )}
    </div>
  )
}
