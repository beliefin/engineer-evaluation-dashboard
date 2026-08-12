import { mkdir } from "node:fs/promises"

import { expect, test } from "@playwright/test"

import { clearDemoStorage, loginAs } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/engineer-evaluation-dashboard/.omo/evidence/season-overview"
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
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
    await expect(page.getByText("개인별 최종 반영 100%")) .toBeVisible()
    await expect(page.getByRole("heading", { name: "과제별 수행 설계도" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "이번 시즌이 남겨야 할 것" })).toBeVisible()
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
