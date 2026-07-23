import { expect, test } from "@playwright/test"

import { evaluationSnapshotSchema, type EvaluationSnapshot } from "@/domain"

import { clearDemoStorage, loginAs, STORAGE_KEY } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

function reopenAsDraft(
  sheet: EvaluationSnapshot["scoreSheets"][number],
): EvaluationSnapshot["scoreSheets"][number] {
  return {
    ...sheet,
    status: "draft",
    scores: sheet.scores.map((score) => ({ ...score, score: null })),
    submittedAt: null,
  }
}

async function dismissDelayedPasswordPrompt(page: Parameters<typeof loginAs>[0]): Promise<void> {
  const postpone = page.getByRole("button", { name: "나중에 변경" })
  const opened = await postpone
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false)
  if (opened) await postpone.click()
}

test("동시 발표 일정에서 두 평가지를 함께 열고 각각 저장한다", async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto("/login")
  await loginAs(page, "운영자")

  const firstScheduledEngineerName = "샘플 엔지니어 06"
  const secondScheduledEngineerName = "샘플 엔지니어 10"
  await page.goto("/calendar?month=2026-07")
  await dismissDelayedPasswordPrompt(page)
  await page.getByRole("button", { name: "일정 추가" }).click()
  const dialog = page.getByRole("dialog", { name: "발표 일정 추가" })
  await dialog.getByLabel("평가 과제").selectOption("task-ots-scenario")
  await dialog.getByLabel(new RegExp(firstScheduledEngineerName)).check()
  await dialog.getByLabel(new RegExp(secondScheduledEngineerName)).check()
  await dialog.getByLabel("두 발표자를 한 화면에서 평가").check()
  await dialog.getByLabel("일정 제목").fill("OTS 동시 발표 QA")
  await dialog.getByLabel("발표일").fill("2026-07-23")
  await dialog.getByLabel("시작 시간").fill("13:30")
  if (process.env.PARALLEL_VISUAL_EVIDENCE === "1") {
    await page.screenshot({
      path: ".omo/evidence/parallel-evaluation/schedule-grouping-desktop.png",
    })
  }
  await dialog.getByRole("button", { name: "일정 저장" }).click()
  await expect(dialog).toBeHidden()

  const rawSnapshot = await page.evaluate(
    (storageKey) => window.localStorage.getItem(storageKey),
    STORAGE_KEY,
  )
  if (rawSnapshot === null) throw new Error("demo snapshot was not initialized")
  const snapshot = evaluationSnapshotSchema.parse(JSON.parse(rawSnapshot))
  const scheduledEngineerIds = new Set(snapshot.scheduleEvents
    .filter((event) => event.title === "OTS 동시 발표 QA")
    .map((event) => event.engineerId))
  const assignments = snapshot.assignments
    .filter((assignment) =>
      assignment.evaluatorId === "evaluator-01" &&
      assignment.taskId === "task-ots-scenario" &&
      scheduledEngineerIds.has(assignment.engineerId),
    )
  const firstAssignment = assignments[0]
  const secondAssignment = assignments[1]
  if (firstAssignment === undefined || secondAssignment === undefined) {
    throw new Error("parallel OTS assignment fixtures were not found")
  }
  const firstEngineer = snapshot.engineers.find(
    (engineer) => engineer.id === firstAssignment.engineerId,
  )
  const secondEngineer = snapshot.engineers.find(
    (engineer) => engineer.id === secondAssignment.engineerId,
  )
  if (firstEngineer === undefined || secondEngineer === undefined) {
    throw new Error("parallel OTS engineer fixtures were not found")
  }

  const editableAssignmentIds = new Set(assignments.map((assignment) => assignment.id))
  const editableSnapshot = {
    ...snapshot,
    scoreSheets: snapshot.scoreSheets.map((sheet) => editableAssignmentIds.has(sheet.assignmentId)
      ? reopenAsDraft(sheet)
      : sheet),
  }
  await page.evaluate(
    ({ storageKey, value }) => window.localStorage.setItem(storageKey, value),
    { storageKey: STORAGE_KEY, value: JSON.stringify(editableSnapshot) },
  )

  await loginAs(page, "평가자")
  await page.goto("/calendar?month=2026-07")
  await dismissDelayedPasswordPrompt(page)
  const groupedSchedule = page.getByRole("button", { name: /OTS 동시 발표 QA/ }).first()
  await expect(groupedSchedule).toContainText(firstEngineer.displayName)
  await expect(groupedSchedule).toContainText(secondEngineer.displayName)
  await groupedSchedule.click()

  await expect(page).toHaveURL(/parallelAssignmentId=/)
  await expect(page.getByRole("heading", { name: "두 발표자 평가 입력" })).toBeVisible()
  const scoreTable = page.getByRole("table", { name: "두 발표자 평가 점수 입력" })
  await expect(scoreTable.getByRole("columnheader", { name: new RegExp(firstEngineer.displayName) })).toBeVisible()
  await expect(scoreTable.getByRole("columnheader", { name: new RegExp(secondEngineer.displayName) })).toBeVisible()
  await expect(scoreTable.getByText("시나리오 목적 및 현장 가치", { exact: true })).toHaveCount(1)
  const forms = page.locator("form")
  await expect(forms).toHaveCount(2)
  await expect(forms.nth(0)).toContainText(firstEngineer.displayName)
  await expect(forms.nth(1)).toContainText(secondEngineer.displayName)

  const firstScores = scoreTable.getByRole("textbox", {
    name: new RegExp(`^${firstEngineer.displayName} · .+ 점수$`),
  })
  const secondScores = scoreTable.getByRole("textbox", {
    name: new RegExp(`^${secondEngineer.displayName} · .+ 점수$`),
  })
  await expect(firstScores).toHaveCount(10)
  await expect(secondScores).toHaveCount(10)
  await firstScores.first().fill("9")
  await secondScores.first().fill("7")
  await expect(firstScores.first()).toHaveValue("9")
  await expect(secondScores.first()).toHaveValue("7")
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  if (process.env.PARALLEL_VISUAL_EVIDENCE === "1") {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: ".omo/evidence/parallel-evaluation/dual-evaluation-desktop.png",
    })
    await page.setViewportSize({ width: 768, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: ".omo/evidence/parallel-evaluation/dual-evaluation-tablet.png",
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: ".omo/evidence/parallel-evaluation/dual-evaluation-mobile.png",
    })
  }

  await page.reload()
  await dismissDelayedPasswordPrompt(page)
  const restoredTable = page.getByRole("table", { name: "두 발표자 평가 점수 입력" })
  await expect(restoredTable.getByRole("textbox", {
    name: new RegExp(`^${firstEngineer.displayName} · .+ 점수$`),
  }).first()).toHaveValue("9")
  await expect(restoredTable.getByRole("textbox", {
    name: new RegExp(`^${secondEngineer.displayName} · .+ 점수$`),
  }).first()).toHaveValue("7")
})
