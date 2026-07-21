import { mkdir } from "node:fs/promises"

import { expect, test, type Page } from "@playwright/test"

import { clearDemoStorage, loginAs, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/latest-dashboard-operations-report"
const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
] as const

async function capture(page: Page, name: string, viewport: string): Promise<void> {
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${OUTPUT_DIR}/${name}-${viewport}.png`,
  })
}

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("평가 현황, 순위 대상, 고정 멤버, Excel 출력을 실제 화면에서 확인한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single visual verification pass")
  test.setTimeout(120_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/login")
    await loginAs(page, "운영자")

    await page.goto("/dashboard")
    await waitForApp(page)
    await expect(page.getByRole("heading", { name: "엔지니어별 평가 현황" })).toBeVisible()
    await expect(page.getByText("평가 진행 레일", { exact: true })).toHaveCount(0)
    await capture(page, "dashboard", viewport.name)

    await page.getByRole("button", { name: "순위 대상 관리" }).click()
    const populationDialog = page.getByRole("dialog", { name: "전체 종합 순위 대상" })
    await expect(populationDialog).toBeVisible()
    await capture(page, "ranking-population", viewport.name)
    const firstPopulationCheckbox = populationDialog.getByRole("checkbox").first()
    await firstPopulationCheckbox.uncheck()
    await expect(firstPopulationCheckbox).not.toBeChecked()
    await page.keyboard.press("Escape")

    await page.goto("/operations?tab=assignments")
    await waitForApp(page)
    await expect(page.getByRole("heading", { name: "엔지니어별 평가자 배정" })).toBeVisible()
    await capture(page, "evaluator-assignments", viewport.name)
    await page.getByRole("button", { name: "고정 멤버 설정" }).click()
    const presetDialog = page.getByRole("dialog", { name: "고정 평가자 멤버와 가중치" })
    await expect(presetDialog).toBeVisible()
    await capture(page, "evaluator-preset", viewport.name)
    const firstPresetCheckbox = presetDialog.getByRole("checkbox").first()
    await firstPresetCheckbox.check()
    await presetDialog.getByRole("button", { name: "취소" }).click()
    await page.getByRole("button", { name: "고정 멤버 설정" }).click()
    await expect(page.getByRole("dialog", { name: "고정 평가자 멤버와 가중치" }).getByRole("checkbox").first()).not.toBeChecked()
    await page.keyboard.press("Escape")

    await page.goto("/reports/season")
    await waitForApp(page)
    await expect(page.getByRole("heading", { name: "평가 데이터 Excel 출력" })).toBeVisible()
    await capture(page, "season-report", viewport.name)
  }

  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "전체 데이터 Excel" }).click()
  const downloadedFile = await download
  expect(downloadedFile.suggestedFilename()).toMatch(/\.xlsx$/)

  const taskDownload = page.waitForEvent("download")
  await page.getByRole("button", { name: "선택 과제 Excel" }).click()
  expect((await taskDownload).suggestedFilename()).toMatch(/\.xlsx$/)
})
