"use client"

import type { ReactNode } from "react"

import type { Role } from "@/domain"
import { useEvaluation } from "@/providers"

import { AccessDenied } from "./access-denied"
import { LoadingPageSkeleton } from "./loading-page-skeleton"

export function RoleGate({
  allowed,
  allowEvaluatorInsights = false,
  children,
}: Readonly<{
  allowed: ReadonlyArray<Role>
  allowEvaluatorInsights?: boolean
  children: ReactNode
}>) {
  const { role, snapshot, canViewInsights } = useEvaluation()

  if (snapshot === null) return <LoadingPageSkeleton />
  const evaluatorInsightAccess = allowEvaluatorInsights && role === "evaluator" && canViewInsights
  if (!allowed.includes(role) && !evaluatorInsightAccess) {
    return <AccessDenied allowedRoles={allowed} currentRole={role} />
  }
  return children
}
