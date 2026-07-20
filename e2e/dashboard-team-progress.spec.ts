import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
] as const

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("팀 범위가 평가 현황, 과제 평균과 완료자 순위에 함께 적용된다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive verification pass")
  test.setTimeout(180_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/dashboard")
    await waitForApp(page)
    const postponePasswordChange = page.getByRole("button", { name: "나중에 변경" })
    if (await postponePasswordChange.isVisible()) await postponePasswordChange.click()

    const progress = page.getByRole("heading", { name: "엔지니어별 평가 현황" }).locator("xpath=ancestor::section")
    const targetMetric = page.getByText("평가 대상", { exact: true }).locator("xpath=..")
    await expect(targetMetric.locator("span.numeric")).toContainText("24")
    await expect(page.getByText("가중 평균", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("비가중 평균", { exact: true }).first()).toBeVisible()
    await expect(page.getByRole("heading", { name: "전체 완료자 순위" })).toBeVisible()
    await expect(progress.getByText("생산 1팀", { exact: false }).first()).toBeVisible()
    await expect(progress.getByText("생산 2팀", { exact: false }).first()).toBeVisible()
    await page.getByRole("button", { name: "생산 1팀 현황 보기" }).click()
    await expect(page).toHaveURL(/team=/)
    await expect(targetMetric.locator("span.numeric")).toContainText("12")
    await expect(page.getByRole("heading", { name: "생산 1팀 완료자 순위" })).toBeVisible()
    await expect(progress.getByText("생산 2팀", { exact: false })).toHaveCount(0)
    await page.getByRole("button", { name: "생산 2팀 현황 보기" }).click()
    await expect(targetMetric.locator("span.numeric")).toContainText("12")
    await expect(page.getByRole("heading", { name: "생산 2팀 완료자 순위" })).toBeVisible()
    await expect(progress.getByText("생산 1팀", { exact: false })).toHaveCount(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).toBe(false)
    await page.getByRole("heading", { name: "생산 2팀 과제별 평균" }).scrollIntoViewIfNeeded()
    await expect(page.getByRole("heading", { name: "생산 2팀 과제별 평균" })).toBeVisible()
  }
})
