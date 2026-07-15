"use client"

import { useSearchParams } from "next/navigation"

import { ErrorState } from "@/components/shared"

import { EngineerDetailScreen } from "./engineer-detail-screen"

export function EngineerDetailQueryScreen() {
  const engineerId = useSearchParams().get("engineerId")
  if (engineerId === null || engineerId.trim().length === 0) {
    return <ErrorState description="조회할 엔지니어가 지정되지 않았습니다." />
  }
  return <EngineerDetailScreen engineerId={engineerId} />
}
