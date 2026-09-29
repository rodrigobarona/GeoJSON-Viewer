import booleanClockwise from "@turf/boolean-clockwise"
import type {
  Feature,
  FeatureCollection,
  LineString,
  Polygon,
} from "geojson"

import { closeRing, pointsEqual } from "@/lib/coordinates"

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
