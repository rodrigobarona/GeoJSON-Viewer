import booleanClockwise from "@turf/boolean-clockwise"
import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
} from "geojson"

import { closeRing, pointsEqual } from "@/lib/coordinates"
import type { Shape } from "@/lib/shapes"

export type LngLat = [number, number]

export interface PolygonOutput {
  geojson: Polygon
  compact: { coordinates: number[][][] }
  ringWasReversed: boolean
}

export function ensureCounterClockwiseRing(
  points: LngLat[],
): { ring: LngLat[]; wasReversed: boolean } {
  if (points.length < 3) {
    return { ring: closeRing(points), wasReversed: false }
  }

  const closed = closeRing(points)
  const isClockwise = booleanClockwise(closed)

  if (isClockwise) {
    const reversed = closed.slice().reverse()
    const first = reversed[0]
    const last = reversed[reversed.length - 1]

    if (first && last && !pointsEqual(first, last)) {
      reversed.push(first)
    }

    return { ring: reversed, wasReversed: true }
  }

  return { ring: closed, wasReversed: false }
}

export function buildOpenLineGeoJson(points: LngLat[]): Feature<LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points,
    },
  }
}

export function buildPolygonOutput(points: LngLat[]): PolygonOutput {
  const { ring, wasReversed } = ensureCounterClockwiseRing(points)
  const geojson: Polygon = {
    type: "Polygon",
    coordinates: [ring],
  }

  return {
    geojson,
    compact: { coordinates: [ring] },
    ringWasReversed: wasReversed,
  }
}

export function buildPointsFeatureCollection(
  points: LngLat[],
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map(([lng, lat], index) => ({
      type: "Feature",
      properties: { index },
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
    })),
  }
}

export function getBounds(
  points: LngLat[],
): [[number, number], [number, number]] | null {
  if (points.length === 0) {
    return null
  }

  let minLng = points[0]![0]
  let maxLng = points[0]![0]
  let minLat = points[0]![1]
  let maxLat = points[0]![1]

  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

export function getBoundsForShapes(
  shapes: Shape[],
): [[number, number], [number, number]] | null {
  const allPoints = shapes.flatMap((shape) => shape.points)
  return getBounds(allPoints)
}

export const SHAPE_COLORS = [
  "#41d8f0",
  "#a078f0",
  "#f0a041",
  "#41f0a0",
  "#f078a0",
  "#78a0f0",
] as const

export function getShapeColor(index: number): string {
  return SHAPE_COLORS[index % SHAPE_COLORS.length]!
}

export function buildShapesOverlayData(shapes: Shape[], activeShapeId: string | null) {
  const lineFeatures: Feature<LineString>[] = []
  const polygonFeatures: Feature<Polygon>[] = []
  const pointFeatures: Feature<Point>[] = []

  shapes.forEach((shape, shapeIndex) => {
    const color = getShapeColor(shapeIndex)
    const isActive = shape.id === activeShapeId

    if (shape.isClosed && shape.points.length >= 3) {
      const polygon = buildPolygonOutput(shape.points)
      polygonFeatures.push({
        type: "Feature",
        properties: { shapeId: shape.id, shapeIndex, color, isActive },
        geometry: polygon.geojson,
      })
    } else if (shape.points.length >= 2) {
      lineFeatures.push({
        type: "Feature",
        properties: { shapeId: shape.id, shapeIndex, color, isActive },
        geometry: {
          type: "LineString",
          coordinates: shape.points,
        },
      })
    }

    shape.points.forEach(([lng, lat], pointIndex) => {
      pointFeatures.push({
        type: "Feature",
        properties: {
          shapeId: shape.id,
          shapeIndex,
          color,
          isActive,
          pointIndex,
          draggable: isActive,
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      })
    })
  })

  return {
    lines: {
      type: "FeatureCollection" as const,
      features: lineFeatures,
    },
    polygons: {
      type: "FeatureCollection" as const,
      features: polygonFeatures,
    },
    points: {
      type: "FeatureCollection" as const,
      features: pointFeatures,
    },
  }
}

export function buildShapesGeoJsonCollection(shapes: Shape[]): FeatureCollection {
  const features: Feature<Polygon | LineString>[] = []

  for (const shape of shapes) {
    if (shape.points.length === 0) {
      continue
    }

    if (shape.isClosed && shape.points.length >= 3) {
      features.push({
        type: "Feature",
        properties: { id: shape.id },
        geometry: buildPolygonOutput(shape.points).geojson,
      })
      continue
    }

    if (shape.points.length >= 2) {
      features.push(buildOpenLineGeoJson(shape.points))
    }
  }

  return {
    type: "FeatureCollection",
    features,
  }
}
