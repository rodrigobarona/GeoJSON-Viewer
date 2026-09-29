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
  buildOpenLineGeoJson,
  buildPointsFeatureCollection,
  buildPolygonOutput,
  getBounds,
  type LngLat,
} from "@/lib/geojson"

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
  points: LngLat[]
  isClosed: boolean
  onAddPoint: (point: LngLat) => void
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
        "fill-color": "#41d8f0",
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
        "line-color": "#41d8f0",
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
        "line-color": "#41d8f0",
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
        "circle-color": "#41d8f0",
        "circle-radius": 5,
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

function updateOverlayData(map: Map, points: LngLat[], isClosed: boolean) {
  const lineSource = map.getSource(SOURCE_IDS.line) as GeoJSONSource
  const polygonSource = map.getSource(SOURCE_IDS.polygon) as GeoJSONSource
  const pointsSource = map.getSource(SOURCE_IDS.points) as GeoJSONSource

  if (!lineSource || !polygonSource || !pointsSource) {
    return
  }

  if (isClosed && points.length >= 3) {
    const polygon = buildPolygonOutput(points)
    polygonSource.setData({
      type: "Feature",
      properties: {},
      geometry: polygon.geojson,
    })
    lineSource.setData(EMPTY_FEATURE_COLLECTION)
  } else if (points.length >= 2) {
    lineSource.setData(buildOpenLineGeoJson(points))
    polygonSource.setData(EMPTY_FEATURE_COLLECTION)
  } else {
    lineSource.setData(EMPTY_FEATURE_COLLECTION)
    polygonSource.setData(EMPTY_FEATURE_COLLECTION)
  }

  pointsSource.setData(buildPointsFeatureCollection(points))

  const setVisibility = (layerId: string, visible: boolean) => {
    if (!map.getLayer(layerId)) {
      return
    }

    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none")
  }

  setVisibility(LAYER_IDS.line, !isClosed && points.length >= 2)
  setVisibility(LAYER_IDS.polygonFill, isClosed && points.length >= 3)
  setVisibility(LAYER_IDS.polygonOutline, isClosed && points.length >= 3)
  setVisibility(LAYER_IDS.points, points.length > 0)
}

function fitMapToPoints(map: Map, points: LngLat[]) {
  const bounds = getBounds(points)
  if (!bounds) {
    return
  }

  map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 16,
    duration: 600,
  })
}

export function MapView({ points, isClosed, onAddPoint }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const previousPointCountRef = useRef(0)
  const basemapInitializedRef = useRef(false)
  const onAddPointRef = useRef(onAddPoint)
  const pointsRef = useRef(points)
  const isClosedRef = useRef(isClosed)
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP_ID)
  const [mapReady, setMapReady] = useState(false)
  const [contextHint, setContextHint] = useState<string | null>(null)

  useEffect(() => {
    onAddPointRef.current = onAddPoint
    pointsRef.current = points
    isClosedRef.current = isClosed
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
    updateOverlayData(map, points, isClosed)

    const previousCount = previousPointCountRef.current
    if (
      points.length > 0 &&
      (previousCount === 0 || points.length - previousCount > 1)
    ) {
      fitMapToPoints(map, points)
    }
    previousPointCountRef.current = points.length
  }, [isClosed, mapReady, points])

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
      updateOverlayData(map, pointsRef.current, isClosedRef.current)
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
