"use client"

import { useId, useState } from "react"
import type { FormEvent } from "react"

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

import { TeamSelect } from "./team-select"
import { DepartmentSelect } from "./department-select"
import { normalizeEmployeeCode } from "./parser"
import type {
  EngineerRegistration,
  EvaluatorRegistration,
  RosterDepartment,
  RosterDepartmentOptions,
  RosterTeam,
} from "./types"
import { defaultRosterDepartment } from "./types"

interface SingleRegistrationDialogProps {
  readonly kind: "engineer" | "evaluator"
  readonly disabled: boolean
  readonly existingEmployeeCodes: readonly string[]
  readonly departmentOptions: RosterDepartmentOptions
  readonly onAddEngineers: (rows: readonly EngineerRegistration[]) => boolean
  readonly onAddEvaluators: (rows: readonly EvaluatorRegistration[]) => boolean
}

interface FormErrors {
  readonly employeeCode?: string
  readonly displayName?: string
  readonly position?: string
  readonly department?: string
}

export function SingleRegistrationDialog({
  kind,
  disabled,
  existingEmployeeCodes,
  departmentOptions,
  onAddEngineers,
  onAddEvaluators,
}: SingleRegistrationDialogProps) {
  const id = useId()
  const label = kind === "engineer" ? "엔지니어" : "평가자"
  const [open, setOpen] = useState(false)
  const [employeeCode, setEmployeeCode] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [team, setTeam] = useState<RosterTeam>("생산 1팀")
  const [department, setDepartment] = useState<RosterDepartment>("전자약품담당")
  const [position, setPosition] = useState("엔지니어")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState("")

  const reset = () => {
    setEmployeeCode("")
    setDisplayName("")
    setTeam("생산 1팀")
    setDepartment("전자약품담당")
    setPosition("엔지니어")
    setErrors({})
    setSubmitError("")
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) reset()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = normalizeEmployeeCode(employeeCode)
    const name = displayName.trim()
    const departmentName = department.trim()
    const jobPosition = position.trim()
    const duplicate = existingEmployeeCodes.some(
      (value) => value.toLocaleUpperCase("ko-KR") === code.toLocaleUpperCase("ko-KR"),
    )
    const nextErrors: FormErrors = {
      ...(code === "" ? { employeeCode: "사번을 입력하세요." } : {}),
      ...(duplicate ? { employeeCode: "이미 등록된 사번입니다." } : {}),
      ...(name === "" ? { displayName: "이름을 입력하세요." } : {}),
      ...(departmentName === "" ? { department: "담당을 입력하세요." } : {}),
      ...(kind === "engineer" && jobPosition === ""
        ? { position: "직급을 입력하세요." }
        : {}),
    }
    setErrors(nextErrors)
    setSubmitError("")
    if (Object.keys(nextErrors).length > 0) return

    const succeeded = kind === "engineer"
      ? onAddEngineers([{ employeeCode: code, displayName: name, division: "1부문", team, department: departmentName, position: jobPosition }])
      : onAddEvaluators([{ employeeCode: code, displayName: name, division: "1부문", team, department: departmentName }])
    if (succeeded) handleOpenChange(false)
    else setSubmitError("등록하지 못했습니다. 사번 중복 여부를 확인하세요.")
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant="outline">
          {label} 1명 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{label} 개별 등록</DialogTitle>
          <DialogDescription>사번과 이름을 확인한 뒤 한 명을 등록합니다.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <LabeledInput
            error={errors.employeeCode}
            id={`${id}-employee-code`}
            label="사번"
            onChange={setEmployeeCode}
            value={employeeCode}
          />
          <LabeledInput
            error={errors.displayName}
            id={`${id}-display-name`}
            label="이름"
            onChange={setDisplayName}
            value={displayName}
          />
          <div className="space-y-2">
            <Label htmlFor={`${id}-division`}>부문</Label>
            <Input id={`${id}-division`} readOnly value="1부문" />
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
              describedBy={errors.department === undefined ? undefined : `${id}-department-error`}
              id={`${id}-department`}
              invalid={errors.department !== undefined}
              onValueChange={setDepartment}
              savedDepartments={departmentOptions[team]}
              team={team}
              value={department}
            />
            {errors.department === undefined ? null : (
              <p className="text-xs text-destructive" id={`${id}-department-error`}>{errors.department}</p>
            )}
          </div>
          {kind === "engineer" ? (
            <LabeledInput
              error={errors.position}
              id={`${id}-position`}
              label="직급"
              onChange={setPosition}
              value={position}
            />
          ) : null}
          {submitError !== "" ? (
            <p aria-live="assertive" className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
            <Button type="submit">{label} 등록</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface LabeledInputProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly error: string | undefined
  readonly onChange: (value: string) => void
}

function LabeledInput({ id, label, value, error, onChange }: LabeledInputProps) {
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
      {error === undefined ? null : <p className="text-xs text-destructive" id={errorId}>{error}</p>}
    </div>
  )
}
