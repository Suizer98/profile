const defaultGroqModel = "openai/gpt-oss-120b"
const defaultGeminiModel = "gemini-3.5-flash"
const defaultGroqBaseUrl = "https://api.groq.com/openai/v1"
const defaultGeminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai"
const maxTokens = 2000

type Provider = {
  name: string
  apiKey: string
  baseUrl: string
  model: string
}

type Env = Record<string, string | undefined>

export type ChatResult = {
  status: number
  body: unknown
}

function providers(env: Env) {
  const list: Provider[] = []
  if (env.GROQ_API_KEY) {
    list.push({
      name: "groq",
      apiKey: env.GROQ_API_KEY,
      baseUrl: (env.GROQ_BASE_URL || defaultGroqBaseUrl).replace(/\/$/, ""),
      model: env.GROQ_MODEL || defaultGroqModel,
    })
  }
  if (env.GEMINI_API_KEY) {
    list.push({
      name: "gemini",
      apiKey: env.GEMINI_API_KEY,
      baseUrl: (env.GEMINI_BASE_URL || defaultGeminiBaseUrl).replace(/\/$/, ""),
      model: env.GEMINI_MODEL || defaultGeminiModel,
    })
  }
  return list
}

function errorDetail(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } }
    return parsed.error?.message || raw.slice(0, 180)
  } catch {
    return raw.slice(0, 180)
  }
}

async function forward(provider: Provider, payload: { messages: unknown; tools?: unknown }) {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: payload.messages,
      tools: payload.tools,
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  })
  const raw = await response.text()
  return { ok: response.ok, status: response.status, raw }
}

export async function runChat(env: Env, payload: unknown): Promise<ChatResult> {
  const list = providers(env)
  if (list.length === 0) {
    return { status: 500, body: { error: "Set GROQ_API_KEY or GEMINI_API_KEY" } }
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { status: 400, body: { error: "messages must be a list" } }
  }
  const messages = (payload as { messages?: unknown }).messages
  const tools = (payload as { tools?: unknown }).tools
  if (!Array.isArray(messages)) {
    return { status: 400, body: { error: "messages must be a list" } }
  }
  let lastError = "Request failed"
  for (const provider of list) {
    try {
      const result = await forward(provider, { messages, tools })
      if (!result.ok) {
        lastError = `${provider.name} ${result.status}: ${errorDetail(result.raw)}`
        continue
      }
      const data = JSON.parse(result.raw) as { choices?: Array<{ message?: unknown }> }
      const message = data.choices?.[0]?.message
      if (!message) {
        lastError = `${provider.name} returned no message`
        continue
      }
      return { status: 200, body: { message } }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }
  return { status: 502, body: { error: lastError } }
}
