import { z } from "zod"

import { getSupabaseBrowserClient, getSupabasePublicConfig } from "./supabase-client"

const apiErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) })

export class RemoteApiError extends Error {
  readonly name = "RemoteApiError"

  constructor(readonly code: string, message: string, readonly status: number) {
    super(message)
  }
}

export async function invokeAuthenticated<T>(
  functionName: string,
  body: unknown,
  responseSchema: z.ZodType<T>,
): Promise<T> {
  const config = getSupabasePublicConfig()
  if (config === null) throw new RemoteApiError("NOT_CONFIGURED", "Supabase 연결 정보가 없습니다.", 500)
  const session = await getSupabaseBrowserClient().auth.getSession()
  const accessToken = session.data.session?.access_token
  if (session.error !== null || accessToken === undefined) {
    throw new RemoteApiError("UNAUTHENTICATED", "로그인이 만료되었습니다.", 401)
  }
  const response = await fetch(`${config.url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": config.publishableKey,
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload)
    throw new RemoteApiError(
      parsed.success ? parsed.data.error.code : "REMOTE_REQUEST_FAILED",
      parsed.success ? parsed.data.error.message : "서버 요청을 처리하지 못했습니다.",
      response.status,
    )
  }
  return responseSchema.parse(payload)
}
