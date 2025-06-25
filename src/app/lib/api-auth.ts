export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")

  if (!apiKey) return false

  const validKeys = process.env.API_KEYS?.split(",") || []
  return validKeys.includes(apiKey)
}

export function getApiKeyError() {
  return new Response(JSON.stringify({ error: "Invalid or missing API key" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  })
}
