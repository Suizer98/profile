import { create } from "zustand"

type StoryState = {
  index: number
  blend: number
  ready: boolean
  setScroll: (index: number, blend: number) => void
  setReady: (ready: boolean) => void
}

export const useStoryStore = create<StoryState>((set) => ({
  index: 0,
  blend: 0,
  ready: false,
  setScroll: (index, blend) => set({ index, blend }),
  setReady: (ready) => set({ ready }),
}))
