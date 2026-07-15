import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string | undefined
  context?: ReactNode | undefined
  actions?: ReactNode | undefined
  compact?: boolean | undefined
  className?: string | undefined
}

function PageHeader({
  title,
  description,
  context,
  actions,
  compact = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col justify-between gap-4 sm:flex-row sm:items-start",
        compact ? "pb-4" : "pb-6",
        className
      )}
    >
      <div className="min-w-0">
        {context ? (
          <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">
            {context}
          </div>
        ) : null}
        <h1
          className={cn(
            "font-heading font-bold tracking-[-0.025em] text-foreground",
            compact ? "text-[1.625rem] leading-[1.3]" : "text-[1.875rem] leading-[1.25]"
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-pretty text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  )
}

export { PageHeader }
export type { PageHeaderProps }
