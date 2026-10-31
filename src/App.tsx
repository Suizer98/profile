import { useEffect } from "react"

import { About } from "./components/about/About.tsx"
import { Experiences } from "./components/about/Experiences.tsx"
import { Certs } from "./components/certs/Certs.tsx"
import { Contact } from "./components/contact/Contact.tsx"
import { Globe } from "./components/globe/Globe.tsx"
import { Home } from "./components/home/Home.tsx"
import { Projects } from "./components/projects/Projects.tsx"
import { Sidebar } from "./components/sidebar/Sidebar.tsx"
import { useStoryStore } from "./store/useStoryStore.ts"

function currentStop() {
  const stops = document.querySelectorAll<HTMLElement>("[data-stop]")
  let current: HTMLElement | null = null
  for (const stop of stops) {
    if (window.scrollY >= stop.offsetTop) {
      current = stop
    }
  }
  return current
}

function chapterTextScroller() {
  const stop = currentStop()
  if (!stop) {
    return null
  }
  const boxes = stop.querySelectorAll<HTMLElement>(".overflow-y-auto")
  for (const box of boxes) {
    if (box.scrollHeight > box.clientHeight + 2) {
      return box
    }
  }
  return null
}

function scrollChapterText(delta: number) {
  if (delta === 0) {
    return false
  }
  const scroller = chapterTextScroller()
  if (!scroller) {
    return false
  }
  const max = scroller.scrollHeight - scroller.clientHeight
  const next = Math.min(max, Math.max(0, scroller.scrollTop + delta))
  if (next === scroller.scrollTop) {
    return false
  }
  scroller.scrollTop = next
  return true
}

function eventInSidebar(event: Event) {
  return event.target instanceof Element && Boolean(event.target.closest("nav"))
}

function onWheel(event: WheelEvent) {
  if (event.ctrlKey || eventInSidebar(event) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    return
  }
  let delta = event.deltaY
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta *= 16
  }
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    delta *= window.innerHeight
  }
  if (scrollChapterText(delta)) {
    event.preventDefault()
  }
}

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
    let touchY = 0

    function onBoxTouchStart(event: TouchEvent) {
      if (event.touches.length === 1) {
        touchY = event.touches[0].clientY
      }
    }

    function onBoxTouchMove(event: TouchEvent) {
      if (event.touches.length !== 1 || eventInSidebar(event)) {
        return
      }
      const scroller = event.currentTarget
      if (!(scroller instanceof HTMLElement)) {
        return
      }
      const nextY = event.touches[0].clientY
      const delta = touchY - nextY
      touchY = nextY
      if (delta === 0) {
        return
      }
      const max = scroller.scrollHeight - scroller.clientHeight
      const next = Math.min(max, Math.max(0, scroller.scrollTop + delta))
      const used = next - scroller.scrollTop
      scroller.scrollTop = next
      const rest = delta - used
      if (rest !== 0) {
        window.scrollBy(0, rest)
      }
      event.preventDefault()
    }

    const boxes = document.querySelectorAll<HTMLElement>(".overflow-y-auto")
    for (const box of boxes) {
      box.addEventListener("touchstart", onBoxTouchStart, { passive: true })
      box.addEventListener("touchmove", onBoxTouchMove, { passive: false })
    }

    syncScroll()
    window.addEventListener("scroll", syncScroll, { passive: true })
    window.addEventListener("resize", syncScroll)
    window.addEventListener("wheel", onWheel, { passive: false, capture: true })
    return () => {
      for (const box of boxes) {
        box.removeEventListener("touchstart", onBoxTouchStart)
        box.removeEventListener("touchmove", onBoxTouchMove)
      }
      window.removeEventListener("scroll", syncScroll)
      window.removeEventListener("resize", syncScroll)
      window.removeEventListener("wheel", onWheel, { capture: true })
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
        <Experiences />
        <Projects />
        <Certs />
        <Contact />
      </main>
      <Sidebar />
    </>
  )
}

export default App
