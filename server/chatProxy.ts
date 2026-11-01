import type { IncomingMessage, ServerResponse } from "node:http"

import { loadEnv, type Plugin } from "vite"

import { runChat } from "./chatHandler.ts"

const maxBodyBytes = 200_000

type MiddlewareStack = {
  use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(body))
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

function attach(middlewares: MiddlewareStack, env: Record<string, string>) {
  middlewares.use("/api/chat", (req, res) => {
    void (async () => {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Use POST" })
        return
      }
      const payload = JSON.parse(await readBody(req)) as unknown
      const result = await runChat(env, payload)
      sendJson(res, result.status, result.body)
    })().catch((error: unknown) => {
      if (res.headersSent) {
        return
      }
      const message = error instanceof Error ? error.message : "Request failed"
      sendJson(res, 500, { error: message })
    })
  })
}

export function chatProxy(): Plugin {
  return {
    name: "chat-proxy",
    configureServer(server) {
      attach(server.middlewares, loadEnv(server.config.mode, server.config.envDir, ""))
    },
    configurePreviewServer(server) {
      attach(server.middlewares, loadEnv(server.config.mode, server.config.envDir, ""))
    },
  }
}
