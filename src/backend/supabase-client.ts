import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type SupabasePublicConfig = Readonly<{ url: string; publishableKey: string }>

let browserClient: SupabaseClient | null = null

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const forcedMode = process.env.NEXT_PUBLIC_BACKEND_MODE
  if (forcedMode === "local" || (process.env.NODE_ENV === "test" && forcedMode !== "remote")) {
    return null
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !publishableKey) return null
  return { url, publishableKey }
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null
}

export function getSupabaseBrowserClient(): SupabaseClient {
  const config = getSupabasePublicConfig()
  if (config === null) throw new Error("Supabase 연결 정보가 설정되지 않았습니다.")
  browserClient ??= createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  })
  return browserClient
}
