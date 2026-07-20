import { expect, type Page } from "@playwright/test"

export const STORAGE_KEY = "engineer-evaluation-dashboard:v6"
export const AUTH_STORAGE_KEY = "engineer-evaluation-dashboard:auth:v1"
export const AUTH_SESSION_KEY = "engineer-evaluation-dashboard:auth-session:v1"
const VERSION_FIVE_STORAGE_KEY = "engineer-evaluation-dashboard:v5"
const VERSION_FOUR_STORAGE_KEY = "engineer-evaluation-dashboard:v4"
const PREVIOUS_STORAGE_KEY = "engineer-evaluation-dashboard:v3"
const LEGACY_STORAGE_KEY = "engineer-evaluation-dashboard:v2"
const OLDEST_STORAGE_KEY = "engineer-evaluation-dashboard:v1"
const RESET_MARKER_KEY = "engineer-evaluation-dashboard:e2e-reset"

export async function clearDemoStorage(page: Page): Promise<void> {
  await page.addInitScript(
    ({ authSessionKey, authStorageKey, legacyStorageKey, markerKey, oldestStorageKey, previousStorageKey, storageKey, versionFiveStorageKey, versionFourStorageKey }) => {
      if (window.sessionStorage.getItem(markerKey) === "done") return
      window.localStorage.removeItem(storageKey)
      window.localStorage.removeItem(legacyStorageKey)
      window.localStorage.removeItem(oldestStorageKey)
      window.localStorage.removeItem(previousStorageKey)
      window.localStorage.removeItem(versionFiveStorageKey)
      window.localStorage.removeItem(versionFourStorageKey)
      window.localStorage.removeItem(authStorageKey)
      window.localStorage.removeItem(authSessionKey)
      window.sessionStorage.setItem(markerKey, "done")
    },
    {
      legacyStorageKey: LEGACY_STORAGE_KEY,
      authSessionKey: AUTH_SESSION_KEY,
      authStorageKey: AUTH_STORAGE_KEY,
      markerKey: RESET_MARKER_KEY,
      oldestStorageKey: OLDEST_STORAGE_KEY,
      previousStorageKey: PREVIOUS_STORAGE_KEY,
      storageKey: STORAGE_KEY,
      versionFiveStorageKey: VERSION_FIVE_STORAGE_KEY,
      versionFourStorageKey: VERSION_FOUR_STORAGE_KEY,
    },
  )
}

export async function waitForApp(page: Page): Promise<void> {
  const requestedPath = await page.evaluate(() => {
    const currentUrl = new URL(window.location.href)
    const navigationEntry = performance.getEntriesByType("navigation")[0]
    const initialUrl = navigationEntry ? new URL(navigationEntry.name) : currentUrl
    const targetUrl = currentUrl.pathname === "/login" && initialUrl.pathname !== "/login"
      ? initialUrl
      : currentUrl
    return `${targetUrl.pathname}${targetUrl.search}`
  })
  const loginButton = page.getByRole("button", { name: "로그인" })
  const sampleBadge = page.getByText("샘플 데이터", { exact: true }).first()
  await Promise.race([loginButton.waitFor(), sampleBadge.waitFor()])
  if (await loginButton.isVisible()) {
    await submitLogin(page, "operator")
    if (requestedPath !== "/dashboard" && requestedPath !== "/login") {
      await page.goto(requestedPath)
    }
  }
  await page.getByText("샘플 데이터", { exact: true }).first().waitFor()
  await dismissInitialPasswordChange(page)
}

const LOGIN_USERNAMES = {
  operator: "operator",
  evaluator: "evaluator01",
  approver: "approver",
  engineer: "engineer01",
} as const

async function submitLogin(page: Page, role: keyof typeof LOGIN_USERNAMES): Promise<void> {
  await page.getByLabel("아이디").fill(LOGIN_USERNAMES[role])
  await page.getByLabel("비밀번호").fill("Demo!2026")
  await page.getByRole("button", { name: "로그인" }).click()
  await page.getByText("샘플 데이터", { exact: true }).first().waitFor()
  await dismissInitialPasswordChange(page)
}

async function dismissInitialPasswordChange(page: Page): Promise<void> {
  const postponePasswordChange = page.getByRole("button", { name: "나중에 변경" })
  const passwordDialogOpened = await postponePasswordChange
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false)
  if (passwordDialogOpened) await postponePasswordChange.click()
}

export async function loginAs(
  page: Page,
  role: "운영자" | "평가자" | "승인자" | "엔지니어",
): Promise<void> {
  const roleKeys = {
    운영자: "operator",
    평가자: "evaluator",
    승인자: "approver",
    엔지니어: "engineer",
  } as const
  await page.evaluate((sessionKey) => window.localStorage.removeItem(sessionKey), AUTH_SESSION_KEY)
  await page.goto("/login")
  await submitLogin(page, roleKeys[role])
}

export async function switchRole(
  page: Page,
  roleLabel: "운영자" | "평가자" | "승인자" | "엔지니어",
): Promise<void> {
  await loginAs(page, roleLabel)
}

export async function switchEvaluator(page: Page, evaluatorLabel: string): Promise<void> {
  const mobile = (page.viewportSize()?.width ?? 1440) < 1024
  if (mobile) await page.getByRole("button", { name: "메뉴 열기" }).click()
  const evaluatorSelect = mobile
    ? page.getByLabel("대리 입력 평가자").last()
    : page.getByLabel("대리 입력 평가자").first()
  await evaluatorSelect.selectOption({ label: evaluatorLabel })
  if (mobile) {
    await page.getByRole("button", { name: "메뉴 닫기" }).click()
    await expect(page.getByRole("button", { name: "메뉴 닫기" })).toBeHidden()
  }
}

export async function openShellMenu(page: Page): Promise<void> {
  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole("button", { name: "메뉴 열기" }).click()
  }
}

export async function clickShellLink(page: Page, name: string | RegExp): Promise<void> {
  const mobile = (page.viewportSize()?.width ?? 1440) < 1024
  if (mobile) await openShellMenu(page)
  await page.getByRole("link", { name }).click()
  if (mobile) {
    await expect(page.getByRole("button", { name: "메뉴 닫기" })).toBeHidden()
  }
}
