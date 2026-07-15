import type { ReactNode } from "react"
import { ShieldAlert } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import type { DemoRole } from "@/components/shared/status-badge"

const roleLabels: Record<DemoRole, string> = {
  operator: "운영자",
  evaluator: "평가자",
  approver: "승인자",
  engineer: "엔지니어",
}

type AccessDeniedProps = {
  currentRole?: DemoRole | undefined
  allowedRoles?: readonly DemoRole[] | undefined
  action?: ReactNode | undefined
  className?: string | undefined
}

function AccessDenied({
  currentRole,
  allowedRoles,
  action,
  className,
}: AccessDeniedProps) {
  const currentRoleText = currentRole ? `현재 역할은 ${roleLabels[currentRole]}입니다. ` : ""
  const allowedRoleText = allowedRoles?.length
    ? `${allowedRoles.map((role) => roleLabels[role]).join(", ")} 역할에서 확인할 수 있습니다.`
    : "이 화면을 볼 수 있는 권한이 없습니다."

  return (
    <EmptyState
      title="접근 권한이 없습니다"
      description={`${currentRoleText}${allowedRoleText}`}
      icon={ShieldAlert}
      action={action}
      className={className}
    />
  )
}

export { AccessDenied }
export type { AccessDeniedProps }
