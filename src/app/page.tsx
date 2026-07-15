"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <p aria-live="polite" className="text-sm text-muted-foreground">평가 화면을 여는 중입니다.</p>
    </main>
  )
}
