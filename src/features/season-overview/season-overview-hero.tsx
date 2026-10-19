import { ArrowRight, CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SeasonOverviewModel } from "@/view-models/season-overview"

function formatPeriod(startsAt: string, endsAt: string): string {
  return `${startsAt.replaceAll("-", ". ")} — ${endsAt.replaceAll("-", ". ")}`
}

const LOOP_STEPS = [
  ["01", "문제 찾기", "업무 개선 과제와 성장 목표 설정"],
  ["02", "배우고 실행하기", "필요 기술 학습과 과제 수행"],
  ["03", "검증하고 공유하기", "근거 기반 결과 검증과 동료 공유"],
  ["04", "업무에 다시 적용하기", "학습 결과를 후속 업무·개선 활동에 재적용"],
] as const

export function SeasonOverviewHero({ backendMode, model }: Readonly<{
  backendMode: "supabase" | "local"
  model: SeasonOverviewModel
}>) {
  return (
    <header className="signal-season-hero">
      <div className="signal-season-intro">
        <h1 id="season-cover-title"><span>{model.cycle.name}</span></h1>
        <h2>배운 내용을 업무에 다시 적용하는 과정</h2>
        <p className="signal-season-description">실제 업무 문제를 과제로 전환하고, 학습·실행 결과를 다음 업무에 다시 쓰는 성장 체계</p>
        <div className="signal-season-period">
          <span><CalendarDays aria-hidden="true" />{formatPeriod(model.cycle.startsAt, model.cycle.endsAt)}</span>
          <Badge variant="outline">{backendMode === "supabase" ? "운영 데이터" : "샘플 데이터"}</Badge>
          <span className="sr-only">현재 선택한 시즌 기준</span>
        </div>
      </div>
      <div className="signal-season-process">
        <ol aria-label="엔지니어 성장 선순환">
          {LOOP_STEPS.map(([number, title, description], index) => (
            <li key={number}>
              <span className="signal-season-step-number numeric">{number}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
              {index < LOOP_STEPS.length - 1 ? <ArrowRight aria-hidden="true" className="signal-season-step-arrow" /> : null}
            </li>
          ))}
        </ol>
        <p className="signal-season-loop-note">평가 결과·피드백을 후속 과제·업무 개선에 연계</p>
      </div>
    </header>
  )
}
