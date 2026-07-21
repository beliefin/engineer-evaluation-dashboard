"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RosterManagementPanel } from "@/features/roster"

import { CycleCreatorPanel } from "./cycle-creator-panel"
import { DirectScoreEditor } from "./direct-score-editor"
import { DirectScoreSourceEditor } from "./direct-score-source-editor"
import { DirectScoreRulePanel } from "./direct-score-rule-panel"
import { DerivedScoreRulePanel } from "./derived-score-rule-panel"
import { EvaluationTaskPanel } from "./evaluation-task-panel"
import { EvaluatorAssignmentPanel } from "./evaluator-assignment-panel"
import { EngineerTaskWeightPanel } from "./engineer-task-weight-panel"
import { ResetDemoPanel } from "./reset-demo-panel"
import { ReopenSheetPanel } from "./reopen-sheet-panel"
import { ScoreAdjustmentPanel } from "./score-adjustment-panel"
import type { OperationsConsoleProps } from "./types"

export function OperationsConsole({
  viewModel,
  disabled = false,
  showReset = true,
  onCreateCycle,
  onUpdateCycle,
  onSetCycleLock,
  onDeleteCycle,
  onSaveTask,
  onDeleteTask,
  onUpdateEvaluatorAssignments,
  onUpdateEvaluatorPreset,
  onEngineerTaskWeightsChange,
  onDirectScoreChange,
  onSaveScoreAdjustment,
  onDeleteScoreAdjustment,
  onSaveLanguageRecord,
  onDeleteLanguageRecord,
  onSaveDirectScoreRule,
  onDeleteDirectScoreRule,
  onPreviewDirectScoreRule,
  onSaveDerivedScoreRule,
  onDeleteDerivedScoreRule,
  onSaveCertificationRecord,
  onDeleteCertificationRecord,
  onVerifySourceRecord,
  onAddEngineers,
  onUpdateEngineer,
  onDeleteEngineer,
  onAddEvaluators,
  onUpdateEvaluator,
  onDeleteEvaluator,
  onReopenSheet,
  onResetDemoData,
  activeTab = "roster",
  directScoreQuery = "",
  onTabChange,
  linkedEngineerIds = [],
  linkedEvaluatorIds = [],
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
            value === "assignments" ||
            value === "weights" ||
            value === "derived" ||
            value === "scores" ||
            value === "scoreTables" ||
            value === "adjustments" ||
            value === "unlocks" ||
            value === "reset"
          ) {
            onTabChange?.(value)
          }
        }}
        value={activeTab}
      >
        <div className="-mx-1 px-1 sm:mx-0 sm:overflow-x-auto sm:px-0 sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
          <TabsList className="grid w-full grid-cols-3 gap-x-1 gap-y-3 group-data-horizontal/tabs:!h-auto sm:inline-flex sm:w-fit sm:min-w-max sm:justify-start sm:gap-1 sm:group-data-horizontal/tabs:!h-10" variant="line">
            <TabsTrigger value="roster">명단 등록</TabsTrigger>
            <TabsTrigger value="season">평가 시즌</TabsTrigger>
            <TabsTrigger value="tasks">과제 구성</TabsTrigger>
            <TabsTrigger value="assignments">평가자 배정</TabsTrigger>
            <TabsTrigger value="weights">개인별 가중치</TabsTrigger>
            <TabsTrigger value="derived">연계·파생 점수</TabsTrigger>
            <TabsTrigger value="scores">자격, 어학 입력</TabsTrigger>
            <TabsTrigger value="scoreTables">자격·어학 평가표</TabsTrigger>
            <TabsTrigger value="adjustments">개인 총점 가·감점</TabsTrigger>
            <TabsTrigger value="unlocks">평가 잠금 해제</TabsTrigger>
            {showReset ? <TabsTrigger value="reset">초기화</TabsTrigger> : null}
          </TabsList>
        </div>
        <TabsContent value="roster">
          <RosterManagementPanel
            departmentCatalog={viewModel.departmentCatalog ?? []}
            disabled={disabled || viewModel.cycleLocked}
            engineers={viewModel.rosterEngineers}
            evaluators={viewModel.rosterEvaluators}
            linkedEngineerIds={linkedEngineerIds}
            linkedEvaluatorIds={linkedEvaluatorIds}
            onAddEngineers={onAddEngineers}
            onAddEvaluators={onAddEvaluators}
            onDeleteEvaluator={onDeleteEvaluator}
            onDeleteEngineer={onDeleteEngineer}
            onUpdateEngineer={onUpdateEngineer}
            onUpdateEvaluator={onUpdateEvaluator}
          />
        </TabsContent>
        <TabsContent value="season">
          <CycleCreatorPanel
            cycleId={viewModel.cycleId}
            cycleCount={viewModel.cycleCount}
            cycleLabel={viewModel.cycleLabel}
            cycleLocked={viewModel.cycleLocked}
            cycleStatus={viewModel.cycleStatus}
            disabled={disabled}
            endsAt={viewModel.cycleEndsAt}
            onCreate={onCreateCycle}
            onSetLock={onSetCycleLock}
            onUpdate={onUpdateCycle}
            onDelete={onDeleteCycle}
            startsAt={viewModel.cycleStartsAt}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <EvaluationTaskPanel
            disabled={disabled || viewModel.cycleLocked}
            onDelete={onDeleteTask}
            onSave={onSaveTask}
            tasks={viewModel.tasks}
            weightTotal={viewModel.weightTotal}
          />
        </TabsContent>
        <TabsContent value="assignments">
          <EvaluatorAssignmentPanel
            disabled={disabled || viewModel.cycleLocked}
            evaluators={viewModel.evaluatorOptions}
            groups={viewModel.evaluatorAssignments}
            preset={viewModel.evaluatorPreset}
            onSave={onUpdateEvaluatorAssignments}
            onSavePreset={onUpdateEvaluatorPreset}
          />
        </TabsContent>
        <TabsContent value="weights">
          <EngineerTaskWeightPanel
            disabled={disabled || viewModel.cycleLocked}
            onSave={onEngineerTaskWeightsChange}
            rows={viewModel.engineerTaskWeights}
          />
        </TabsContent>
        <TabsContent value="derived">
          <DerivedScoreRulePanel
            derivedTasks={viewModel.derivedTasks ?? []}
            disabled={disabled || viewModel.cycleLocked}
            engineers={viewModel.derivedEngineerOptions ?? []}
            onDelete={onDeleteDerivedScoreRule}
            onSave={onSaveDerivedScoreRule}
            rules={viewModel.derivedScoreRules ?? []}
            sourceTasks={viewModel.derivedSourceTasks ?? []}
          />
        </TabsContent>
        <TabsContent value="scores">
          <div className="space-y-4">
            <DirectScoreSourceEditor
              certificationOptions={viewModel.certificationOptions ?? []}
              languageOptions={viewModel.languageOptions ?? []}
              cycleStartsAt={viewModel.cycleStartsAt}
              disabled={disabled || viewModel.cycleLocked}
              onDeleteCertificationRecord={onDeleteCertificationRecord}
              onDeleteLanguageRecord={onDeleteLanguageRecord}
              onSaveCertificationRecord={onSaveCertificationRecord}
              onSaveLanguageRecord={onSaveLanguageRecord}
              onVerifySourceRecord={onVerifySourceRecord}
              rows={viewModel.directScores}
            />
            <DirectScoreEditor
              disabled={disabled || viewModel.cycleLocked}
              initialQuery={directScoreQuery}
              key={directScoreQuery}
              onScoreChange={onDirectScoreChange}
              rows={viewModel.directScores}
            />
          </div>
        </TabsContent>
        <TabsContent value="scoreTables">
          <DirectScoreRulePanel
            disabled={disabled || viewModel.cycleLocked}
            onDelete={onDeleteDirectScoreRule}
            onPreview={onPreviewDirectScoreRule}
            onSave={onSaveDirectScoreRule}
            operatorTasks={viewModel.operatorTasks ?? []}
            rules={viewModel.directScoreRules ?? []}
          />
        </TabsContent>
        <TabsContent value="adjustments">
          <ScoreAdjustmentPanel
            disabled={disabled || viewModel.cycleLocked}
            onDelete={onDeleteScoreAdjustment}
            onSave={onSaveScoreAdjustment}
            rows={viewModel.scoreAdjustments}
          />
        </TabsContent>
        <TabsContent value="unlocks">
          <ReopenSheetPanel
            disabled={disabled || viewModel.cycleLocked}
            onReopen={(sheetId, reason) => { onReopenSheet(sheetId, reason) }}
            sheets={viewModel.submittedSheets}
          />
        </TabsContent>
        {showReset ? (
          <TabsContent value="reset">
            <ResetDemoPanel disabled={disabled || viewModel.cycleLocked} onReset={onResetDemoData} />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
