import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("운영자가 개인 총점 가점을 저장하고 새로고침 후 삭제한다", async ({ page }) => {
  await page.goto("/operations?tab=adjustments")
  await waitForApp(page)
  const panel = page.getByRole("region", { name: "개인 총점 가·감점" })

  await panel.getByRole("spinbutton", { name: "가·감점 값" }).fill("2.5")
  await panel.getByRole("textbox", { name: "적용 사유" }).fill("E2E 검증 가점")
  await panel.getByRole("button", { name: "가·감점 반영" }).click()

  await expect(panel.getByText("+2.50", { exact: true }).first()).toBeVisible()
  await expect(panel.getByText("82.00", { exact: true })).toBeVisible()
  await page.reload()
  await waitForApp(page)
  await expect(panel.getByText("E2E 검증 가점", { exact: true })).toBeVisible()

  await panel.getByRole("button", { name: "E2E 검증 가점 삭제" }).click()
  await page.getByRole("button", { name: "삭제", exact: true }).click()

  await expect(panel.getByText("등록된 가·감점이 없습니다.")).toBeVisible()
  await expect(panel.getByText("79.50", { exact: true })).toHaveCount(2)
})
