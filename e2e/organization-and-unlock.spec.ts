import { mkdir } from "node:fs/promises"

import { expect, test } from "@playwright/test"

import { clearDemoStorage, waitForApp } from "./helpers"

const EVIDENCE_DIR = ".omo/evidence/organization-and-unlock"

test.beforeEach(async ({ page }) => {
  await clearDemoStorage(page)
})

test("운영자가 조직 분류를 확인하고 제출 평가 잠금을 해제한다", async ({ page }, testInfo) => {
  const outputDir = `${EVIDENCE_DIR}/${testInfo.project.name}`
  await mkdir(outputDir, { recursive: true })

  await page.goto("/operations?tab=roster")
  await waitForApp(page)
  await expect(page.getByRole("heading", { name: "평가 명단 관리" })).toBeVisible()
  if ((page.viewportSize()?.width ?? 1280) >= 768) {
    const rosterTable = page.getByRole("region", { name: "엔지니어 명단 표" })
    await expect(rosterTable.getByText("1부문", { exact: true }).first()).toBeVisible()
    await expect(rosterTable.getByText("전자약품담당", { exact: true }).first()).toBeVisible()
  } else {
    await expect(page.locator("li").filter({ hasText: "전자약품담당" }).first()).toBeVisible()
  }
  await page.screenshot({ fullPage: true, path: `${outputDir}/01-roster.png` })

  await page.getByRole("button", { name: "엔지니어 1명 추가" }).click()
  const rosterDialog = page.getByRole("dialog", { name: "엔지니어 개별 등록" })
  await expect(rosterDialog.getByLabel("부문")).toHaveValue("1부문")
  await rosterDialog.getByLabel("팀").click()
  await page.getByRole("option", { name: "생산 2팀" }).click()
  await expect(rosterDialog.getByLabel("담당")).toContainText("염화메탄담당")
  await page.screenshot({ path: `${outputDir}/02-roster-dialog.png` })
  await page.keyboard.press("Escape")

  await page.getByRole("tab", { name: "평가 잠금 해제" }).click()
  await expect(page.getByRole("heading", { name: "제출 평가 잠금 해제" })).toBeVisible()
  const unlockButtons = page.getByRole("button", { name: "잠금 해제" })
  const lockedCount = await unlockButtons.count()
  expect(lockedCount).toBeGreaterThan(0)
  await page.screenshot({ fullPage: true, path: `${outputDir}/03-unlock-list.png` })

  await unlockButtons.first().click()
  const unlockDialog = page.getByRole("dialog", { name: "제출 평가 잠금 해제" })
  await expect(unlockDialog.getByText(/감사 기록에 남습니다/)).toBeVisible()
  await page.screenshot({ path: `${outputDir}/04-unlock-dialog.png` })
  await unlockDialog.getByLabel("잠금 해제 사유").fill("발표 점수 정정")
  await unlockDialog.getByRole("button", { name: "잠금 해제" }).click()
  await expect(unlockDialog).toBeHidden()
  await expect(unlockButtons).toHaveCount(lockedCount - 1)
})
