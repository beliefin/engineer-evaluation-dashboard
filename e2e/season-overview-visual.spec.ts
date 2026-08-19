import { mkdir } from "node:fs/promises"

import { expect, test } from "@playwright/test"

import { createSeedSnapshot } from "../src/data/seed"
import { clearDemoStorage, loginAs, STORAGE_KEY } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/season-overview"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-375", width: 375, height: 812 },
] as const

async function dismissPasswordPrompt(page: Parameters<typeof loginAs>[0]): Promise<void> {
  const postpone = page.getByRole("button", { name: "나중에 변경" })
  if (await postpone.isVisible()) {
    await postpone.evaluate((button) => (button as HTMLButtonElement).click())
    await expect(postpone).toBeHidden()
  }
}

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("all roles start on the season cover", async ({ page }) => {
  await page.goto("/login")
  for (const role of ["운영자", "평가자", "승인자", "엔지니어"] as const) {
    await loginAs(page, role)
    await expect(page).toHaveURL(/\/overview$/)
    await expect(page.getByRole("heading", { level: 1, name: /엔지니어 역량평가/ })).toBeVisible()
  }
})

test("season cover remains readable at desktop tablet and mobile widths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive visual verification pass")
  await page.goto("/login")
  await loginAs(page, "운영자")
  await dismissPasswordPrompt(page)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await expect(page.getByText("최종 반영 비율 100%")) .toBeVisible()
    await expect(page.getByRole("heading", { name: "과제별 목적과 수행 절차" })).toBeVisible()
    await expect(page.locator("#season-outcome-title")).toBeVisible()
    await expect(page.getByText(/35 \+ 35 \+ 10 \+ 10 \+ 10/)).toBeVisible()
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

test("education-only OTS work stays outside the general evaluation total", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single visual verification pass")
  const snapshot = createSeedSnapshot()
  await page.addInitScript(({ seed, storageKey }) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      ...seed,
      tasks: [
        ...seed.tasks,
        {
          id: "task-ots-education",
          cycleId: "cycle-2026-h1",
          name: "OTS 시나리오 제작 교육",
          description: "교육 담당자 대상 과제",
          method: "derived_score",
          weight: 70,
          order: 7,
          items: [],
        },
      ],
    }))
  }, { seed: structuredClone(snapshot), storageKey: STORAGE_KEY })
  await page.goto("/login")
  await loginAs(page, "운영자")
  await dismissPasswordPrompt(page)

  await expect(page.getByText("최종 반영 비율 100%")) .toBeVisible()
  await expect(page.getByRole("heading", { name: "교육 담당자 전용 과제" })).toBeVisible()
  await expect(page.getByText("일반 평가 합계 제외")).toBeVisible()
  await expect(page.getByText("70%", { exact: true })).toHaveCount(0)
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${OUTPUT_DIR}/education-task-separate-desktop.png`,
  })
})
