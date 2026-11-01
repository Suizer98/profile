import { useEffect } from "react"

import { Chat } from "./components/chat/Chat.tsx"
import { AiVisit } from "./components/globe/AiVisit.tsx"
import { Globe } from "./components/globe/Globe.tsx"
import { Sidebar } from "./components/sidebar/Sidebar.tsx"
import { Story } from "./components/story/Story.tsx"
import { useGlobeStore } from "./store/useGlobeStore.ts"
import { bindAppViewport } from "./utils/appViewport.ts"
import { bindStoryScroll } from "./utils/storyScroll.ts"

function App() {
  const visiting = useGlobeStore((state) => state.visit !== null)
  useEffect(() => bindAppViewport(), [])
  useEffect(() => bindStoryScroll(), [])

  return (
    <>
      <Globe />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] h-[calc(var(--app-height,100dvh)*0.48)] md:h-[72vh]"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.18) 72%, transparent 100%)",
        }}
      />
      <main className={`pointer-events-none relative z-10 ${visiting ? "invisible" : ""}`}>
        <Story />
      </main>
      <AiVisit />
      <Sidebar />
      <Chat />
    </>
  )
}

export default App
