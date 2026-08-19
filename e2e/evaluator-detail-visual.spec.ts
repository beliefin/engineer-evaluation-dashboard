import { mkdir } from "node:fs/promises"

import { expect, test } from "@playwright/test"

import { AUTH_STORAGE_KEY, clearDemoStorage, loginAs, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/evaluator-detail"
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
  await page.goto("/login")
})

test("operator can inspect and switch evaluator profiles across breakpoints", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive visual verification pass")
  await loginAs(page, "운영자")

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/analysis/evaluators/detail")
    await waitForApp(page)

    await expect(page.getByRole("heading", { name: "평가자 평가 프로필" })).toBeVisible()
    await expect(page.getByText("평가 성향 요약", { exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "과제별 평가 성향" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "평가 항목별 경향" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "최근 평가 이력" })).toBeVisible()
    await expect(
      page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).resolves.toBe(false)

    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `${OUTPUT_DIR}/${viewport.name}.png`,
    })
  }

  const evaluatorSelect = page.getByRole("combobox", { name: "평가자 선택" })
  const optionCount = await evaluatorSelect.locator("option").count()
  expect(optionCount).toBeGreaterThan(1)
  await evaluatorSelect.selectOption({ index: 1 })
  await expect(page).toHaveURL(/evaluatorId=/)
})

test("evaluator cannot open individual evaluator profiles", async ({ page }) => {
  await loginAs(page, "평가자")
  await page.goto("/analysis/evaluators/detail")
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "접근 권한이 없습니다" })).toBeVisible()
})

test("granted evaluator can inspect all analysis and detail pages without proxy input access", async ({ page }) => {
  await loginAs(page, "평가자")
  await page.evaluate((storageKey) => {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === null) throw new Error("테스트 계정 저장소가 없습니다.")
    const snapshot = JSON.parse(stored) as {
      accounts: Array<{ username: string; canViewInsights: boolean }>
    }
    snapshot.accounts = snapshot.accounts.map((account) => account.username === "evaluator01"
      ? { ...account, canViewInsights: true }
      : account)
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot))
  }, AUTH_STORAGE_KEY)

  await page.goto("/analysis")
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "평가 항목 분석" })).toBeVisible()
  await page.getByRole("link", { name: "평가자 상세" }).click()
  await expect(page.getByRole("heading", { name: "평가자 평가 프로필" })).toBeVisible()

  await page.goto("/engineers/detail?engineerId=engineer-01")
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "샘플 엔지니어 01" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "평가자별 상세" })).toBeVisible()
  await expect(page.getByLabel("대리 입력 평가자")).toHaveCount(0)
  await expect(page.getByRole("link", { name: /운영 설정/ })).toHaveCount(0)
})
