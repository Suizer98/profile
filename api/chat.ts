import type { IncomingMessage, ServerResponse } from "node:http"

import { runChat } from "../server/chatHandler.ts"

const maxBodyBytes = 200_000

type ChatRequest = IncomingMessage & {
  body?: unknown
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on("data", (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBodyBytes) {
        reject(new Error("Message is too large"))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function payloadFrom(body: unknown) {
  if (typeof body === "string") {
    return JSON.parse(body) as unknown
  }
  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString("utf8")) as unknown
  }
  return body
}

export default async function handler(req: ChatRequest, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ error: "Use POST" }))
    return
  }
  try {
    const raw = req.body === undefined || req.body === "" ? await readBody(req) : req.body
    const result = await runChat(process.env, payloadFrom(raw))
    res.statusCode = result.status
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(result.body))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed"
    res.statusCode = 500
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ error: message }))
  }
}
