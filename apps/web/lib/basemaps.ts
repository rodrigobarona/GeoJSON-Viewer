import type { StyleSpecification } from "maplibre-gl"

export type BasemapId = "bright" | "liberty" | "dark" | "satellite"

export interface BasemapConfig {
  id: BasemapId
  label: string
  style: string | StyleSpecification
  attribution?: string
}

const satelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg",
      ],
      tileSize: 256,
      attribution:
        "Imagery © EOX IT Services GmbH (CC BY-NC-SA 4.0) | Contains modified Copernicus Sentinel data 2025",
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
    },
  ],
}

export const BASEMAPS: BasemapConfig[] = [
  {
    id: "bright",
    label: "Bright",
    style: "https://tiles.openfreemap.org/styles/bright",
    attribution: "© OpenFreeMap | © OpenStreetMap",
  },
  {
    id: "liberty",
    label: "Liberty",
    style: "https://tiles.openfreemap.org/styles/liberty",
    attribution: "© OpenFreeMap | © OpenStreetMap",
  },
  {
    id: "dark",
    label: "Dark",
    style: "https://tiles.openfreemap.org/styles/dark",
    attribution: "© OpenFreeMap | © OpenStreetMap",
  },
  {
    id: "satellite",
    label: "Satellite",
    style: satelliteStyle,
    attribution:
      "Imagery © EOX IT Services GmbH (CC BY-NC-SA 4.0) | Contains modified Copernicus Sentinel data 2025",
  },
]

export const DEFAULT_BASEMAP_ID: BasemapId = "bright"

export function getBasemap(id: BasemapId): BasemapConfig {
  const basemap = BASEMAPS.find((entry) => entry.id === id)
  if (!basemap) {
    return BASEMAPS[0]!
  }
  return basemap
}
