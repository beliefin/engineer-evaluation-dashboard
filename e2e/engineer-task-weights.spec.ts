import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("개인별 과제 가중치를 바꾸면 적용 과제와 저장값이 함께 갱신된다", async ({ page }) => {
  await page.goto("/operations?tab=weights")
  await waitForApp(page)
  await page.getByRole("heading", { name: "개인별 과제 가중치" }).waitFor()

  const otsWeight = page.getByRole("spinbutton", { name: "OTS 시나리오 제작 가중치" })
  const dxWeight = page.getByRole("spinbutton", { name: "DX 툴 활용 가중치" })
  await expect(otsWeight).toHaveValue("0")
  await expect(dxWeight).toHaveValue("35")
  await otsWeight.fill("35")
  await dxWeight.fill("0")
  await page.getByRole("button", { name: "개인별 가중치 저장" }).click()
  await expect(page.getByText("개인별 과제 가중치를 저장했습니다.")).toBeVisible()

  await page.reload()
  await waitForApp(page)
  await expect(otsWeight).toHaveValue("35")
  await expect(dxWeight).toHaveValue("0")

  await page.goto("/engineers/detail?engineerId=engineer-01")
  await waitForApp(page)
  const categoryPanel = page.getByRole("heading", { name: "분야별 점수" }).locator("xpath=../..")
  await expect(categoryPanel.getByText("OTS 시나리오 제작", { exact: true })).toHaveCount(2)
  await expect(categoryPanel.getByText("DX 툴 활용", { exact: true })).toHaveCount(0)
})
