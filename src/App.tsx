import { useEffect } from "react"

import { About } from "./components/about/About.tsx"
import { Certs } from "./components/certs/Certs.tsx"
import { Contact } from "./components/contact/Contact.tsx"
import { Globe } from "./components/globe/Globe.tsx"
import { Home } from "./components/home/Home.tsx"
import { Projects } from "./components/projects/Projects.tsx"
import { Sidebar } from "./components/sidebar/Sidebar.tsx"
import { useStoryStore } from "./store/useStoryStore.ts"

function syncScroll() {
  const stops = document.querySelectorAll<HTMLElement>("[data-stop]")
  if (stops.length < 2) {
    return
  }

  const scrollY = window.scrollY
  let index = 0
  for (let stopIndex = 0; stopIndex < stops.length - 1; stopIndex += 1) {
    const nextStop = stops[stopIndex + 1]
    if (scrollY >= nextStop.offsetTop) {
      index = stopIndex + 1
      continue
    }
    index = stopIndex
    break
  }

  const lastSegment = stops.length - 2
  if (index >= stops.length - 1) {
    useStoryStore.getState().setScroll(lastSegment, 1)
    return
  }

  const start = stops[index].offsetTop
  const end = stops[index + 1].offsetTop
  const blend = end === start ? 0 : (scrollY - start) / (end - start)
  useStoryStore.getState().setScroll(index, blend)
}

function App() {
  useEffect(() => {
    syncScroll()
    window.addEventListener("scroll", syncScroll, { passive: true })
    window.addEventListener("resize", syncScroll)
    return () => {
      window.removeEventListener("scroll", syncScroll)
      window.removeEventListener("resize", syncScroll)
    }
  }, [])

  return (
    <>
      <Globe />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] h-[48vh] md:h-[72vh]"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.18) 72%, transparent 100%)",
        }}
      />
      <main className="relative z-10">
        <Home />
        <About />
        <Projects />
        <Certs />
        <Contact />
      </main>
      <Sidebar />
    </>
  )
}

export default App
