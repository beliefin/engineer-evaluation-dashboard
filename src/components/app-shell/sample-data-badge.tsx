import { FlaskConicalIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SampleDataBadgeProps {
  readonly className?: string
}

export function SampleDataBadge({ className }: SampleDataBadgeProps) {
  return (
    <Badge
      aria-label="현재 화면은 샘플 데이터로 구성됨"
      className={cn(
        "h-6 rounded-md border-warning/30 bg-warning-soft px-2 text-warning",
        className
      )}
      variant="outline"
    >
      <FlaskConicalIcon aria-hidden="true" data-icon="inline-start" />
      샘플 데이터
    </Badge>
  )
}
