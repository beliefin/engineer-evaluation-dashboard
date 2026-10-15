"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import "@/components/shared/signal-states.css"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/overview")
  }, [router])

  return (
    <main className="signal-redirect-state">
      <p aria-live="polite" className="signal-redirect-message">평가 시즌 안내를 여는 중입니다.</p>
    </main>
  )
}
