import { mkdir } from "node:fs/promises"

import { expect, test, type Page } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/calendar-current-date"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 844 },
] as const
const FIXED_NOW = new Date("2026-08-11T09:00:00+09:00")

async function openCalendar(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW)
  await page.goto("/calendar")
  await waitForApp(page)
  await expect(page).toHaveURL(/\/calendar\/?(?:\?.*)?$/)
  await expect(page.getByRole("heading", { name: "2026년 8월", level: 2 }).first()).toBeVisible()
}

async function calendarSection(page: Page) {
  const section = page.getByRole("heading", { name: "발표 일정", level: 1 })
    .locator("xpath=ancestor::section")
  await section.scrollIntoViewIfNeeded()
  return section
}

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("발표 일정은 당월로 열리고 오늘을 세 가지 폭에서 강조한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single visual verification pass")

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await openCalendar(page)

    const section = await calendarSection(page)
    const currentDate = page.locator('time[datetime="2026-08-11"][aria-current="date"]')
    await expect(currentDate.first()).toBeAttached()
    await expect(page.getByText(/^오늘 8월 11일/).first()).toBeVisible()
    await expect(
      page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ).resolves.toBe(false)

    if (viewport.width >= 768) {
      const currentGridDate = page.getByRole("table", { name: "월간 발표 일정" })
        .locator('time[datetime="2026-08-11"][aria-current="date"]')
      await expect(currentGridDate).toBeVisible()
      await expect(currentGridDate).toHaveCSS("background-color", "rgb(43, 82, 120)")
      await expect(currentGridDate).toHaveCSS("color", "rgb(255, 255, 255)")
    }

    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })
    await page.addStyleTag({
      content: 'header.sticky, a[href="#main-content"] { visibility: hidden !important; }',
    })
    await section.screenshot({
      animations: "disabled",
      path: `${OUTPUT_DIR}/${viewport.name}.png`,
    })
  }
})
