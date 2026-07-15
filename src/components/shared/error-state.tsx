import type { ReactNode } from "react"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type ErrorStateProps = {
  title?: string | undefined
  description: string
  action?: ReactNode | undefined
  className?: string | undefined
}

function ErrorState({
  title = "화면을 불러오지 못했습니다",
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <Alert
      variant="destructive"
      className={cn(
        "min-h-36 grid-cols-[auto_1fr] items-start border-destructive/20 bg-danger-soft p-4",
        className
      )}
    >
      <CircleAlert className="mt-0.5 size-5" aria-hidden />
      <div className="min-w-0">
        <AlertTitle className="font-semibold">{title}</AlertTitle>
        <AlertDescription className="mt-1 text-destructive/90">
          {description}
        </AlertDescription>
        {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </Alert>
  )
}

export { ErrorState }
export type { ErrorStateProps }
