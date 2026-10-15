import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("handoff changes render without desktop or mobile overflow", async ({ page }, testInfo) => {
  test.setTimeout(120_000)

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    // Keep the configured GitHub Pages project path when the test targets the
    // deployed site; a leading slash would incorrectly navigate to /analysis.
    await page.goto("analysis")
    await waitForApp(page)

    const ranking = page.locator(".signal-relative")
    await expect(ranking).toBeVisible()
    await ranking.screenshot({
      animations: "disabled",
      path: testInfo.outputPath(`relative-ranking-${viewport.name}.png`),
    })

    const qualification = page.locator(".signal-qualification")
    await qualification.scrollIntoViewIfNeeded()
    await expect(qualification).toBeVisible()
    await qualification.screenshot({
      animations: "disabled",
      path: testInfo.outputPath(`qualification-${viewport.name}.png`),
    })

    await expect(page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).resolves.toBe(false)
  }
})
