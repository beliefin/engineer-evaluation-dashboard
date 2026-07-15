"use client"

import type { ReactNode } from "react"

import type { Role } from "@/domain"
import { useEvaluation } from "@/providers"

import { AccessDenied } from "./access-denied"
import { LoadingPageSkeleton } from "./loading-page-skeleton"

export function RoleGate({
  allowed,
  children,
}: Readonly<{ allowed: ReadonlyArray<Role>; children: ReactNode }>) {
  const { role, snapshot } = useEvaluation()

  if (snapshot === null) return <LoadingPageSkeleton />
  if (!allowed.includes(role)) return <AccessDenied allowedRoles={allowed} currentRole={role} />
  return children
}
