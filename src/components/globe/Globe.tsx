import Basemap from "@arcgis/core/Basemap"
import Camera from "@arcgis/core/Camera"
import esriConfig from "@arcgis/core/config"
import TileLayer from "@arcgis/core/layers/TileLayer"
import Map from "@arcgis/core/Map"
import SceneView from "@arcgis/core/views/SceneView"
import { Text } from "@mantine/core"
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react"

import { useStoryStore } from "../../store/useStoryStore.ts"
import { atWorkplace, holdingAtWorkplace, orbitWorkplace, sampleCamera } from "./cameraPath.ts"
import { preloadImagery, stopPreload } from "./preloadTiles.ts"
import { createSeaMock } from "./seaMock.ts"
import { createShadowMock } from "./shadowMock.ts"
import { createTrafficMock } from "./trafficMock.ts"
import { createSatelliteMockLayer, startSatellites, syncSatelliteVisibility } from "./satelliteMock.ts"
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
  const dragStart = useRef<{ x: number; heading: number } | null>(null)
  const ready = useStoryStore((state) => state.ready)
  const canLook = useStoryStore((state) => atWorkplace(state.index))
  const [loadError, setLoadError] = useState("")
  const [dragging, setDragging] = useState(false)

  function applyCamera(view: SceneView) {
    const { index, blend } = useStoryStore.getState()
    if (index !== orbitIndex.current) {
      headingOffset.current = 0
      orbitIndex.current = index
    }
    const parked = holdingAtWorkplace(index, blend) || headingOffset.current !== 0
    const sampled = atWorkplace(index) && parked
      ? orbitWorkplace(index, headingOffset.current)
      : sampleCamera(index, blend)
    view.camera = new Camera({
      position: {
        longitude: sampled.longitude,
        latitude: sampled.latitude,
        z: sampled.altitude,
      },
      heading: sampled.heading,
      tilt: sampled.tilt,
    })
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canLook || !viewRef.current || event.button > 2) {
      return
    }
    event.preventDefault()
    dragStart.current = { x: event.clientX, heading: headingOffset.current }
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
    if (!dragStart.current || !viewRef.current) {
      return
    }
    headingOffset.current = dragStart.current.heading + (event.clientX - dragStart.current.x) * 0.35
    applyCamera(viewRef.current)
  }

  function onPointerUp() {
    dragStart.current = null
    setDragging(false)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let viewReady = false
    const home = cameraStops[0]

    const satelliteLayer = createSatelliteMockLayer()
    const map = new Map({
      basemap: new Basemap({
        baseLayers: [
          new TileLayer({
            url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
          }),
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

    const unsubscribe = useStoryStore.subscribe((state, previous) => {
      if (!viewReady) {
        return
      }
      if (state.index !== previous.index || state.blend !== previous.blend) {
        applyCamera(view)
        syncSatelliteVisibility(satelliteLayer)
        satellites.sync()
        sea?.sync()
        traffic?.sync()
        shadow?.sync()
        weather.sync()
      }
      if (state.index !== previous.index) {
        preloadFrom(state.index)
      }
    })

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
        className={`fixed inset-0 z-[8] ${canLook ? "" : "pointer-events-none"}`}
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
