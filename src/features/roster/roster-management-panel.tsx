"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { RosterSection } from "./roster-section"
import type { RosterManagementPanelProps } from "./types"

export function RosterManagementPanel({
  engineers,
  evaluators,
  disabled = false,
  onAddEngineers,
  onUpdateEngineer,
  onDeleteEngineer,
  onAddEvaluators,
  linkedEngineerIds = [],
}: RosterManagementPanelProps) {
  return (
    <section
      aria-labelledby="roster-management-title"
      className="overflow-hidden rounded-lg border bg-card"
    >
      <header className="flex flex-col gap-3 border-b border-border-subtle px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <h2 className="text-base font-semibold" id="roster-management-title">
            평가 명단 관리
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            생산 1팀·생산 2팀의 엔지니어와 평가자를 <span className="whitespace-nowrap">평가 시작 전</span> 등록합니다.
          </p>
        </div>
        <Badge className="shrink-0" variant="outline">
          엔지니어 {engineers.length}명 · 평가자 {evaluators.length}명
        </Badge>
      </header>
      <div className="p-4 sm:p-5">
        <Tabs defaultValue="engineer">
          <TabsList aria-label="평가 명단 종류" variant="line">
            <TabsTrigger value="engineer">엔지니어 {engineers.length}명</TabsTrigger>
            <TabsTrigger value="evaluator">평가자 {evaluators.length}명</TabsTrigger>
          </TabsList>
          <TabsContent value="engineer">
            <RosterSection
              disabled={disabled}
              kind="engineer"
              onAddEngineers={onAddEngineers}
              onAddEvaluators={onAddEvaluators}
              onDeleteEngineer={onDeleteEngineer}
              onUpdateEngineer={onUpdateEngineer}
              linkedEngineerIds={linkedEngineerIds}
              rows={engineers}
            />
          </TabsContent>
          <TabsContent value="evaluator">
            <RosterSection
              disabled={disabled}
              kind="evaluator"
              onAddEngineers={onAddEngineers}
              onAddEvaluators={onAddEvaluators}
              onDeleteEngineer={onDeleteEngineer}
              onUpdateEngineer={onUpdateEngineer}
              linkedEngineerIds={linkedEngineerIds}
              rows={evaluators}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
