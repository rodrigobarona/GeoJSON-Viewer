"use client"

import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import {
  CoordinateParseError,
  formatCoordinatesLineByLine,
  parseCoordinatesFromText,
  parseCoordsFromUrl,
  serializeCoordsToUrl,
} from "@/lib/coordinates"
import {
  buildOpenLineGeoJson,
  buildPolygonOutput,
  type LngLat,
} from "@/lib/geojson"

export interface PolygonToolState {
  points: LngLat[]
  isClosed: boolean
  ringWasReversed: boolean
  importText: string
  showImportPanel: boolean
  fitBoundsKey: number
  lineListText: string
  geojsonText: string
  compactJsonText: string
  canUndo: boolean
  canClose: boolean
  isEmpty: boolean
}

export interface PolygonToolActions {
  addPoint: (point: LngLat) => void
  undo: () => void
  reset: () => void
  closeShape: () => void
  setImportText: (value: string) => void
  openImportPanel: () => void
  cancelImport: () => void
  importFromText: () => void
  shareLink: () => Promise<void>
}

function getInitialStateFromUrl(searchParams: URLSearchParams) {
  const coordsParam = searchParams.get("coords")
  if (!coordsParam) {
    return {
      points: [] as LngLat[],
      isClosed: false,
      ringWasReversed: false,
      importText: "",
    }
  }

  try {
    const parsed = parseCoordsFromUrl(coordsParam)
    if (parsed.length === 0) {
      return {
        points: [] as LngLat[],
        isClosed: false,
        ringWasReversed: false,
        importText: "",
      }
    }

    const closed = parsed.length >= 3
    const ringWasReversed = closed
      ? buildPolygonOutput(parsed).ringWasReversed
      : false

    return {
      points: parsed,
      isClosed: closed,
      ringWasReversed,
      importText: formatCoordinatesLineByLine(parsed),
    }
  } catch (error) {
    const message =
      error instanceof CoordinateParseError
        ? error.message
        : "Could not read coordinates from URL."
    toast.error(message)
    return {
      points: [] as LngLat[],
      isClosed: false,
      ringWasReversed: false,
      importText: "",
    }
  }
}

export function usePolygonTool(): PolygonToolState & PolygonToolActions {
  const searchParams = useSearchParams()
  const [initialState] = useState(() => getInitialStateFromUrl(searchParams))
  const [points, setPoints] = useState<LngLat[]>(initialState.points)
  const [isClosed, setIsClosed] = useState(initialState.isClosed)
  const [ringWasReversed, setRingWasReversed] = useState(
    initialState.ringWasReversed,
  )
  const [importText, setImportText] = useState(initialState.importText)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [fitBoundsKey, setFitBoundsKey] = useState(
    initialState.points.length > 0 ? 1 : 0,
  )

  const lineListText = useMemo(
    () => formatCoordinatesLineByLine(points),
    [points],
  )

  const { geojsonText, compactJsonText } = useMemo(() => {
    if (points.length === 0) {
      return { geojsonText: "", compactJsonText: "" }
    }

    if (isClosed && points.length >= 3) {
      const output = buildPolygonOutput(points)
      return {
        geojsonText: JSON.stringify(output.geojson, null, 2),
        compactJsonText: JSON.stringify(output.compact, null, 2),
      }
    }

    const line = buildOpenLineGeoJson(points)
    return {
      geojsonText: JSON.stringify(line.geometry, null, 2),
      compactJsonText: JSON.stringify(
        { coordinates: line.geometry.coordinates },
        null,
        2,
      ),
    }
  }, [isClosed, points])

  const addPoint = useCallback((point: LngLat) => {
    setPoints((current) => [...current, point])
    setIsClosed(false)
    setRingWasReversed(false)
  }, [])

  const undo = useCallback(() => {
    setPoints((current) => {
      if (current.length === 0) {
        return current
      }
      return current.slice(0, -1)
    })
    setIsClosed(false)
    setRingWasReversed(false)
  }, [])

  const reset = useCallback(() => {
    setPoints([])
    setIsClosed(false)
    setRingWasReversed(false)
    setImportText("")
    setShowImportPanel(false)
  }, [])

  const closeShape = useCallback(() => {
    if (points.length < 3) {
      return
    }

    const output = buildPolygonOutput(points)
    setRingWasReversed(output.ringWasReversed)
    setIsClosed(true)
  }, [points])

  const openImportPanel = useCallback(() => {
    setImportText((current) =>
      current.trim() ? current : formatCoordinatesLineByLine(points),
    )
    setShowImportPanel(true)
  }, [points])

  const cancelImport = useCallback(() => {
    setShowImportPanel(false)
    setImportText(formatCoordinatesLineByLine(points))
  }, [points])

  const importFromText = useCallback(() => {
    try {
      const parsed = parseCoordinatesFromText(importText)
      const shouldClose = parsed.isClosed || parsed.points.length >= 3

      setPoints(parsed.points)
      setIsClosed(shouldClose)
      setImportText(formatCoordinatesLineByLine(parsed.points))
      setShowImportPanel(false)
      setFitBoundsKey((current) => current + 1)

      if (shouldClose) {
        const output = buildPolygonOutput(parsed.points)
        setRingWasReversed(output.ringWasReversed)
      } else {
        setRingWasReversed(false)
      }

      toast.success(
        `Imported ${parsed.points.length} point${parsed.points.length === 1 ? "" : "s"}.`,
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
    if (points.length === 0) {
      toast.error("Add at least one point before sharing.")
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.set("coords", serializeCoordsToUrl(points))
    window.history.replaceState({}, "", url.toString())

    try {
      await navigator.clipboard.writeText(url.toString())
      toast.success("Link copied to clipboard.")
    } catch {
      toast.error("Could not copy link. Copy the URL from the address bar.")
    }
  }, [points])

  return {
    points,
    isClosed,
    ringWasReversed,
    importText,
    showImportPanel,
    fitBoundsKey,
    lineListText,
    geojsonText,
    compactJsonText,
    canUndo: points.length > 0,
    canClose: points.length >= 3 && !isClosed,
    isEmpty: points.length === 0,
    addPoint,
    undo,
    reset,
    closeShape,
    setImportText,
    openImportPanel,
    cancelImport,
    importFromText,
    shareLink,
  }
}
