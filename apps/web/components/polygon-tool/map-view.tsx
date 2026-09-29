"use client"

import { useEffect, useRef, useState } from "react"
import {
  GeoJSONSource,
  Map,
  NavigationControl,
  type MapMouseEvent,
  type StyleSpecification,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import { LayerSwitcher } from "@/components/polygon-tool/layer-switcher"
import { configureMapLibreWorker } from "@/lib/maplibre-setup"
import {
  DEFAULT_BASEMAP_ID,
  getBasemap,
  type BasemapId,
} from "@/lib/basemaps"
import {
  buildShapesOverlayData,
  getBoundsForShapes,
} from "@/lib/geojson"
import type { Shape } from "@/lib/shapes"

configureMapLibreWorker()

const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
}

const SOURCE_IDS = {
  line: "polygon-tool-line",
  polygon: "polygon-tool-polygon",
  points: "polygon-tool-points",
} as const

const LAYER_IDS = {
  polygonFill: "polygon-tool-polygon-fill",
  polygonOutline: "polygon-tool-polygon-outline",
  line: "polygon-tool-line",
  points: "polygon-tool-points",
} as const

interface MapViewProps {
  shapes: Shape[]
  activeShapeId: string | null
  fitBoundsKey: number
  onAddPoint: (point: [number, number]) => void
}

function addOverlaySources(map: Map) {
  if (!map.getSource(SOURCE_IDS.line)) {
    map.addSource(SOURCE_IDS.line, {
      type: "geojson",
      data: EMPTY_FEATURE_COLLECTION,
    })
  }

  if (!map.getSource(SOURCE_IDS.polygon)) {
    map.addSource(SOURCE_IDS.polygon, {
      type: "geojson",
      data: EMPTY_FEATURE_COLLECTION,
    })
  }

  if (!map.getSource(SOURCE_IDS.points)) {
    map.addSource(SOURCE_IDS.points, {
      type: "geojson",
      data: EMPTY_FEATURE_COLLECTION,
    })
  }
}

function addOverlayLayers(map: Map) {
  if (!map.getLayer(LAYER_IDS.polygonFill)) {
    map.addLayer({
      id: LAYER_IDS.polygonFill,
      type: "fill",
      source: SOURCE_IDS.polygon,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.25,
      },
    })
  }

  if (!map.getLayer(LAYER_IDS.polygonOutline)) {
    map.addLayer({
      id: LAYER_IDS.polygonOutline,
      type: "line",
      source: SOURCE_IDS.polygon,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
      },
    })
  }

  if (!map.getLayer(LAYER_IDS.line)) {
    map.addLayer({
      id: LAYER_IDS.line,
      type: "line",
      source: SOURCE_IDS.line,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
      },
    })
  }

  if (!map.getLayer(LAYER_IDS.points)) {
    map.addLayer({
      id: LAYER_IDS.points,
      type: "circle",
      source: SOURCE_IDS.points,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": [
          "case",
          ["boolean", ["get", "isActive"], false],
          6,
          5,
        ],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    })
  }
}

function setupOverlay(map: Map) {
  addOverlaySources(map)
  addOverlayLayers(map)
}

function updateOverlayData(
  map: Map,
  shapes: Shape[],
  activeShapeId: string | null,
) {
  const lineSource = map.getSource(SOURCE_IDS.line) as GeoJSONSource
  const polygonSource = map.getSource(SOURCE_IDS.polygon) as GeoJSONSource
  const pointsSource = map.getSource(SOURCE_IDS.points) as GeoJSONSource

  if (!lineSource || !polygonSource || !pointsSource) {
    return
  }

  const overlay = buildShapesOverlayData(shapes, activeShapeId)
  lineSource.setData(overlay.lines)
  polygonSource.setData(overlay.polygons)
  pointsSource.setData(overlay.points)

  const setVisibility = (layerId: string, visible: boolean) => {
    if (!map.getLayer(layerId)) {
      return
    }

    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none")
  }

  setVisibility(LAYER_IDS.line, overlay.lines.features.length > 0)
  setVisibility(LAYER_IDS.polygonFill, overlay.polygons.features.length > 0)
  setVisibility(LAYER_IDS.polygonOutline, overlay.polygons.features.length > 0)
  setVisibility(LAYER_IDS.points, overlay.points.features.length > 0)
}

function fitMapToShapes(map: Map, shapes: Shape[]) {
  const bounds = getBoundsForShapes(shapes)
  if (!bounds) {
    return
  }

  map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 16,
    duration: 600,
  })
}

export function MapView({
  shapes,
  activeShapeId,
  fitBoundsKey,
  onAddPoint,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const previousShapeCountRef = useRef(0)
  const basemapInitializedRef = useRef(false)
  const onAddPointRef = useRef(onAddPoint)
  const shapesRef = useRef(shapes)
  const activeShapeIdRef = useRef(activeShapeId)
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP_ID)
  const [mapReady, setMapReady] = useState(false)
  const [contextHint, setContextHint] = useState<string | null>(null)

  useEffect(() => {
    onAddPointRef.current = onAddPoint
    shapesRef.current = shapes
    activeShapeIdRef.current = activeShapeId
  })

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const basemap = getBasemap(DEFAULT_BASEMAP_ID)
    const map = new Map({
      container: containerRef.current,
      style: basemap.style as string | StyleSpecification,
      center: [-72.28, 42.93],
      zoom: 14,
      attributionControl: {},
    })

    map.addControl(new NavigationControl(), "top-left")

    map.on("load", () => {
      setupOverlay(map)
      setMapReady(true)
    })

    map.on("click", (event: MapMouseEvent) => {
      onAddPointRef.current([event.lngLat.lng, event.lngLat.lat])
    })

    map.on("contextmenu", (event: MapMouseEvent) => {
      event.preventDefault()
      setContextHint("Use left-click to add points.")
      window.setTimeout(() => setContextHint(null), 2500)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) {
      return
    }

    setupOverlay(map)
    updateOverlayData(map, shapes, activeShapeId)

    const previousCount = previousShapeCountRef.current
    if (shapes.length > 0 && (previousCount === 0 || shapes.length > previousCount)) {
      fitMapToShapes(map, shapes)
    }
    previousShapeCountRef.current = shapes.length
  }, [activeShapeId, mapReady, shapes])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || fitBoundsKey === 0 || shapes.length === 0) {
      return
    }

    fitMapToShapes(map, shapes)
  }, [fitBoundsKey, mapReady, shapes])

  useEffect(() => {
    if (!basemapInitializedRef.current) {
      basemapInitializedRef.current = true
      return
    }

    const map = mapRef.current
    if (!map) {
      return
    }

    const basemap = getBasemap(basemapId)

    const restoreOverlay = () => {
      setupOverlay(map)
      updateOverlayData(
        map,
        shapesRef.current,
        activeShapeIdRef.current,
      )
    }

    map.setStyle(basemap.style as string | StyleSpecification)
    map.once("style.load", restoreOverlay)
  }, [basemapId])

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute top-3 right-3 z-10">
        <LayerSwitcher value={basemapId} onChange={setBasemapId} />
      </div>
      {contextHint ? (
        <div className="bg-background/95 text-foreground pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg border px-3 py-2 text-sm shadow-sm">
          {contextHint}
        </div>
      ) : null}
    </div>
  )
}
