import { parseShapesFromUrl } from "@/lib/coordinates"
import { getBounds, getShapeColor, type LngLat } from "@/lib/geojson"
import { closeShapeRecord, createShape, type Shape } from "@/lib/shapes"

export interface OgShapePreview {
  points: LngLat[]
  isClosed: boolean
  color: string
}

export interface OgPreviewData {
  shapes: OgShapePreview[]
  pointCount: number
  shapeCount: number
  hasGeometry: boolean
}

function shapesFromCoordsParam(coords: string | null): Shape[] {
  const parsedShapes = parseShapesFromUrl(coords)
  return parsedShapes.map((points) => {
    const isClosed = points.length >= 3
    const shape = createShape(points, isClosed)
    return isClosed ? closeShapeRecord(shape) : shape
  })
}

export function getOgPreviewData(coords: string | null): OgPreviewData {
  const shapes = shapesFromCoordsParam(coords)
  const previews: OgShapePreview[] = shapes
    .filter((shape) => shape.points.length > 0)
    .map((shape, index) => ({
      points: shape.points,
      isClosed: shape.isClosed && shape.points.length >= 3,
      color: getShapeColor(index),
    }))

  const pointCount = previews.reduce(
    (total, shape) => total + shape.points.length,
    0,
  )

  return {
    shapes: previews,
    pointCount,
    shapeCount: previews.length,
    hasGeometry: pointCount > 0,
  }
}

export function getPreviewBounds(
  shapes: OgShapePreview[],
): [[number, number], [number, number]] | null {
  const allPoints = shapes.flatMap((shape) => shape.points)
  if (allPoints.length === 0) {
    return null
  }

  const bounds = getBounds(allPoints)
  if (!bounds) {
    return null
  }

  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  const lngPadding = Math.max((maxLng - minLng) * 0.12, 0.001)
  const latPadding = Math.max((maxLat - minLat) * 0.12, 0.001)

  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding],
  ]
}
