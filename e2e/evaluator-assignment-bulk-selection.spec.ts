import { mkdir } from "node:fs/promises"

import { expect, test, type Page } from "@playwright/test"

import { clearDemoStorage, loginAs, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/evaluator-assignment-bulk-selection"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 900 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

async function openAssignmentPanel(page: Page): Promise<void> {
  await page.goto("/login")
  await loginAs(page, "운영자")
  await page.goto("/operations?tab=assignments")
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "엔지니어별 평가자 배정" })).toBeVisible()
}

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("평가자 전체 선택과 보호 배정 유지 해제를 확인한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive verification pass")
  test.setTimeout(120_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await openAssignmentPanel(page)

    const assignmentCheckboxes = page.getByRole("checkbox", { name: /평가 배정$/ })
    const protectedCheckboxes = page.locator('input[aria-label$="평가 배정"]:disabled')
    const removableCheckboxes = page.locator('input[aria-label$="평가 배정"]:not(:disabled)')
    await expect(protectedCheckboxes.first()).toBeChecked()

    await page.getByRole("button", { name: "전체 선택", exact: true }).click()
    const checkboxCount = await assignmentCheckboxes.count()
    for (let index = 0; index < checkboxCount; index += 1) {
      await expect(assignmentCheckboxes.nth(index)).toBeChecked()
    }
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `${OUTPUT_DIR}/${viewport.name}-all-selected.png`,
    })

    await page.getByRole("button", { name: "선택 해제", exact: true }).click()
    const protectedCount = await protectedCheckboxes.count()
    const removableCount = await removableCheckboxes.count()
    for (let index = 0; index < protectedCount; index += 1) {
      await expect(protectedCheckboxes.nth(index)).toBeChecked()
    }
    for (let index = 0; index < removableCount; index += 1) {
      await expect(removableCheckboxes.nth(index)).not.toBeChecked()
    }
    await expect(page.getByText(`${protectedCount}명 배정`, { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "선택 해제", exact: true })).toBeDisabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `${OUTPUT_DIR}/${viewport.name}-protected-only.png`,
    })
  }
})
