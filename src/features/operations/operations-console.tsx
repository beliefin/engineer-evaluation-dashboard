"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RosterManagementPanel } from "@/features/roster"

import { CycleCreatorPanel } from "./cycle-creator-panel"
import { DirectScoreEditor } from "./direct-score-editor"
import { DirectScoreSourceEditor } from "./direct-score-source-editor"
import { EvaluationTaskPanel } from "./evaluation-task-panel"
import { EngineerTaskWeightPanel } from "./engineer-task-weight-panel"
import { ResetDemoPanel } from "./reset-demo-panel"
import type { OperationsConsoleProps } from "./types"

export function OperationsConsole({
  viewModel,
  disabled = false,
  onCreateCycle,
  onSaveTask,
  onDeleteTask,
  onEngineerTaskWeightsChange,
  onDirectScoreChange,
  onSaveLanguageRecord,
  onDeleteLanguageRecord,
  onSaveCertificationRecord,
  onDeleteCertificationRecord,
  onVerifySourceRecord,
  onAddEngineers,
  onAddEvaluators,
  onResetDemoData,
  activeTab = "roster",
  directScoreQuery = "",
  onTabChange,
}: OperationsConsoleProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-primary uppercase">
            운영 설정
          </p>
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em] sm:text-3xl">
            평가 운영 관리
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            평가 시즌, 과제별 평가방식과 결과 입력을 한 곳에서 관리합니다.
          </p>
        </div>
        <Badge className="w-fit" variant="secondary">
          {viewModel.cycleLabel}
        </Badge>
      </header>

      <Tabs
        onValueChange={(value) => {
          if (
            value === "roster" ||
            value === "season" ||
            value === "tasks" ||
            value === "weights" ||
            value === "scores" ||
            value === "reset"
          ) {
            onTabChange?.(value)
          }
        }}
        value={activeTab}
      >
        <div className="-mx-1 px-1 sm:mx-0 sm:overflow-x-auto sm:px-0">
          <TabsList className="grid w-full grid-cols-3 gap-x-1 gap-y-3 group-data-horizontal/tabs:!h-auto sm:inline-flex sm:w-fit sm:min-w-max sm:justify-start sm:gap-1 sm:group-data-horizontal/tabs:!h-10" variant="line">
            <TabsTrigger value="roster">명단 등록</TabsTrigger>
            <TabsTrigger value="season">평가 시즌</TabsTrigger>
            <TabsTrigger value="tasks">과제 구성</TabsTrigger>
            <TabsTrigger value="weights">개인별 가중치</TabsTrigger>
            <TabsTrigger value="scores">결과 입력</TabsTrigger>
            <TabsTrigger value="reset">초기화</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="roster">
          <RosterManagementPanel
            disabled={disabled}
            engineers={viewModel.rosterEngineers}
            evaluators={viewModel.rosterEvaluators}
            onAddEngineers={onAddEngineers}
            onAddEvaluators={onAddEvaluators}
          />
        </TabsContent>
        <TabsContent value="season">
          <CycleCreatorPanel
            cycleCount={viewModel.cycleCount}
            cycleLabel={viewModel.cycleLabel}
            cycleStatus={viewModel.cycleStatus}
            disabled={disabled}
            endsAt={viewModel.cycleEndsAt}
            onCreate={onCreateCycle}
            startsAt={viewModel.cycleStartsAt}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <EvaluationTaskPanel
            disabled={disabled}
            evaluators={viewModel.evaluatorOptions}
            onDelete={onDeleteTask}
            onSave={onSaveTask}
            tasks={viewModel.tasks}
            weightTotal={viewModel.weightTotal}
          />
        </TabsContent>
        <TabsContent value="weights">
          <EngineerTaskWeightPanel
            disabled={disabled}
            onSave={onEngineerTaskWeightsChange}
            rows={viewModel.engineerTaskWeights}
          />
        </TabsContent>
        <TabsContent value="scores">
          <div className="space-y-4">
            <DirectScoreSourceEditor
              disabled={disabled}
              onDeleteCertificationRecord={onDeleteCertificationRecord}
              onDeleteLanguageRecord={onDeleteLanguageRecord}
              onSaveCertificationRecord={onSaveCertificationRecord}
              onSaveLanguageRecord={onSaveLanguageRecord}
              onVerifySourceRecord={onVerifySourceRecord}
              rows={viewModel.directScores}
            />
            <DirectScoreEditor
              disabled={disabled}
              initialQuery={directScoreQuery}
              key={directScoreQuery}
              onScoreChange={onDirectScoreChange}
              rows={viewModel.directScores}
            />
          </div>
        </TabsContent>
        <TabsContent value="reset">
          <ResetDemoPanel disabled={disabled} onReset={onResetDemoData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
