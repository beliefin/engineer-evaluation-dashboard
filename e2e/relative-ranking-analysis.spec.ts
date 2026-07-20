import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const OUTPUT_DIR = "C:/llmwiki/outputs/engineer-evaluation-dashboard/visual-qa"
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
] as const

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("선택 인원 변경이 상대 구간을 즉시 다시 계산한다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "single responsive interaction pass")
  test.setTimeout(120_000)

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/analysis")
    await waitForApp(page)
    const postponePasswordChange = page.getByRole("button", { name: "나중에 변경" })
    await expect(postponePasswordChange).toBeHidden({ timeout: 5_000 })
    await page.mouse.move(1, 1)

    const section = page.getByRole("region", { name: "선택 집단 상대 서열 분석" })
    await expect(section).toBeVisible()
    await expect(section.getByText("체크된 인원만으로 순위와 등급을 다시 계산합니다.", { exact: false })).toBeVisible()
    const selectedValue = section.getByText("선택 인원", { exact: true }).locator("xpath=following-sibling::dd")
    const initialCount = Number.parseInt((await selectedValue.textContent()) ?? "0", 10)
    expect(initialCount).toBeGreaterThan(1)
    await page.screenshot({
      animations: "disabled",
      path: `${OUTPUT_DIR}/relative-ranking-${viewport.name}.png`,
    })

    if (viewport.width >= 1024) {
      await section.locator("aside input[type=checkbox]:not([disabled])").first().uncheck()
    } else {
      await section.getByRole("button", { name: /^분석 대상/ }).click()
      const selectorSheet = page.getByRole("dialog", { name: "분석 대상 선택" })
      await page.screenshot({
        animations: "disabled",
        path: `${OUTPUT_DIR}/relative-ranking-${viewport.name}-selector.png`,
      })
      await selectorSheet.locator("input[type=checkbox]:not([disabled])").first().uncheck()
      await page.keyboard.press("Escape")
    }

    await expect(selectedValue).toHaveText(`${initialCount - 1}명`)
    await expect(section.getByRole("img", { name: "선택 집단의 하위에서 상위로 상승하는 상대 서열 점수 곡선" })).toBeVisible()
    await expect(section.getByText(/^B 진입 \d+\.\d점$/)).toBeVisible()
    await expect(section.getByText(/^S\/A 진입 \d+\.\d점$/)).toBeVisible()
    await page.screenshot({
      animations: "disabled",
      path: `${OUTPUT_DIR}/relative-ranking-${viewport.name}-recalculated.png`,
    })
    if (viewport.width >= 1024) {
      await section.locator("circle[role=button]").last().click()
      await section.getByText("과제 반영", { exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({
        animations: "disabled",
        path: `${OUTPUT_DIR}/relative-ranking-desktop-detail.png`,
      })
      await section.getByText("선택 집단 순위표 보기", { exact: true }).click()
      const rankingTable = section.getByRole("table", {
        name: "선택 집단의 현재 점수, 상대 순위와 명목 등급",
      })
      await rankingTable.scrollIntoViewIfNeeded()
      await page.screenshot({
        animations: "disabled",
        path: `${OUTPUT_DIR}/relative-ranking-desktop-table.png`,
      })
    } else if (viewport.width < 768) {
      await section.locator("circle[role=button]").last().click()
      await section.getByText("과제 반영", { exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({
        animations: "disabled",
        path: `${OUTPUT_DIR}/relative-ranking-mobile-detail.png`,
      })
      await section.getByText("선택 집단 순위표 보기", { exact: true }).click()
      const mobileRanking = section.getByRole("list", {
        name: "선택 집단 모바일 순위 목록",
      })
      await mobileRanking.scrollIntoViewIfNeeded()
      await page.screenshot({
        animations: "disabled",
        path: `${OUTPUT_DIR}/relative-ranking-mobile-list.png`,
      })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  }
})
