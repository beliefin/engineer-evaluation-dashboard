"use client"

import { Input } from "@/components/ui/input"

import {
  rosterDepartmentsForTeam,
  type RosterDepartment,
  type RosterTeam,
} from "./types"

type DepartmentSelectProps = Readonly<{
  id: string
  team: RosterTeam
  value: RosterDepartment
  savedDepartments?: readonly string[]
  disabled?: boolean
  invalid?: boolean
  describedBy?: string | undefined
  onValueChange: (department: RosterDepartment) => void
}>

export function DepartmentSelect({
  id,
  team,
  value,
  savedDepartments = [],
  disabled = false,
  invalid = false,
  describedBy,
  onValueChange,
}: DepartmentSelectProps) {
  const listId = `${id}-suggestions`
  const departments = rosterDepartmentsForTeam(team, savedDepartments)

  return (
    <>
      <Input
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        id={id}
        list={listId}
        maxLength={100}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        placeholder="목록에서 선택하거나 직접 입력"
        value={value}
      />
      <datalist id={listId}>
        {departments.map((department) => (
          <option key={department} value={department} />
        ))}
      </datalist>
    </>
  )
}
