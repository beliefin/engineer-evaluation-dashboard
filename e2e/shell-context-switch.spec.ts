import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("세션 저장소가 막혀도 시즌과 대리입력 평가자를 즉시 전환한다", async ({ page }) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  await page.goto("/operations?tab=cycle")
  await waitForApp(page)
  await page.getByRole("button", { name: "평가 시즌 만들기" }).click()
  await page.getByLabel("평가 시즌명").fill("전환 확인 시즌")
  await page.getByLabel("시작일").fill("2027-01-01")
  await page.getByLabel("종료일").fill("2027-06-30")
  await page.getByRole("button", { name: "시즌 만들기" }).click()

  await page.evaluate(() => {
    const nativeSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (this === window.sessionStorage && key.includes("engineer-evaluation-dashboard:selected-")) {
        throw new Error("session storage blocked")
      }
      nativeSetItem.call(this, key, value)
    }
  })

  const cycleSelect = page.getByLabel("평가 시즌").first()
  await cycleSelect.selectOption("cycle-2026-h1")
  await expect(cycleSelect).toHaveValue("cycle-2026-h1")

  const evaluatorSelect = page.getByLabel("대리 입력 평가자").first()
  await evaluatorSelect.selectOption("evaluator-02")
  await expect(evaluatorSelect).toHaveValue("evaluator-02")
  expect(pageErrors).toEqual([])
})
