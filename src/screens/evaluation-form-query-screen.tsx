"use client"

import { useSearchParams } from "next/navigation"

import { ErrorState } from "@/components/shared"

import { EvaluationFormScreen } from "./evaluation-form-screen"

export function EvaluationFormQueryScreen() {
  const assignmentId = useSearchParams().get("assignmentId")
  if (assignmentId === null || assignmentId.trim().length === 0) {
    return <ErrorState description="열 평가표가 지정되지 않았습니다." />
  }
  return <EvaluationFormScreen assignmentId={assignmentId} />
}
