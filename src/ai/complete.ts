import { maxToolRounds, systemPrompt } from "./constants.ts"
import { mapToolSchemas, runMapAction } from "./mapActions.ts"

export type ChatTurn = {
  role: "user" | "assistant"
  content: string
}

type ToolCall = {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

type ApiMessage = {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

type ChoiceMessage = {
  content?: string | null
  tool_calls?: ToolCall[]
}

function parseArgs(raw: string) {
  if (!raw.trim()) {
    return {}
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return {}
  }
  return {}
}

async function requestCompletion(messages: ApiMessage[]) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, tools: mapToolSchemas }),
  })
  const raw = await response.text()
  let data: { message?: ChoiceMessage; error?: string } = {}
  try {
    data = JSON.parse(raw) as { message?: ChoiceMessage; error?: string }
  } catch {
    data = {}
  }
  if (!response.ok) {
    throw new Error(data.error || `Chat ${response.status}`)
  }
  if (!data.message) {
    throw new Error("Chat returned no message")
  }
  return data.message
}

export async function completeChat(turns: ChatTurn[]) {
  const messages: ApiMessage[] = [
    { role: "system", content: systemPrompt },
    ...turns.map((turn) => ({ role: turn.role, content: turn.content })),
  ]
  for (let round = 0; round < maxToolRounds; round += 1) {
    const message = await requestCompletion(messages)
    const calls = message.tool_calls ?? []
    if (calls.length === 0) {
      const text = (message.content ?? "").trim()
      return text || "Done."
    }
    messages.push({
      role: "assistant",
      content: message.content ?? "",
      tool_calls: calls,
    })
    for (const call of calls) {
      const result = runMapAction(call.function.name, parseArgs(call.function.arguments))
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result.detail,
      })
    }
  }
  return "I updated the globe. Ask if you want another change."
}
