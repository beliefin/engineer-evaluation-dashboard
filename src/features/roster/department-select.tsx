"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  isRosterDepartmentForTeam,
  rosterDepartmentsForTeam,
  type RosterDepartment,
  type RosterTeam,
} from "./types"

type DepartmentSelectProps = Readonly<{
  id: string
  team: RosterTeam
  value: RosterDepartment
  disabled?: boolean
  onValueChange: (department: RosterDepartment) => void
}>

export function DepartmentSelect({
  id,
  team,
  value,
  disabled = false,
  onValueChange,
}: DepartmentSelectProps) {
  return (
    <Select
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (isRosterDepartmentForTeam(team, nextValue)) onValueChange(nextValue)
      }}
      value={value}
    >
      <SelectTrigger className="w-full" id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {rosterDepartmentsForTeam(team).map((department) => (
          <SelectItem key={department} value={department}>{department}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
