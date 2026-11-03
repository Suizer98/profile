import Basemap from "@arcgis/core/Basemap"
import Camera from "@arcgis/core/Camera"
import esriConfig from "@arcgis/core/config"
import TileLayer from "@arcgis/core/layers/TileLayer"
import EsriMap from "@arcgis/core/Map"
import SceneView from "@arcgis/core/views/SceneView"
import { Text } from "@mantine/core"
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react"

import { useGlobeStore } from "../../store/useGlobeStore.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"
import { atWorkplace, holdingAtWorkplace, orbitWorkplace, sampleCamera } from "./cameraPath.ts"
import { preloadImagery, stopPreload } from "./preloadTiles.ts"
import { createSeaMock } from "./seaMock.ts"
import { createShadowMock } from "./shadowMock.ts"
import { createTrafficMock } from "./trafficMock.ts"
import { createSatelliteMockLayer, startSatellites, syncSatelliteVisibility } from "./satelliteMock.ts"
import { nightLightsUrl, syncDaylight } from "./daylight.ts"
import { createWeatherLoop } from "./weatherLoop.ts"
import { cameraStops } from "./stops.ts"
import { satelliteMockId, seaMockId, shadowMockId, trafficMockId, useLayerStore } from "../../store/useLayerStore.ts"

const apiKey = import.meta.env.VITE_ARCGIS_API_KEY
if (apiKey) {
  esriConfig.apiKey = apiKey
}

export function Globe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const seaCanvasRef = useRef<HTMLCanvasElement>(null)
  const trafficCanvasRef = useRef<HTMLCanvasElement>(null)
  const shadowCanvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<SceneView | null>(null)
  const headingOffset = useRef(0)
  const orbitIndex = useRef(-1)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ distance: number; x: number; y: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number; heading: number; tilt: number; mode: "rotate" | "pan" | "orbit" } | null>(null)
  const ready = useStoryStore((state) => state.ready)
  const storyIndex = useStoryStore((state) => state.index)
  const globeCamera = useGlobeStore((state) => state.camera)
  const canLook = Boolean(globeCamera) || atWorkplace(storyIndex)
  const [loadError, setLoadError] = useState("")
  const [dragging, setDragging] = useState(false)

  function showCamera(view: SceneView, camera: { longitude: number; latitude: number; altitude: number; heading: number; tilt: number }) {
    view.camera = new Camera({
      position: {
        longitude: camera.longitude,
        latitude: camera.latitude,
        z: camera.altitude,
      },
      heading: camera.heading,
      tilt: camera.tilt,
    })
  }

  function pointerSpread() {
    const points = [...pointers.current.values()]
    if (points.length < 2) {
      return null
    }
    const [first, second] = points
    return {
      distance: Math.hypot(first.x - second.x, first.y - second.y),
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    }
  }

  function applyCamera(view: SceneView) {
    const camera = useGlobeStore.getState().camera
    if (camera) {
      showCamera(view, camera)
      return
    }
    const { index, blend } = useStoryStore.getState()
    if (index !== orbitIndex.current) {
      headingOffset.current = 0
      orbitIndex.current = index
    }
    const parked = holdingAtWorkplace(index, blend) || headingOffset.current !== 0
    const sampled = atWorkplace(index) && parked
      ? orbitWorkplace(index, headingOffset.current)
      : sampleCamera(index, blend)
    showCamera(view, sampled)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const camera = useGlobeStore.getState().camera
    if (camera) {
      return
    }
    const { index } = useStoryStore.getState()
    if (!atWorkplace(index) || !viewRef.current || event.button > 2) {
      return
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.preventDefault()
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      heading: headingOffset.current,
      tilt: 0,
      mode: "orbit",
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (canLook && event.button !== 0) {
      event.preventDefault()
    }
  }

  function onContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if (canLook) {
      event.preventDefault()
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (useGlobeStore.getState().camera || !pointers.current.has(event.pointerId)) {
      return
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const camera = useGlobeStore.getState().camera
    const spread = pointerSpread()
    if (camera && spread && pinch.current) {
      useGlobeStore.getState().panBy(spread.x - pinch.current.x, spread.y - pinch.current.y)
      useGlobeStore.getState().zoomBy(pinch.current.distance - spread.distance)
      pinch.current = spread
      return
    }
    const drag = dragStart.current
    if (!drag || !viewRef.current) {
      return
    }
    if (drag.mode === "rotate" && camera) {
      const tilt = Math.min(80, Math.max(0, drag.tilt + (event.clientY - drag.y) * 0.15))
      const heading = drag.heading + (event.clientX - drag.x) * 0.35
      useGlobeStore.getState().setCamera({ ...camera, heading, tilt })
      return
    }
    if (drag.mode === "pan" && camera) {
      useGlobeStore.getState().panBy(event.clientX - drag.x, event.clientY - drag.y)
      dragStart.current = { ...drag, x: event.clientX, y: event.clientY }
      return
    }
    headingOffset.current = drag.heading + (event.clientX - drag.x) * 0.35
    applyCamera(viewRef.current)
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (useGlobeStore.getState().camera) {
      return
    }
    pointers.current.delete(event.pointerId)
    pinch.current = pointerSpread()
    if (pointers.current.size > 0) {
      return
    }
    dragStart.current = null
    setDragging(false)
  }

  useEffect(() => {
    const exploring = globeCamera !== null
    document.documentElement.style.touchAction = exploring ? "none" : ""
    return () => {
      document.documentElement.style.touchAction = ""
    }
  }, [globeCamera !== null])

  useEffect(() => {
    function blocked(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest("nav, [data-chat], a, button, input, textarea"))
    }

    function spread() {
      const points = [...pointers.current.values()]
      if (points.length < 2) {
        return null
      }
      const [first, second] = points
      return {
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      }
    }

    function onPointerDown(event: PointerEvent) {
      const camera = useGlobeStore.getState().camera
      if (!camera || blocked(event.target) || event.button > 2) {
        return
      }
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      const fingers = spread()
      pinch.current = fingers
      dragStart.current = {
        x: event.clientX,
        y: event.clientY,
        heading: camera.heading,
        tilt: camera.tilt,
        mode: event.button === 2 || event.shiftKey || event.altKey ? "rotate" : "pan",
      }
      setDragging(true)
      event.preventDefault()
    }

    function onPointerMove(event: PointerEvent) {
      if (!pointers.current.has(event.pointerId)) {
        return
      }
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      const camera = useGlobeStore.getState().camera
      if (!camera) {
        return
      }
      const fingers = spread()
      if (fingers && pinch.current) {
        useGlobeStore.getState().panBy(fingers.x - pinch.current.x, fingers.y - pinch.current.y)
        useGlobeStore.getState().zoomBy((pinch.current.distance - fingers.distance) * 2)
        pinch.current = fingers
        event.preventDefault()
        return
      }
      const drag = dragStart.current
      if (!drag) {
        return
      }
      if (drag.mode === "rotate") {
        const tilt = Math.min(80, Math.max(0, drag.tilt + (event.clientY - drag.y) * 0.25))
        const heading = drag.heading - (event.clientX - drag.x) * 0.4
        useGlobeStore.getState().setCamera({ ...camera, heading, tilt })
      } else {
        useGlobeStore.getState().panBy(event.clientX - drag.x, event.clientY - drag.y)
        dragStart.current = { ...drag, x: event.clientX, y: event.clientY }
      }
      event.preventDefault()
    }

    function onPointerUp(event: PointerEvent) {
      if (!pointers.current.has(event.pointerId)) {
        return
      }
      pointers.current.delete(event.pointerId)
      pinch.current = spread()
      if (pointers.current.size > 0) {
        return
      }
      dragStart.current = null
      setDragging(false)
    }

    window.addEventListener("pointerdown", onPointerDown, { capture: true })
    window.addEventListener("pointermove", onPointerMove, { capture: true })
    window.addEventListener("pointerup", onPointerUp, { capture: true })
    window.addEventListener("pointercancel", onPointerUp, { capture: true })
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true })
      window.removeEventListener("pointermove", onPointerMove, { capture: true })
      window.removeEventListener("pointerup", onPointerUp, { capture: true })
      window.removeEventListener("pointercancel", onPointerUp, { capture: true })
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let viewReady = false
    const home = cameraStops[0]

    const satelliteLayer = createSatelliteMockLayer()
    const nightLights = new TileLayer({
      url: nightLightsUrl,
      opacity: 1,
    })
    const map = new EsriMap({
      basemap: new Basemap({
        baseLayers: [
          new TileLayer({
            url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
          }),
          nightLights,
        ],
      }),
      layers: [satelliteLayer],
    })

    const view = new SceneView({
      container,
      map,
      viewingMode: "global",
      qualityProfile: "high",
      environment: {
        atmosphereEnabled: true,
        starsEnabled: true,
        lighting: { type: "virtual" },
      },
      camera: {
        position: {
          longitude: home.longitude,
          latitude: home.latitude,
          z: home.altitude,
        },
        heading: home.heading,
        tilt: home.tilt,
      },
      ui: {
        components: [],
      },
      popupEnabled: false,
      navigation: {
        browserTouchPanEnabled: false,
        momentumEnabled: false,
        actionMap: {
          mouseWheel: "none",
          dragPrimary: "none",
          dragSecondary: "none",
        },
      },
    })
    viewRef.current = view

    const imagery = map.basemap?.baseLayers.at(0) as TileLayer | undefined
    let preloadedIndex = -1

    function preloadFrom(index: number) {
      if (!imagery?.url || index === preloadedIndex) {
        return
      }
      preloadedIndex = index
      preloadImagery(imagery, index)
    }

    const satellites = startSatellites(view, satelliteLayer)
    const seaCanvas = seaCanvasRef.current
    const sea = seaCanvas ? createSeaMock(view, seaCanvas) : null
    const trafficCanvas = trafficCanvasRef.current
    const traffic = trafficCanvas ? createTrafficMock(view, trafficCanvas) : null
    const shadowCanvas = shadowCanvasRef.current
    const shadow = shadowCanvas ? createShadowMock(view, shadowCanvas) : null
    const weather = createWeatherLoop(view)
    const unsubscribeLayers = useLayerStore.subscribe((state) => {
      const satellite = state.layers.find((item) => item.id === satelliteMockId)
      satelliteLayer.visible = satellite?.visible ?? false
      const seaLayer = state.layers.find((item) => item.id === seaMockId)
      sea?.applyVisible(seaLayer?.visible ?? false)
      const trafficLayer = state.layers.find((item) => item.id === trafficMockId)
      traffic?.applyVisible(trafficLayer?.visible ?? false)
      const shadowLayer = state.layers.find((item) => item.id === shadowMockId)
      shadow?.applyVisible(shadowLayer?.visible ?? false)
    })

    function syncScenes() {
      syncSatelliteVisibility(satelliteLayer)
      satellites.sync()
      sea?.sync()
      traffic?.sync()
      shadow?.sync()
      weather.sync()
      syncDaylight(nightLights)
    }

    function onWheel(event: WheelEvent) {
      if (!useGlobeStore.getState().camera) {
        return
      }
      if (event.target instanceof Element && event.target.closest("nav, [data-chat]")) {
        return
      }
      let delta = event.deltaY
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 16
      }
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        delta *= window.innerHeight
      }
      useGlobeStore.getState().zoomBy(delta)
    }

    const unsubscribe = useStoryStore.subscribe((state, previous) => {
      if (!viewReady) {
        return
      }
      const storyMoved = state.index !== previous.index || state.blend !== previous.blend
      if (storyMoved && !useGlobeStore.getState().camera) {
        applyCamera(view)
      }
      if (storyMoved) {
        syncScenes()
      }
      if (state.index !== previous.index) {
        preloadFrom(state.index)
      }
    })

    const unsubscribeGlobe = useGlobeStore.subscribe((state, previous) => {
      if (!viewReady || state.camera === previous.camera) {
        return
      }
      applyCamera(view)
      if (Boolean(state.camera) !== Boolean(previous.camera)) {
        syncScenes()
      }
    })

    window.addEventListener("wheel", onWheel, { passive: false })

    view
      .when(() => {
        viewReady = true
        applyCamera(view)
        syncSatelliteVisibility(satelliteLayer)
        satellites.sync()
        sea?.sync()
        traffic?.sync()
        shadow?.sync()
        weather.sync()
        syncDaylight(nightLights)
        useStoryStore.getState().setReady(true)
        preloadFrom(useStoryStore.getState().index)
      })
      .catch((error: Error) => {
        setLoadError(error.message)
      })

    return () => {
      viewReady = false
      viewRef.current = null
      stopPreload()
      satellites.remove()
      sea?.remove()
      traffic?.remove()
      shadow?.remove()
      weather.remove()
      unsubscribeLayers()
      unsubscribe()
      unsubscribeGlobe()
      window.removeEventListener("wheel", onWheel)
      view.destroy()
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0" />
      <canvas ref={seaCanvasRef} className="pointer-events-none fixed inset-0 z-[3]" />
      <canvas ref={trafficCanvasRef} data-layer="traffic" className="pointer-events-none fixed inset-0 z-[3]" />
      <canvas ref={shadowCanvasRef} data-layer="shadow" className="pointer-events-none fixed inset-0 z-[3]" />
      <div
        aria-label={canLook ? "Drag to look around" : undefined}
        className={`fixed inset-0 touch-none ${globeCamera ? "z-[24]" : "z-[8]"} ${canLook ? "" : "pointer-events-none"}`}
        style={{ cursor: canLook ? (dragging ? "grabbing" : "grab") : "auto" }}
        onPointerDown={onPointerDown}
        onMouseDown={onMouseDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={onContextMenu}
        onAuxClick={onContextMenu}
      />
      <div
        className={`fixed inset-0 z-20 grid place-items-center bg-black transition-opacity duration-700 ${
          ready && !loadError ? "pointer-events-none" : ""
        }`}
        style={{ opacity: ready && !loadError ? 0 : 1 }}
      >
        <Text size="xl" fw={500} style={{ letterSpacing: "-0.03em" }}>
          {loadError || "Bringing the Earth into view"}
        </Text>
      </div>
    </>
  )
}
