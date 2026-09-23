import { mkdir } from "node:fs/promises"

import { expect, test } from "@playwright/test"

import { clearDemoStorage, loginAs, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/hermes_test/dashboard-ranking-export"

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("전체 과제별 순위와 종합 순위를 Excel로 내려받는다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive verification pass")

  await page.goto("/login")
  await loginAs(page, "운영자")
  await page.goto("/dashboard")
  await waitForApp(page)

  const taskButton = page.getByRole("button", { name: "전체 과제 순위 Excel" })
  const overallButton = page.getByRole("button", { name: "종합 순위 Excel" })
  await expect(taskButton).toBeVisible()
  await expect(overallButton).toBeVisible()

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${OUTPUT_DIR}/desktop.png`,
  })

  const taskDownload = page.waitForEvent("download")
  await taskButton.click()
  const downloadedTaskRanking = await taskDownload
  expect(downloadedTaskRanking.suggestedFilename()).toMatch(/전체 과제별 순위_\d{4}-\d{2}-\d{2}\.xlsx$/)
  await downloadedTaskRanking.saveAs(`${OUTPUT_DIR}/task-rankings.xlsx`)

  const overallDownload = page.waitForEvent("download")
  await overallButton.click()
  const downloadedOverallRanking = await overallDownload
  expect(downloadedOverallRanking.suggestedFilename()).toMatch(/전체 종합 순위_\d{4}-\d{2}-\d{2}\.xlsx$/)
  await downloadedOverallRanking.saveAs(`${OUTPUT_DIR}/overall-ranking.xlsx`)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await waitForApp(page)
  await expect(page.getByRole("button", { name: "전체 과제 순위 Excel" })).toBeVisible()
  await expect(page.getByRole("button", { name: "종합 순위 Excel" })).toBeVisible()
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${OUTPUT_DIR}/mobile.png`,
  })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  ).toBe(false)
})
