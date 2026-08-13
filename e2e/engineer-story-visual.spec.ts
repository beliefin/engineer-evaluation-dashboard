import { mkdir } from "node:fs/promises"

import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/engineer-story"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("individual evaluation story stays readable across breakpoints", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive visual verification pass")

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/engineers/detail?engineerId=engineer-01")
    await waitForApp(page)

    await expect(page.getByRole("heading", { name: "한 명의 평가 스토리" })).toBeVisible()
    await expect(page.getByText("현재 순위", { exact: true })).toBeVisible()
    await expect(page.getByText("상위 백분위", { exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "개인 역량 프로필" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "과제별 상세 비교" })).toBeVisible()
    await expect(page.getByText("상위 25%", { exact: true }).first()).toBeVisible()
    await expect(
      page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).resolves.toBe(false)

    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `${OUTPUT_DIR}/${viewport.name}.png`,
    })
  }
})
