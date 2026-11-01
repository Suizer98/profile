import { Text } from "@mantine/core"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { useChatStore } from "../../store/useChatStore.ts"

export function Chat() {
  const open = useChatStore((state) => state.open)
  const messages = useChatStore((state) => state.messages)
  const sending = useChatStore((state) => state.sending)
  const error = useChatStore((state) => state.error)
  const setOpen = useChatStore((state) => state.setOpen)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const [draft, setDraft] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    const list = listRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages, sending, error, open])

  function submit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) {
      return
    }
    setDraft("")
    void sendMessage(text)
  }

  return (
    <div data-chat className="pointer-events-none fixed inset-0 z-40">
      {open ? (
        <section className="pointer-events-auto absolute right-4 bottom-20 flex max-h-[min(28rem,calc(100dvh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/20 bg-black/45 shadow-2xl backdrop-blur-xl">
          <Text size="xs" tt="uppercase" c="gray.4" fw={500} px="md" pt="md" style={{ letterSpacing: "0.16em" }}>
            Guide
          </Text>
          <div ref={listRef} className="flex max-h-80 flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <Text size="sm" c="gray.4" lh={1.6}>
                Ask me to fly the globe or turn a layer on.
              </Text>
            ) : null}
            {messages.map((message) => (
              <p
                key={message.id}
                className={`max-w-[92%] rounded-3xl px-5 py-3.5 text-sm leading-6 text-white ${message.role === "user" ? "self-end bg-white/15" : "self-start bg-white/10"}`}
              >
                {message.content.replaceAll("**", "")}
              </p>
            ))}
            {sending ? (
              <Text size="sm" c="gray.5">
                Thinking...
              </Text>
            ) : null}
            {error ? (
              <Text size="sm" c="red.3">
                {error}
              </Text>
            ) : null}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-white/15 p-3">
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about the map"
              className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-xl bg-white/20 px-3 text-sm text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="pointer-events-auto absolute right-4 bottom-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-black/45 shadow-2xl backdrop-blur-xl"
      >
        {open ? (
          <span className="relative block h-4 w-4">
            <span className="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rotate-45 bg-white" />
            <span className="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 -rotate-45 bg-white" />
          </span>
        ) : (
          <span className="ai-mark relative block h-7 w-7" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-7 w-7">
              <path fill="white" d="M12 1.2 13.7 8.3 20.8 10 13.7 11.7 12 18.8 10.3 11.7 3.2 10 10.3 8.3Z" />
              <path fill="white" d="M18.2 14.4 18.9 16.6 21.1 17.3 18.9 18 18.2 20.2 17.5 18 15.3 17.3 17.5 16.6Z" />
            </svg>
          </span>
        )}
      </button>
    </div>
  )
}
