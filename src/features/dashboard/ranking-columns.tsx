import type { Column, ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import type { CompletedRankingRow } from "./dashboard-view-models"
import { RankingStatusBadge } from "./ranking-status-badge"

interface SortHeaderProps {
  readonly column: Column<CompletedRankingRow, unknown>
  readonly label: string
  readonly align?: "left" | "right"
}

function SortHeader({ column, label, align = "left" }: SortHeaderProps) {
  const sorting = column.getIsSorted()
  const sortText =
    sorting === "asc"
      ? "오름차순"
      : sorting === "desc"
        ? "내림차순"
        : "정렬 안 됨"
  const Icon =
    sorting === "asc" ? ArrowUp : sorting === "desc" ? ArrowDown : ChevronsUpDown

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={align === "right" ? "ml-auto" : "-ml-2"}
      onClick={() => column.toggleSorting(sorting === "asc")}
      aria-label={`${label}, 현재 ${sortText}. 정렬 순서 변경`}
    >
      {label}
      <Icon aria-hidden="true" data-icon="inline-end" />
    </Button>
  )
}

export function createRankingColumns(): ColumnDef<CompletedRankingRow>[] {
  return [
    {
      accessorKey: "rank",
      header: ({ column }) => <SortHeader column={column} label="순위" />,
      cell: ({ row }) => (
        <span className="numeric font-bold">{row.original.rank}</span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortHeader column={column} label="엔지니어" />,
      cell: ({ row }) => (
        <Link
          href={row.original.href}
          className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "team",
      header: ({ column }) => <SortHeader column={column} label="팀" />,
    },
    {
      accessorKey: "totalScore",
      header: ({ column }) => (
        <SortHeader column={column} label="최종 총점" align="right" />
      ),
      cell: ({ row }) => (
        <span className="numeric block text-right font-bold text-primary">
          {row.original.totalScore.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <RankingStatusBadge status={row.original.status} />,
      enableSorting: false,
    },
  ]
}
