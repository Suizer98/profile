const keyboardThreshold = 140

let fullHeight = 0
let fullWidth = 0
let heldScroll: number | null = null
let keyboardWasOpen = false
let restoreScroll: number | null = null

function viewportSize() {
  const viewport = window.visualViewport
  return {
    height: viewport?.height ?? window.innerHeight,
    width: viewport?.width ?? window.innerWidth,
    offsetTop: viewport?.offsetTop ?? 0,
  }
}

function publish(height: number, inset: number) {
  const root = document.documentElement
  root.style.setProperty("--app-height", `${Math.round(height)}px`)
  root.style.setProperty("--keyboard-inset", `${Math.round(Math.max(0, inset))}px`)
}

function pinScroll(y: number) {
  if (Math.abs(window.scrollY - y) > 1) {
    window.scrollTo(0, y)
  }
}

export function holdPageForKeyboard() {
  heldScroll = window.scrollY
}

export function pageHeldForKeyboard() {
  return heldScroll !== null || keyboardWasOpen
}

export function phoneLayout() {
  return window.matchMedia("(max-width: 767px)").matches
}

export function syncAppViewport() {
  const { height, width, offsetTop } = viewportSize()
  if (fullHeight === 0) {
    fullHeight = height
    fullWidth = width
  }

  const widthStable = Math.abs(width - fullWidth) < 80
  const dropped = fullHeight - height > keyboardThreshold
  const panned = offsetTop > 40
  const keyboard = (heldScroll !== null || keyboardWasOpen) && widthStable && (dropped || panned)

  if (keyboard) {
    keyboardWasOpen = true
    const inset = Math.max(0, window.innerHeight - height - offsetTop)
    publish(fullHeight, inset)
    if (heldScroll !== null) {
      pinScroll(heldScroll)
    }
    return
  }

  const browserChrome =
    restoreScroll === null &&
    !keyboardWasOpen &&
    phoneLayout() &&
    fullHeight > 0 &&
    widthStable &&
    Math.abs(fullHeight - height) < keyboardThreshold
  if (browserChrome) {
    return
  }

  fullHeight = height
  fullWidth = width
  keyboardWasOpen = false
  publish(height, 0)
  if (restoreScroll !== null) {
    const y = restoreScroll
    restoreScroll = null
    pinScroll(y)
  }
}

function releasePageAfterKeyboard() {
  if (keyboardWasOpen && heldScroll !== null) {
    restoreScroll = heldScroll
  }
  heldScroll = null
  const { height } = viewportSize()
  if (fullHeight - height > keyboardThreshold) {
    return
  }
  keyboardWasOpen = false
  syncAppViewport()
}

export function bindAppViewport() {
  syncAppViewport()
  let releaseTimer = 0

  function onFocusIn(event: FocusEvent) {
    const target = event.target
    if (!(target instanceof HTMLElement) || !target.closest("[data-chat] input, [data-chat] textarea")) {
      return
    }
    window.clearTimeout(releaseTimer)
    if (heldScroll === null) {
      holdPageForKeyboard()
    }
    syncAppViewport()
  }

  function onFocusOut(event: FocusEvent) {
    const target = event.target
    if (!(target instanceof HTMLElement) || !target.closest("[data-chat]")) {
      return
    }
    const next = event.relatedTarget
    if (next instanceof HTMLElement && next.closest("[data-chat]")) {
      return
    }
    window.clearTimeout(releaseTimer)
    releaseTimer = window.setTimeout(releasePageAfterKeyboard, 350)
  }

  const viewport = window.visualViewport
  viewport?.addEventListener("resize", syncAppViewport)
  viewport?.addEventListener("scroll", syncAppViewport)
  window.addEventListener("resize", syncAppViewport)
  document.addEventListener("focusin", onFocusIn)
  document.addEventListener("focusout", onFocusOut)

  return () => {
    window.clearTimeout(releaseTimer)
    viewport?.removeEventListener("resize", syncAppViewport)
    viewport?.removeEventListener("scroll", syncAppViewport)
    window.removeEventListener("resize", syncAppViewport)
    document.removeEventListener("focusin", onFocusIn)
    document.removeEventListener("focusout", onFocusOut)
  }
}
