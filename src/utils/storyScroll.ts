import { useStoryStore } from "../store/useStoryStore.ts"

const flickMinSpeed = 0.12
const flickMaxSpeed = 1.6
const flickDecay = 0.9985
const flickSampleMs = 100

type FlickSample = {
  y: number
  time: number
}

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

function touchScroller(event: TouchEvent) {
  if (event.target instanceof Element) {
    const box = event.target.closest(".overflow-y-auto")
    if (box instanceof HTMLElement && box.scrollHeight > box.clientHeight + 2) {
      return box
    }
  }
  return chapterTextScroller()
}

function consumeScroll(delta: number, scroller: HTMLElement | null) {
  let rest = delta
  let active = scroller
  if (active) {
    const max = active.scrollHeight - active.clientHeight
    const next = Math.min(max, Math.max(0, active.scrollTop + delta))
    const used = next - active.scrollTop
    active.scrollTop = next
    rest = delta - used
    if (rest !== 0) {
      active = null
    }
  }
  if (rest !== 0) {
    window.scrollBy(0, rest)
  }
  return active
}

function flickVelocity(samples: FlickSample[]) {
  if (samples.length < 2) {
    return 0
  }
  const first = samples[0]
  const last = samples[samples.length - 1]
  const elapsed = last.time - first.time
  if (elapsed < 16) {
    return 0
  }
  return (first.y - last.y) / elapsed
}

export function bindStoryScroll() {
  let touchY = 0
  let tracking = false
  let flickScroller: HTMLElement | null = null
  let momentumFrame = 0
  let samples: FlickSample[] = []

  function stopMomentum() {
    cancelAnimationFrame(momentumFrame)
  }

  function startFlick(velocity: number, scroller: HTMLElement | null) {
    let speed = Math.max(-flickMaxSpeed, Math.min(flickMaxSpeed, velocity))
    if (Math.abs(speed) < flickMinSpeed) {
      return
    }
    let active = scroller
    let previous = performance.now()
    function step(now: number) {
      const dt = Math.min(34, now - previous)
      previous = now
      speed *= flickDecay ** dt
      if (Math.abs(speed) < 0.015) {
        return
      }
      active = consumeScroll(speed * dt, active)
      momentumFrame = requestAnimationFrame(step)
    }
    momentumFrame = requestAnimationFrame(step)
  }

  function onTouchStart(event: TouchEvent) {
    stopMomentum()
    samples = []
    tracking = event.touches.length === 1 && !eventInSidebar(event)
    if (!tracking) {
      return
    }
    touchY = event.touches[0].clientY
    flickScroller = touchScroller(event)
    samples.push({ y: touchY, time: event.timeStamp })
  }

  function onTouchMove(event: TouchEvent) {
    if (!tracking || event.touches.length !== 1) {
      tracking = false
      return
    }
    const nextY = event.touches[0].clientY
    const delta = touchY - nextY
    touchY = nextY
    samples.push({ y: nextY, time: event.timeStamp })
    const cutoff = event.timeStamp - flickSampleMs
    while (samples.length > 2 && samples[0].time < cutoff) {
      samples.shift()
    }
    if (delta !== 0) {
      flickScroller = consumeScroll(delta, flickScroller ?? touchScroller(event))
    }
    event.preventDefault()
  }

  function onTouchEnd() {
    if (!tracking) {
      return
    }
    tracking = false
    startFlick(flickVelocity(samples), flickScroller)
  }

  syncScroll()
  window.addEventListener("scroll", syncScroll, { passive: true })
  window.addEventListener("resize", syncScroll)
  window.addEventListener("wheel", onWheel, { passive: false, capture: true })
  document.addEventListener("touchstart", onTouchStart, { passive: true })
  document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true })
  document.addEventListener("touchend", onTouchEnd)
  document.addEventListener("touchcancel", onTouchEnd)

  return () => {
    stopMomentum()
    window.removeEventListener("scroll", syncScroll)
    window.removeEventListener("resize", syncScroll)
    window.removeEventListener("wheel", onWheel, { capture: true })
    document.removeEventListener("touchstart", onTouchStart)
    document.removeEventListener("touchmove", onTouchMove, { capture: true })
    document.removeEventListener("touchend", onTouchEnd)
    document.removeEventListener("touchcancel", onTouchEnd)
  }
}
