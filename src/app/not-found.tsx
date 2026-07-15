import Link from "next/link"

import { EmptyState } from "@/components/shared"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl items-center px-4">
      <EmptyState
        action={
          <Button asChild>
            <Link href="/dashboard">전체 현황으로 이동</Link>
          </Button>
        }
        description="요청한 평가 화면 또는 샘플 대상을 찾을 수 없습니다."
        title="페이지가 없습니다"
      />
    </main>
  )
}
