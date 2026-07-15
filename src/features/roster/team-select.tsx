"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ROSTER_TEAMS } from "./types"
import type { RosterTeam } from "./types"

interface TeamSelectProps {
  readonly id: string
  readonly value: RosterTeam
  readonly disabled?: boolean
  readonly onValueChange: (team: RosterTeam) => void
}

function isRosterTeam(value: string): value is RosterTeam {
  return ROSTER_TEAMS.some((team) => team === value)
}

export function TeamSelect({
  id,
  value,
  disabled = false,
  onValueChange,
}: TeamSelectProps) {
  return (
    <Select
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (isRosterTeam(nextValue)) onValueChange(nextValue)
      }}
      value={value}
    >
      <SelectTrigger className="w-full" id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROSTER_TEAMS.map((team) => (
          <SelectItem key={team} value={team}>
            {team}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
