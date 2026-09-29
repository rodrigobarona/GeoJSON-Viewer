import type { LngLat } from "@/lib/geojson"

const EARTH_RADIUS_METERS = 6_378_137

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function haversineMeters(a: LngLat, b: LngLat): number {
  const dLat = toRadians(b[1] - a[1])
  const dLng = toRadians(b[0] - a[0])
  const lat1 = toRadians(a[1])
  const lat2 = toRadians(b[1])

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

function interpolatePoint(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

export function pointToSegmentDistanceMeters(
  point: LngLat,
  start: LngLat,
  end: LngLat,
): number {
  const lengthSquared = haversineMeters(start, end) ** 2
  if (lengthSquared === 0) {
    return haversineMeters(point, start)
  }

  let low = 0
  let high = 1
  let bestDistance = Infinity

  for (let step = 0; step < 20; step += 1) {
    const t1 = low + (high - low) / 3
    const t2 = high - (high - low) / 3
    const d1 = haversineMeters(point, interpolatePoint(start, end, t1))
    const d2 = haversineMeters(point, interpolatePoint(start, end, t2))

    if (d1 < d2) {
      high = t2
      bestDistance = d1
    } else {
      low = t1
      bestDistance = d2
    }
  }

  return bestDistance
}

export function findEdgeInsertionIndex(
  points: LngLat[],
  click: LngLat,
  isClosed: boolean,
): number {
  if (points.length === 0) {
    return 0
  }

  if (!isClosed) {
    return points.length
  }

  if (points.length === 1) {
    return 1
  }

  let bestIndex = 0
  let bestDistance = Infinity

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index]!
    const end = points[(index + 1) % points.length]!
    const distance = pointToSegmentDistanceMeters(click, start, end)

    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex + 1
}

export function insertPointAtIndex(
  points: LngLat[],
  index: number,
  point: LngLat,
): LngLat[] {
  const clampedIndex = Math.max(0, Math.min(index, points.length))
  return [
    ...points.slice(0, clampedIndex),
    point,
    ...points.slice(clampedIndex),
  ]
}

export function updatePointAtIndex(
  points: LngLat[],
  index: number,
  point: LngLat,
): LngLat[] {
  return points.map((existing, existingIndex) =>
    existingIndex === index ? point : existing,
  )
}

export function isCoarsePointerDevice(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia("(pointer: coarse)").matches
}
