import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("연계 규칙의 엔지니어와 과제를 연속 선택해도 화면이 유지된다", async ({ page }) => {
  await page.goto("/operations?tab=tasks")
  await waitForApp(page)
  const postponePasswordChange = page.getByRole("button", { name: "나중에 변경" })
  if (await postponePasswordChange.isVisible()) await postponePasswordChange.click()

  await page.getByRole("button", { name: "과제 추가" }).click()
  await page.getByLabel("과제명").fill("연계 테스트 과제")
  await page.getByLabel("평가방식").click()
  await page.getByRole("option", { name: "연계 점수 평균" }).click()
  await page.getByRole("button", { name: "과제 저장" }).click()

  await page.getByRole("tab", { name: "연계·파생 점수" }).click()
  const targetEngineer = page.getByLabel("점수를 받을 엔지니어")
  const derivedTask = page.getByLabel("파생 점수 과제")
  const sourceTask = page.getByLabel("평균 원천 과제")

  await targetEngineer.selectOption({ index: 1 })
  await derivedTask.selectOption({ label: "연계 테스트 과제" })
  await sourceTask.selectOption({ index: 1 })

  await expect(page.getByRole("heading", { name: "화면을 불러오지 못했습니다" })).toHaveCount(0)
  await expect(targetEngineer.locator("option:checked")).not.toHaveText("선택")
  await expect(derivedTask.locator("option:checked")).toHaveText("연계 테스트 과제")
  await expect(sourceTask.locator("option:checked")).not.toHaveText("평가자 과제 선택")
})
