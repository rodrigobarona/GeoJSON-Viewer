"use client"

import { useEffect, useRef, useState } from "react"
import {
  GeoJSONSource,
  Map,
  NavigationControl,
  type GeoJSONFeature,
  type MapLayerMouseEvent,
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
  type LngLat,
} from "@/lib/geojson"
import { isCoarsePointerDevice } from "@/lib/map-editing"
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

interface VertexFeatureProperties {
  shapeId?: string
  pointIndex?: number
  draggable?: boolean
}

interface DragState {
  shapeId: string
  pointIndex: number
}

interface MapViewProps {
  shapes: Shape[]
  activeShapeId: string | null
  fitBoundsKey: number
  onAddPoint: (point: LngLat) => void
  onMoveVertex: (shapeId: string, pointIndex: number, point: LngLat) => void
  onFinalizeVertexMove: (shapeId: string) => void
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
          ["boolean", ["get", "draggable"], false],
          10,
          5,
        ],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
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

function getVertexFromEvent(
  event: MapLayerMouseEvent,
): DragState | null {
  const feature = event.features?.[0] as
    | GeoJSONFeature<VertexFeatureProperties>
    | undefined

  if (!feature?.properties?.draggable) {
    return null
  }

  const shapeId = feature.properties.shapeId
  const pointIndex = feature.properties.pointIndex

  if (!shapeId || pointIndex === undefined) {
    return null
  }

  return {
    shapeId,
    pointIndex: Number(pointIndex),
  }
}

function hasVertexAtPoint(map: Map, event: MapMouseEvent): boolean {
  const features = map.queryRenderedFeatures(event.point, {
    layers: [LAYER_IDS.points],
  })

  return features.some((feature) => feature.properties?.draggable)
}

export function MapView({
  shapes,
  activeShapeId,
  fitBoundsKey,
  onAddPoint,
  onMoveVertex,
  onFinalizeVertexMove,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const previousShapeCountRef = useRef(0)
  const basemapInitializedRef = useRef(false)
  const onAddPointRef = useRef(onAddPoint)
  const onMoveVertexRef = useRef(onMoveVertex)
  const onFinalizeVertexMoveRef = useRef(onFinalizeVertexMove)
  const shapesRef = useRef(shapes)
  const activeShapeIdRef = useRef(activeShapeId)
  const dragStateRef = useRef<DragState | null>(null)
  const didDragRef = useRef(false)
  const isTouchDeviceRef = useRef(false)
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP_ID)
  const [mapReady, setMapReady] = useState(false)
  const [contextHint, setContextHint] = useState<string | null>(null)

  useEffect(() => {
    onAddPointRef.current = onAddPoint
    onMoveVertexRef.current = onMoveVertex
    onFinalizeVertexMoveRef.current = onFinalizeVertexMove
    shapesRef.current = shapes
    activeShapeIdRef.current = activeShapeId
  })

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    isTouchDeviceRef.current = isCoarsePointerDevice()

    const basemap = getBasemap(DEFAULT_BASEMAP_ID)
    const map = new Map({
      container: containerRef.current,
      style: basemap.style as string | StyleSpecification,
      center: [-72.28, 42.93],
      zoom: 14,
      attributionControl: {},
    })

    map.addControl(new NavigationControl(), "top-left")

    const endDrag = () => {
      const dragState = dragStateRef.current
      dragStateRef.current = null
      map.getCanvas().style.cursor = ""
      map.dragPan.enable()

      if (dragState && didDragRef.current) {
        onFinalizeVertexMoveRef.current(dragState.shapeId)
      }

      window.setTimeout(() => {
        didDragRef.current = false
      }, 0)
    }

    const handlePointerMove = (event: MapMouseEvent) => {
      const dragState = dragStateRef.current
      if (!dragState) {
        return
      }

      didDragRef.current = true
      onMoveVertexRef.current(dragState.shapeId, dragState.pointIndex, [
        event.lngLat.lng,
        event.lngLat.lat,
      ])
    }

    const startDrag = (event: MapLayerMouseEvent) => {
      const dragState = getVertexFromEvent(event)
      if (!dragState) {
        return
      }

      event.preventDefault()
      dragStateRef.current = dragState
      didDragRef.current = false
      map.getCanvas().style.cursor = "grabbing"
      map.dragPan.disable()
    }

    const handleAddPoint = (event: MapMouseEvent) => {
      if (hasVertexAtPoint(map, event)) {
        return
      }

      onAddPointRef.current([event.lngLat.lng, event.lngLat.lat])
    }

    map.on("load", () => {
      setupOverlay(map)
      setMapReady(true)
    })

    map.on("mousedown", LAYER_IDS.points, startDrag)
    map.on("mousemove", handlePointerMove)
    map.on("mouseup", endDrag)
    map.on("mouseleave", endDrag)

    map.on("touchstart", LAYER_IDS.points, (event) => {
      startDrag(event as MapLayerMouseEvent)
    })
    map.on("touchmove", handlePointerMove)
    map.on("touchend", endDrag)
    map.on("touchcancel", endDrag)

    map.on("mouseenter", LAYER_IDS.points, () => {
      if (!dragStateRef.current) {
        map.getCanvas().style.cursor = "grab"
      }
    })

    map.on("mouseleave", LAYER_IDS.points, () => {
      if (!dragStateRef.current) {
        map.getCanvas().style.cursor = ""
      }
    })

    map.on("click", (event) => {
      if (didDragRef.current || dragStateRef.current) {
        return
      }

      if (!isTouchDeviceRef.current) {
        return
      }

      handleAddPoint(event)
    })

    map.on("contextmenu", (event) => {
      event.preventDefault()

      if (isTouchDeviceRef.current) {
        return
      }

      handleAddPoint(event)
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

  const helperText = isCoarsePointerDevice()
    ? "Tap to add points. Drag vertices to move. Pinch to pan the map."
    : "Right-click to add points. Drag vertices to move them."

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute top-3 right-3 z-10">
        <LayerSwitcher value={basemapId} onChange={setBasemapId} />
      </div>
      <div className="bg-background/95 text-foreground pointer-events-none absolute bottom-4 left-1/2 z-10 max-w-md -translate-x-1/2 rounded-lg border px-3 py-2 text-center text-xs shadow-sm">
        {contextHint ?? helperText}
      </div>
    </div>
  )
}
