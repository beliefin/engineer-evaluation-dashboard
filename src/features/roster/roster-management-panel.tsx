"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { RosterSection } from "./roster-section"
import { rosterDepartmentsForTeam, type RosterManagementPanelProps } from "./types"
import styles from "./roster-signal.module.css"

export function RosterManagementPanel({
  engineers,
  evaluators,
  departmentCatalog = [],
  disabled = false,
  onAddEngineers,
  onUpdateEngineer,
  onDeleteEngineer,
  onAddEvaluators,
  onUpdateEvaluator,
  onDeleteEvaluator,
  linkedEngineerIds = [],
  linkedEvaluatorIds = [],
}: RosterManagementPanelProps) {
  const rosterRows = [...engineers, ...evaluators]
  const departmentOptions = {
    "생산 1팀": rosterDepartmentsForTeam("생산 1팀", [
      ...departmentCatalog.filter((entry) => entry.team === "생산 1팀").map((entry) => entry.name),
      ...rosterRows.filter((row) => row.team === "생산 1팀").map((row) => row.department),
    ]),
    "생산 2팀": rosterDepartmentsForTeam("생산 2팀", [
      ...departmentCatalog.filter((entry) => entry.team === "생산 2팀").map((entry) => entry.name),
      ...rosterRows.filter((row) => row.team === "생산 2팀").map((row) => row.department),
    ]),
  } as const

  return (
    <section
      aria-labelledby="roster-management-title"
      className={styles.panel}
    >
      <header className={styles.heading}>
        <h2 id="roster-management-title">평가 명단 관리</h2>
        <Badge className={styles.count} variant="outline">
          엔지니어 {engineers.length}명 · 평가자 {evaluators.length}명
        </Badge>
      </header>
      <p className={styles.description}>
        1부문 아래 팀·담당 기준의 엔지니어·평가자 <span className="whitespace-nowrap">사전 등록</span>
      </p>
      <div className={styles.body}>
        <Tabs className={styles.tabsRoot} defaultValue="engineer">
          <TabsList aria-label="평가 명단 종류" className={styles.tabs} variant="line">
            <TabsTrigger value="engineer">엔지니어 {engineers.length}명</TabsTrigger>
            <TabsTrigger value="evaluator">평가자 {evaluators.length}명</TabsTrigger>
          </TabsList>
          <TabsContent className={styles.content} value="engineer">
            <RosterSection
              departmentOptions={departmentOptions}
              disabled={disabled}
              kind="engineer"
              onAddEngineers={onAddEngineers}
              onAddEvaluators={onAddEvaluators}
              onDeleteEngineer={onDeleteEngineer}
              onUpdateEngineer={onUpdateEngineer}
              linkedEngineerIds={linkedEngineerIds}
              linkedEvaluatorIds={linkedEvaluatorIds}
              onDeleteEvaluator={onDeleteEvaluator}
              onUpdateEvaluator={onUpdateEvaluator}
              rows={engineers}
            />
          </TabsContent>
          <TabsContent className={styles.content} value="evaluator">
            <RosterSection
              departmentOptions={departmentOptions}
              disabled={disabled}
              kind="evaluator"
              onAddEngineers={onAddEngineers}
              onAddEvaluators={onAddEvaluators}
              onDeleteEngineer={onDeleteEngineer}
              onUpdateEngineer={onUpdateEngineer}
              linkedEngineerIds={linkedEngineerIds}
              linkedEvaluatorIds={linkedEvaluatorIds}
              onDeleteEvaluator={onDeleteEvaluator}
              onUpdateEvaluator={onUpdateEvaluator}
              rows={evaluators}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
