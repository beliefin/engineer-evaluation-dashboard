"use client"

import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import { EvaluationProvider } from "./evaluation-provider"
import { AuthProvider } from "./auth-provider"

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <EvaluationProvider>{children}</EvaluationProvider>
      </AuthProvider>
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  )
}
