import { Badge } from "@/components/ui/badge"

import type { DashboardHeaderProps } from "./dashboard-view-models"

export function DashboardHeader({
  contextLabel,
  title,
  description,
  cycleLabel,
  asOfLabel,
  sampleLabel,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-border-subtle pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{contextLabel}</span>
          <span aria-hidden="true">/</span>
          <Badge variant="outline" className="border-primary/30 bg-accent text-accent-foreground">
            {sampleLabel}
          </Badge>
        </div>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3 border-l-2 border-primary pl-3 text-xs text-muted-foreground lg:justify-end">
        <span className="whitespace-nowrap font-medium text-foreground">{cycleLabel}</span>
        <span aria-hidden="true" className="h-3 w-px bg-border" />
        <span className="whitespace-nowrap">{asOfLabel}</span>
      </div>
    </header>
  )
}
