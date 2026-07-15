import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  description?: string | undefined
  actions?: ReactNode | undefined
  headingLevel?: 2 | 3 | undefined
  className?: string | undefined
}

function SectionHeader({
  title,
  description,
  actions,
  headingLevel = 2,
  className,
}: SectionHeaderProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3"

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-3 sm:flex-row sm:items-start",
        className
      )}
    >
      <div className="min-w-0">
        <Heading
          className={cn(
            "font-heading font-semibold tracking-[-0.015em] text-foreground",
            headingLevel === 2 ? "text-xl leading-7" : "text-base leading-6"
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

type DataPanelProps = {
  title: string
  description?: string | undefined
  actions?: ReactNode | undefined
  children: ReactNode
  footer?: ReactNode | undefined
  variant?: "bordered" | "flush-table" | undefined
  headingLevel?: 2 | 3 | undefined
  className?: string | undefined
  contentClassName?: string | undefined
}

function DataPanel({
  title,
  description,
  actions,
  children,
  footer,
  variant = "bordered",
  headingLevel = 2,
  className,
  contentClassName,
}: DataPanelProps) {
  const flush = variant === "flush-table"

  return (
    <section
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
    >
      <SectionHeader
        title={title}
        description={description}
        actions={actions}
        headingLevel={headingLevel}
        className={cn("p-5", flush && "border-b border-border-subtle")}
      />
      <div className={cn(flush ? "min-w-0" : "px-5 pb-5", contentClassName)}>
        {children}
      </div>
      {footer ? (
        <footer className="border-t border-border-subtle bg-muted/40 px-5 py-3 text-sm text-muted-foreground">
          {footer}
        </footer>
      ) : null}
    </section>
  )
}

export { DataPanel, SectionHeader }
export type { DataPanelProps, SectionHeaderProps }
