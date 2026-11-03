import { useGlobeStore } from "../store/useGlobeStore.ts"
import { useStoryStore } from "../store/useStoryStore.ts"
import { pageHeldForKeyboard, phoneLayout } from "./appViewport.ts"

const flickMinSpeed = 0.12
const flickMaxSpeed = 1.6
const flickDecay = 0.9985
const flickStopSpeed = 0.015
const flickSampleMs = 100
const phoneFlickMs = 340
const phoneFlickGapMs = 80
const phoneSettleMs = 800
const phoneSettleSlack = 110
const wheelIdleMs = 200

let wheelOnInner = false
let wheelTimer = 0

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

function chapterBox(stop: HTMLElement | null) {
  if (!stop) {
    return null
  }
  const boxes = stop.querySelectorAll<HTMLElement>("[data-chapter-scroll]")
  for (const box of boxes) {
    if (box.scrollHeight > box.clientHeight + 2) {
      return box
    }
  }
  return null
}

function chapterTextScroller() {
  return chapterBox(currentStop())
}

function chapterIsParked(stop: HTMLElement | null) {
  if (!stop) {
    return false
  }
  const viewport = window.visualViewport?.height ?? window.innerHeight
  const into = window.scrollY - stop.offsetTop
  const stuck = stop.offsetHeight - viewport
  return into <= Math.max(0, stuck) - 8
}

function scrollRoom(box: HTMLElement) {
  return box.scrollHeight - box.clientHeight
}

function canScroll(box: HTMLElement, delta: number) {
  const room = scrollRoom(box)
  if (room <= 2 || delta === 0) {
    return false
  }
  if (delta > 0) {
    return box.scrollTop < room - 2
  }
  return box.scrollTop > 2
}

function scrollInner(box: HTMLElement, delta: number) {
  const room = scrollRoom(box)
  box.scrollTop = Math.min(room, Math.max(0, box.scrollTop + delta))
}

function scrollPageOrInner(delta: number) {
  let rest = delta
  while (Math.abs(rest) > 0.5) {
    const stop = currentStop()
    const box = chapterTextScroller()
    if (box && chapterIsParked(stop) && canScroll(box, rest)) {
      scrollInner(box, rest)
      return box
    }
    const stops = [...document.querySelectorAll<HTMLElement>("[data-stop]")]
    const y = window.scrollY
    let limit = Math.abs(rest)
    if (rest > 0) {
      for (const stop of stops) {
        const gap = stop.offsetTop - y
        if (gap <= 1) {
          continue
        }
        const upcoming = chapterBox(stop)
        if (upcoming && canScroll(upcoming, rest)) {
          limit = Math.min(limit, gap)
          break
        }
      }
    } else {
      let index = 0
      for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
        if (stops[stopIndex].offsetTop <= y) {
          index = stopIndex
        }
      }
      const previous = chapterBox(stops[index - 1] ?? null)
      if (previous && canScroll(previous, rest)) {
        limit = Math.min(limit, Math.max(0, y - stops[index].offsetTop))
      }
    }
    if (limit <= 0.5) {
      if (rest >= 0) {
        break
      }
      const before = window.scrollY
      window.scrollBy(0, -1)
      if (window.scrollY === before) {
        break
      }
      rest -= window.scrollY - before
      continue
    }
    const before = window.scrollY
    window.scrollBy(0, Math.sign(rest) * limit)
    const moved = window.scrollY - before
    if (Math.abs(moved) < 0.5) {
      break
    }
    rest -= moved
  }
  return null
}

function eventInSidebar(event: Event) {
  return event.target instanceof Element && Boolean(event.target.closest("nav, [data-chat]"))
}

function exploring() {
  return useGlobeStore.getState().camera !== null
}

function onWheel(event: WheelEvent) {
  if (exploring()) {
    if (!eventInSidebar(event)) {
      event.preventDefault()
    }
    return
  }
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
  window.clearTimeout(wheelTimer)
  wheelTimer = window.setTimeout(() => {
    wheelOnInner = false
  }, wheelIdleMs)
  if (wheelOnInner) {
    const box = chapterTextScroller()
    if (box && chapterIsParked(currentStop()) && canScroll(box, delta)) {
      scrollInner(box, delta)
      event.preventDefault()
      return
    }
    wheelOnInner = false
  }
  const caught = scrollPageOrInner(delta)
  if (caught) {
    wheelOnInner = true
  }
  event.preventDefault()
}

function syncScroll() {
  if (exploring()) {
    return
  }
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

  let coasting = false
  let settledY = window.scrollY
  let settleUntil = 0

  function stopMomentum() {
    cancelAnimationFrame(momentumFrame)
    coasting = false
  }

  function finishCoast() {
    coasting = false
  }

  function startFlick(velocity: number, scroller: HTMLElement | null, lockInner: boolean) {
    let speed = Math.max(-flickMaxSpeed, Math.min(flickMaxSpeed, velocity))
    if (Math.abs(speed) < flickMinSpeed) {
      return
    }
    const started = performance.now()
    coasting = true
    let fedInner = lockInner
    function move(delta: number) {
      if (fedInner) {
        const box = scroller ?? chapterTextScroller()
        if (!box || !canScroll(box, delta)) {
          finishCoast()
          return false
        }
        scrollInner(box, delta)
        return true
      }
      if (scrollPageOrInner(delta)) {
        fedInner = true
      }
      settledY = window.scrollY
      return true
    }
    if (phoneLayout()) {
      const distance = (speed * phoneFlickMs) / 3
      let traveled = 0
      let previous = started
      function step(now: number) {
        if (now - previous > phoneFlickGapMs) {
          finishCoast()
          return
        }
        previous = now
        const amount = Math.min(1, (now - started) / phoneFlickMs)
        const eased = 1 - (1 - amount) ** 3
        const target = distance * eased
        const delta = target - traveled
        traveled = target
        if (delta !== 0 && !move(delta)) {
          return
        }
        if (amount < 1) {
          momentumFrame = requestAnimationFrame(step)
          return
        }
        finishCoast()
      }
      momentumFrame = requestAnimationFrame(step)
      return
    }
    let previous = started
    function step(now: number) {
      const dt = Math.min(34, now - previous)
      previous = now
      speed *= flickDecay ** dt
      if (Math.abs(speed) < flickStopSpeed) {
        finishCoast()
        return
      }
      if (!move(speed * dt)) {
        return
      }
      momentumFrame = requestAnimationFrame(step)
    }
    momentumFrame = requestAnimationFrame(step)
  }

  let heldScroll = window.scrollY
  let innerLock = false

  function onTouchStart(event: TouchEvent) {
    innerLock = false
    if (exploring()) {
      stopMomentum()
      tracking = false
      return
    }
    stopMomentum()
    samples = []
    tracking = event.touches.length === 1 && !eventInSidebar(event)
    if (!tracking) {
      return
    }
    touchY = event.touches[0].clientY
    flickScroller = chapterTextScroller()
    samples.push({ y: touchY, time: event.timeStamp })
  }

  function onTouchMove(event: TouchEvent) {
    if (exploring()) {
      if (!eventInSidebar(event)) {
        event.preventDefault()
      }
      if (Math.abs(window.scrollY - heldScroll) > 1) {
        window.scrollTo(0, heldScroll)
      }
      return
    }
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
      if (innerLock) {
        const stop = currentStop()
        const box = chapterTextScroller()
        if (box && chapterIsParked(stop) && canScroll(box, delta)) {
          scrollInner(box, delta)
          flickScroller = box
        } else {
          innerLock = false
          const caught = scrollPageOrInner(delta)
          if (caught) {
            innerLock = true
            flickScroller = caught
          } else {
            flickScroller = null
          }
        }
      } else {
        const caught = scrollPageOrInner(delta)
        if (caught) {
          innerLock = true
          flickScroller = caught
        } else {
          flickScroller = null
        }
      }
    }
    event.preventDefault()
  }

  function onTouchEnd() {
    if (!tracking) {
      return
    }
    tracking = false
    if (phoneLayout()) {
      settledY = window.scrollY
      settleUntil = performance.now() + phoneSettleMs
    }
    startFlick(flickVelocity(samples), flickScroller, innerLock)
  }

  function onScroll() {
    if (exploring()) {
      if (Math.abs(window.scrollY - heldScroll) > 1) {
        window.scrollTo(0, heldScroll)
      }
      return
    }
    if (phoneLayout() && !tracking && !coasting && performance.now() < settleUntil) {
      const drift = Math.abs(window.scrollY - settledY)
      if (drift > 1 && drift < phoneSettleSlack) {
        window.scrollTo(0, settledY)
        return
      }
      if (drift >= phoneSettleSlack) {
        settleUntil = 0
      }
    }
    if (tracking || coasting) {
      settledY = window.scrollY
    }
    heldScroll = window.scrollY
    syncScroll()
  }

  syncScroll()
  const unsubscribeGlobe = useGlobeStore.subscribe((state, previous) => {
    if (state.camera && !previous.camera) {
      heldScroll = window.scrollY
      stopMomentum()
    }
  })
  window.addEventListener("scroll", onScroll, { passive: true })
  function onResize() {
    if (pageHeldForKeyboard()) {
      return
    }
    syncScroll()
  }

  window.addEventListener("resize", onResize)
  window.addEventListener("wheel", onWheel, { passive: false, capture: true })
  document.addEventListener("touchstart", onTouchStart, { passive: true })
  document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true })
  document.addEventListener("touchend", onTouchEnd)
  document.addEventListener("touchcancel", onTouchEnd)

  return () => {
    stopMomentum()
    window.clearTimeout(wheelTimer)
    wheelOnInner = false
    unsubscribeGlobe()
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("resize", onResize)
    window.removeEventListener("wheel", onWheel, { capture: true })
    document.removeEventListener("touchstart", onTouchStart)
    document.removeEventListener("touchmove", onTouchMove, { capture: true })
    document.removeEventListener("touchend", onTouchEnd)
    document.removeEventListener("touchcancel", onTouchEnd)
  }
}
