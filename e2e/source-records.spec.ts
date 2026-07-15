import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("어학 원천 성적을 저장해도 환산 점수는 바뀌지 않고 새로고침 후 유지된다", async ({ page }) => {
  await page.goto("/operations?tab=scores")
  await waitForApp(page)

  const convertedScore = page.getByLabel("샘플 엔지니어 01 어학 점수").first()
  const before = await convertedScore.inputValue()
  await page.getByRole("button", { name: "어학 성적 추가" }).click()
  await page.getByLabel("시험명").fill("TEPS")
  await page.getByLabel("점수 또는 등급").fill("410")
  await page.getByLabel("취득일").fill("2026-04-12")
  await page.getByRole("button", { name: "저장" }).click()

  await expect(page.getByText("어학 성적을 저장했습니다.")).toBeVisible()
  await expect(page.getByRole("heading", { name: "TEPS" })).toBeVisible()
  await expect(convertedScore).toHaveValue(before)

  await page.reload()
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "TEPS" })).toBeVisible()
  await expect(page.getByLabel("샘플 엔지니어 01 어학 점수").first()).toHaveValue(before)
})
