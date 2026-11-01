import { Text } from "@mantine/core"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { useChatStore } from "../../store/useChatStore.ts"
import { holdPageForKeyboard } from "../../utils/appViewport.ts"

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
      holdPageForKeyboard()
      inputRef.current?.focus({ preventScroll: true })
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
        <section className="pointer-events-auto absolute right-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+3.65rem+var(--keyboard-inset,0px))] flex max-h-[min(28rem,calc(var(--app-height,100dvh)-var(--keyboard-inset,0px)-6.5rem))] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-white/20 bg-black/45 shadow-2xl backdrop-blur-xl md:right-4 md:bottom-[calc(1.5rem+4.25rem+var(--keyboard-inset,0px))] md:h-[min(36rem,calc(100dvh-8rem))] md:max-h-[min(36rem,calc(100dvh-8rem))] md:w-[28rem]">
          <Text size="xs" tt="uppercase" c="gray.4" fw={500} px="md" pt="md" style={{ letterSpacing: "0.16em" }}>
            Guide
          </Text>
          <div ref={listRef} className="flex max-h-80 min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4 md:max-h-none md:flex-1">
            {messages.length === 0 ? (
              <Text size="sm" c="gray.4" lh={1.6}>
                Ask about me, turn a layer on or off, fly the globe, or even dark secret :)
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
              onFocus={holdPageForKeyboard}
              placeholder="Ask about me or the map"
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
        className="pointer-events-auto absolute right-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+var(--keyboard-inset,0px))] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-black/25 shadow-2xl backdrop-blur-xl md:right-4 md:bottom-[calc(1.5rem+var(--keyboard-inset,0px))] md:h-14 md:w-14 md:border-white/20 md:bg-black/45"
      >
        {open ? (
          <span className="relative block h-3.5 w-3.5 md:h-4 md:w-4">
            <span className="absolute top-1/2 left-0 h-0.5 w-3.5 -translate-y-1/2 rotate-45 bg-white md:w-4" />
            <span className="absolute top-1/2 left-0 h-0.5 w-3.5 -translate-y-1/2 -rotate-45 bg-white md:w-4" />
          </span>
        ) : (
          <span className="ai-mark relative block h-6 w-6 md:h-7 md:w-7" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6 md:h-7 md:w-7">
              <path fill="white" d="M12 1.2 13.7 8.3 20.8 10 13.7 11.7 12 18.8 10.3 11.7 3.2 10 10.3 8.3Z" />
              <path fill="white" d="M18.2 14.4 18.9 16.6 21.1 17.3 18.9 18 18.2 20.2 17.5 18 15.3 17.3 17.5 16.6Z" />
            </svg>
          </span>
        )}
      </button>
    </div>
  )
}
