import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { EngineerEvaluationOverview } from "./engineer-evaluation-overview"
import { EvaluatorDetailPanel } from "./evaluator-detail-panel"
import type { EngineerDetailProps } from "./engineer-detail.types"
import styles from "./engineer-evaluation-overview.module.css"
import "./engineer-signal.css"

export function EngineerDetail({ role, model, className }: EngineerDetailProps) {
  return (
    <div className={cn("signal-engineer-detail", styles.detailRoot, className)}>
      <EngineerEvaluationOverview model={model} contextLabel={role === "engineer" ? "내 평가" : "엔지니어 상세"} />
      {role === "operator" || role === "evaluator" ? (
        <details className={styles.storyDisclosure}>
          <summary>평가자별 상세 보기<ChevronDown aria-hidden="true" /></summary>
          <div className={styles.evaluatorContent}><EvaluatorDetailPanel evaluatorScores={model.evaluatorScores} /></div>
        </details>
      ) : null}
    </div>
  )
}
