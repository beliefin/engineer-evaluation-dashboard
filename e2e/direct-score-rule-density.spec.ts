import { expect, test } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import path from "node:path"

import { clearDemoStorage, waitForApp } from "./helpers"

const OUTPUT_DIR = path.resolve(".omo/evidence/direct-score-rule-density")
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-768", width: 768, height: 900 },
  { name: "mobile-375", width: 375, height: 900 },
] as const

test.describe("자격·어학 환산 규칙 입력 밀도", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}에서 규칙 편집 폼이 읽기 쉽게 재배치된다`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "one controlled responsive capture pass")
      await mkdir(OUTPUT_DIR, { recursive: true })
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await clearDemoStorage(page)
      await page.goto("/operations?tab=scoreTables")
      await waitForApp(page)

      const form = page.getByRole("form", { name: "환산 규칙 편집" })
      await expect(form).toBeVisible()
      await expect(form.getByLabel("연결 과제")).toBeVisible()
      await expect(form.getByLabel("규칙 이름")).toBeVisible()

      const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(pageOverflow).toBe(false)

      if (viewport.width >= 1280) {
        const box = await form.boundingBox()
        expect(box).not.toBeNull()
        expect(box?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(360)
        const rowTops = await form.locator("label").evaluateAll((labels) => {
          const tops = labels.map((label) => Math.round(label.getBoundingClientRect().top / 4) * 4)
          return [...new Set(tops)]
        })
        expect(rowTops.length).toBeLessThanOrEqual(3)
      }

      await form.screenshot({ path: path.join(OUTPUT_DIR, `${viewport.name}.png`) })
      if (viewport.width >= 1280) {
        await form.getByLabel("원천 종류").selectOption("certification")
        await expect(form.getByLabel("분야")).toBeVisible()
        await expect(form.getByLabel("신규취득 가산점")).toBeVisible()
        await form.screenshot({ path: path.join(OUTPUT_DIR, `${viewport.name}-certification.png`) })
      }
    })
  }
})
