import { create } from "zustand"

export const satelliteMockId = "satellite-mock"
export const seaMockId = "sea-mock"
export const trafficMockId = "traffic-mock"
export const shadowMockId = "shadow-mock"

export type MapLayer = {
  id: string
  title: string
  visible: boolean
}

type LayerState = {
  layers: MapLayer[]
  setVisible: (id: string, visible: boolean) => void
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: [
    { id: satelliteMockId, title: "Satellite", visible: true },
    { id: seaMockId, title: "Sea", visible: false },
    { id: trafficMockId, title: "Traffic", visible: false },
    { id: shadowMockId, title: "Shadow", visible: false },
  ],
  setVisible: (id, visible) =>
    set((state) => ({
      layers: state.layers.map((layer) => (layer.id === id ? { ...layer, visible } : layer)),
    })),
}))
