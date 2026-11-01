import { create } from "zustand"

import { completeChat, type ChatTurn } from "../ai/complete.ts"

export type ChatMessage = ChatTurn & {
  id: string
}

type ChatState = {
  open: boolean
  messages: ChatMessage[]
  sending: boolean
  error: string
  setOpen: (open: boolean) => void
  clearMessages: () => void
  sendMessage: (content: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  messages: [],
  sending: false,
  error: "",
  setOpen: (open) => set({ open }),
  clearMessages: () => set({ messages: [], error: "" }),
  sendMessage: async (content) => {
    const text = content.trim()
    if (!text || get().sending) {
      return
    }
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    }
    const turns = [...get().messages, userMessage]
    set({ messages: turns, sending: true, error: "", open: true })
    try {
      const reply = await completeChat(turns)
      set({
        sending: false,
        messages: [
          ...get().messages,
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ],
      })
    } catch (error) {
      set({
        sending: false,
        error: error instanceof Error ? error.message : "Request failed",
      })
    }
  },
}))
