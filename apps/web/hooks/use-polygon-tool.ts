"use client"

import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { parseBasemapId, type BasemapId } from "@/lib/basemaps"
import {
  CoordinateParseError,
  formatCoordinatesLineByLine,
  parseMultipleCoordinatesFromText,
  parseShapesFromUrl,
  serializeShapesToUrl,
} from "@/lib/coordinates"
import {
  buildOpenLineGeoJson,
  buildPolygonOutput,
  buildShapesGeoJsonCollection,
  type LngLat,
} from "@/lib/geojson"
import {
  findEdgeInsertionIndex,
  insertPointAtIndex,
  updatePointAtIndex,
} from "@/lib/map-editing"
import {
  closeShapeRecord,
  createShape,
  getShapeOrNull,
  type Shape,
} from "@/lib/shapes"

export interface PolygonToolState {
  shapes: Shape[]
  activeShapeId: string | null
  basemapId: BasemapId
  importText: string
  showImportPanel: boolean
  fitBoundsKey: number
  lineListText: string
  geojsonText: string
  compactJsonText: string
  canUndo: boolean
  canClose: boolean
  isEmpty: boolean
  shapeCount: number
}

export interface PolygonToolActions {
  addPoint: (point: LngLat) => void
  moveVertex: (shapeId: string, pointIndex: number, point: LngLat) => void
  finalizeVertexMove: (shapeId: string) => void
  undo: () => void
  reset: () => void
  closeShape: () => void
  newPolygon: () => void
  selectShape: (shapeId: string) => void
  deleteActiveShape: () => void
  setBasemapId: (value: BasemapId) => void
  setImportText: (value: string) => void
  openImportPanel: () => void
  cancelImport: () => void
  importFromText: () => void
  shareLink: () => Promise<void>
}

function shapesFromUrl(searchParams: URLSearchParams): Shape[] {
  const parsedShapes = parseShapesFromUrl(searchParams.get("coords"))
  return parsedShapes.map((points) => {
    const isClosed = points.length >= 3
    const shape = createShape(points, isClosed)
    return isClosed ? closeShapeRecord(shape) : shape
  })
}

function getInitialStateFromUrl(searchParams: URLSearchParams) {
  const shapes = shapesFromUrl(searchParams)
  const activeShape =
    shapes.find((shape) => !shape.isClosed) ?? shapes[shapes.length - 1] ?? null

  return {
    shapes,
    activeShapeId: activeShape?.id ?? null,
    basemapId: parseBasemapId(searchParams.get("basemap")),
    importText: activeShape
      ? formatCoordinatesLineByLine(activeShape.points)
      : "",
  }
}

function updateShapeInList(shapes: Shape[], nextShape: Shape): Shape[] {
  return shapes.map((shape) => (shape.id === nextShape.id ? nextShape : shape))
}

export function usePolygonTool(): PolygonToolState & PolygonToolActions {
  const searchParams = useSearchParams()
  const [initialState] = useState(() => getInitialStateFromUrl(searchParams))
  const [shapes, setShapes] = useState<Shape[]>(initialState.shapes)
  const [activeShapeId, setActiveShapeId] = useState<string | null>(
    initialState.activeShapeId,
  )
  const [basemapId, setBasemapId] = useState<BasemapId>(initialState.basemapId)
  const [importText, setImportText] = useState(initialState.importText)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [fitBoundsKey, setFitBoundsKey] = useState(
    initialState.shapes.length > 0 ? 1 : 0,
  )

  const activeShape = useMemo(
    () => getShapeOrNull(shapes, activeShapeId),
    [activeShapeId, shapes],
  )

  const lineListText = useMemo(
    () =>
      activeShape ? formatCoordinatesLineByLine(activeShape.points) : "",
    [activeShape],
  )

  const { geojsonText, compactJsonText } = useMemo(() => {
    if (shapes.length === 0) {
      return { geojsonText: "", compactJsonText: "" }
    }

    if (shapes.length > 1) {
      const collection = buildShapesGeoJsonCollection(shapes)
      return {
        geojsonText: JSON.stringify(collection, null, 2),
        compactJsonText: JSON.stringify(collection, null, 2),
      }
    }

    const shape = shapes[0]
    if (!shape || shape.points.length === 0) {
      return { geojsonText: "", compactJsonText: "" }
    }

    if (shape.isClosed && shape.points.length >= 3) {
      const output = buildPolygonOutput(shape.points)
      return {
        geojsonText: JSON.stringify(output.geojson, null, 2),
        compactJsonText: JSON.stringify(output.compact, null, 2),
      }
    }

    const line = buildOpenLineGeoJson(shape.points)
    return {
      geojsonText: JSON.stringify(line.geometry, null, 2),
      compactJsonText: JSON.stringify(
        { coordinates: line.geometry.coordinates },
        null,
        2,
      ),
    }
  }, [shapes])

  const startDraftShape = useCallback((point?: LngLat) => {
    const nextShape = createShape(point ? [point] : [])
    setShapes((current) => [...current, nextShape])
    setActiveShapeId(nextShape.id)
    return nextShape.id
  }, [])

  const applyShapePoints = useCallback(
    (shape: Shape, points: LngLat[], keepClosed: boolean) => {
      if (keepClosed && points.length >= 3) {
        return closeShapeRecord({
          ...shape,
          points,
        })
      }

      return {
        ...shape,
        points,
        isClosed: false,
        ringWasReversed: false,
      }
    },
    [],
  )

  const addPoint = useCallback(
    (point: LngLat) => {
      if (!activeShape) {
        startDraftShape(point)
        return
      }

      if (!activeShape.isClosed) {
        setShapes((current) =>
          updateShapeInList(
            current,
            applyShapePoints(activeShape, [...activeShape.points, point], false),
          ),
        )
        return
      }

      const insertIndex = findEdgeInsertionIndex(
        activeShape.points,
        point,
        true,
      )
      const nextPoints = insertPointAtIndex(
        activeShape.points,
        insertIndex,
        point,
      )

      setShapes((current) =>
        updateShapeInList(
          current,
          applyShapePoints(activeShape, nextPoints, true),
        ),
      )
    },
    [activeShape, applyShapePoints, startDraftShape],
  )

  const moveVertex = useCallback(
    (shapeId: string, pointIndex: number, point: LngLat) => {
      setShapes((current) =>
        current.map((shape) => {
          if (shape.id !== shapeId) {
            return shape
          }

          const nextPoints = updatePointAtIndex(shape.points, pointIndex, point)
          if (shape.isClosed) {
            return {
              ...shape,
              points: nextPoints,
            }
          }

          return {
            ...shape,
            points: nextPoints,
            ringWasReversed: false,
          }
        }),
      )
    },
    [],
  )

  const finalizeVertexMove = useCallback((shapeId: string) => {
    setShapes((current) =>
      current.map((shape) => {
        if (shape.id !== shapeId || !shape.isClosed || shape.points.length < 3) {
          return shape
        }

        return closeShapeRecord(shape)
      }),
    )
  }, [])

  const undo = useCallback(() => {
    if (!activeShape || activeShape.isClosed || activeShape.points.length === 0) {
      return
    }

    const nextPoints = activeShape.points.slice(0, -1)
    if (nextPoints.length === 0) {
      setShapes((current) => {
        const remaining = current.filter((shape) => shape.id !== activeShape.id)
        setActiveShapeId(remaining[remaining.length - 1]?.id ?? null)
        return remaining
      })
      return
    }

    setShapes((current) =>
      updateShapeInList(current, {
        ...activeShape,
        points: nextPoints,
        isClosed: false,
        ringWasReversed: false,
      }),
    )
  }, [activeShape])

  const reset = useCallback(() => {
    setShapes([])
    setActiveShapeId(null)
    setImportText("")
    setShowImportPanel(false)
  }, [])

  const closeShape = useCallback(() => {
    if (!activeShape || activeShape.isClosed || activeShape.points.length < 3) {
      return
    }

    setShapes((current) =>
      updateShapeInList(current, closeShapeRecord(activeShape)),
    )
  }, [activeShape])

  const newPolygon = useCallback(() => {
    if (activeShape && !activeShape.isClosed && activeShape.points.length === 0) {
      return
    }

    startDraftShape()
    setImportText("")
    toast.message("Started a new polygon. Right-click the map to add points.")
  }, [activeShape, startDraftShape])

  const selectShape = useCallback(
    (shapeId: string) => {
      const shape = shapes.find((entry) => entry.id === shapeId)
      if (!shape) {
        return
      }

      setActiveShapeId(shapeId)
      setImportText(formatCoordinatesLineByLine(shape.points))
    },
    [shapes],
  )

  const deleteActiveShape = useCallback(() => {
    if (!activeShape) {
      return
    }

    const remaining = shapes.filter((shape) => shape.id !== activeShape.id)
    setShapes(remaining)
    setActiveShapeId(remaining[remaining.length - 1]?.id ?? null)
    setImportText(
      remaining.length > 0
        ? formatCoordinatesLineByLine(remaining[remaining.length - 1]!.points)
        : "",
    )
  }, [activeShape, shapes])

  const openImportPanel = useCallback(() => {
    setImportText((current) =>
      current.trim()
        ? current
        : activeShape
          ? formatCoordinatesLineByLine(activeShape.points)
          : "",
    )
    setShowImportPanel(true)
  }, [activeShape])

  const cancelImport = useCallback(() => {
    setShowImportPanel(false)
    setImportText(
      activeShape ? formatCoordinatesLineByLine(activeShape.points) : "",
    )
  }, [activeShape])

  const importFromText = useCallback(() => {
    try {
      const parsedShapes = parseMultipleCoordinatesFromText(importText).map(
        (entry) => {
          const shouldClose = entry.isClosed || entry.points.length >= 3
          const shape = createShape(entry.points, shouldClose)
          return shouldClose ? closeShapeRecord(shape) : shape
        },
      )

      if (parsedShapes.length === 0) {
        throw new CoordinateParseError("No coordinates found to import.")
      }

      setShapes((current) => [...current, ...parsedShapes])
      const lastImported = parsedShapes[parsedShapes.length - 1]!
      setActiveShapeId(lastImported.id)
      setImportText(formatCoordinatesLineByLine(lastImported.points))
      setShowImportPanel(false)
      setFitBoundsKey((current) => current + 1)

      toast.success(
        `Imported ${parsedShapes.length} polygon${parsedShapes.length === 1 ? "" : "s"}.`,
      )
    } catch (error) {
      const message =
        error instanceof CoordinateParseError
          ? error.message
          : "Could not import coordinates."
      toast.error(message)
    }
  }, [importText])

  const shareLink = useCallback(async () => {
    if (shapes.length === 0) {
      toast.error("Add at least one polygon before sharing.")
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.set("coords", serializeShapesToUrl(shapes))
    url.searchParams.set("basemap", basemapId)
    window.history.replaceState({}, "", url.toString())

    try {
      await navigator.clipboard.writeText(url.toString())
      toast.success("Link copied to clipboard.")
    } catch {
      toast.error("Could not copy link. Copy the URL from the address bar.")
    }
  }, [basemapId, shapes])

  return {
    shapes,
    activeShapeId,
    basemapId,
    importText,
    showImportPanel,
    fitBoundsKey,
    lineListText,
    geojsonText,
    compactJsonText,
    canUndo: Boolean(
      activeShape && !activeShape.isClosed && activeShape.points.length > 0,
    ),
    canClose: Boolean(
      activeShape && !activeShape.isClosed && activeShape.points.length >= 3,
    ),
    isEmpty: shapes.length === 0,
    shapeCount: shapes.length,
    addPoint,
    moveVertex,
    finalizeVertexMove,
    undo,
    reset,
    closeShape,
    newPolygon,
    selectShape,
    deleteActiveShape,
    setBasemapId,
    setImportText,
    openImportPanel,
    cancelImport,
    importFromText,
    shareLink,
  }
}
