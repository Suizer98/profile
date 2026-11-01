import { create } from "zustand"

export type FreeCamera = {
  longitude: number
  latitude: number
  altitude: number
  tilt: number
  heading: number
}

type StoryState = {
  index: number
  blend: number
  ready: boolean
  freeCamera: FreeCamera | null
  setScroll: (index: number, blend: number) => void
  setReady: (ready: boolean) => void
  setFreeCamera: (camera: FreeCamera | null) => void
}

export const useStoryStore = create<StoryState>((set) => ({
  index: 0,
  blend: 0,
  ready: false,
  freeCamera: null,
  setScroll: (index, blend) =>
    set((state) => {
      if (state.index === index && state.blend === blend) {
        return state
      }
      return { index, blend, freeCamera: null }
    }),
  setReady: (ready) => set({ ready }),
  setFreeCamera: (freeCamera) => set({ freeCamera }),
}))
