const allowedOrigins = new Set([
  "https://beliefin.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
])

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? ""
  return {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://beliefin.github.io",
    "Vary": "Origin",
  }
}

export function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json; charset=utf-8" },
  })
}
