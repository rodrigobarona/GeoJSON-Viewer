import type { LngLat } from "@/lib/geojson"

export class CoordinateParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CoordinateParseError"
  }
}

function parsePair(raw: string): LngLat {
  const cleaned = raw.trim()
  if (!cleaned) {
    throw new CoordinateParseError("Empty coordinate line.")
  }

  const parts = cleaned.split(/[,\s]+/).filter(Boolean)
  if (parts.length < 2) {
    throw new CoordinateParseError(`Invalid coordinate: "${raw}"`)
  }

  const lng = Number(parts[0])
  const lat = Number(parts[1])

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    throw new CoordinateParseError(`Invalid numbers in: "${raw}"`)
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw new CoordinateParseError(
      `Out of range coordinate: lng=${lng}, lat=${lat}`,
    )
  }

  return [lng, lat]
}

function parseLineByLine(text: string): LngLat[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new CoordinateParseError("No coordinates found.")
  }

  return lines.map(parsePair)
}

function isLngLatPair(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  )
}

function parseCoordinateArray(value: unknown): ParsedShapeImport | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null
  }

  // Polygon coordinates: [[[lng, lat], ...], ...]
  if (Array.isArray(value[0]) && isLngLatPair(value[0][0])) {
    const ring = value[0] as LngLat[]
    return {
      points: normalizeRing(ring),
      isClosed: ring.length >= 3,
    }
  }

  // LineString / flat ring: [[lng, lat], ...]
  if (isLngLatPair(value[0])) {
    const points = value as LngLat[]
    return {
      points: normalizeRing(points),
      isClosed: points.length >= 3,
    }
  }

  return null
}

function extractShapesFromGeoJson(value: unknown): ParsedShapeImport[] {
  if (!value || typeof value !== "object") {
    throw new CoordinateParseError("Invalid GeoJSON.")
  }

  const data = value as Record<string, unknown>
  if (data.type === "FeatureCollection") {
    const features = data.features
    if (!Array.isArray(features) || features.length === 0) {
      throw new CoordinateParseError("FeatureCollection has no features.")
    }

    return features.flatMap((feature) => {
      const parsed = parseGeoJsonShape(feature)
      return parsed ? [parsed] : []
    })
  }

  const single = parseGeoJsonShape(value)
  if (single) {
    return [single]
  }

  // Compact export from this app: { "coordinates": [...] } without a type
  if ("coordinates" in data && !("type" in data)) {
    const fromCoordinates = parseCoordinateArray(data.coordinates)
    if (fromCoordinates) {
      return [fromCoordinates]
    }
  }

  throw new CoordinateParseError(
    "Unsupported GeoJSON type. Use Polygon, LineString, Feature, or { coordinates }.",
  )
}

function parseGeoJsonShape(value: unknown): ParsedShapeImport | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const data = value as Record<string, unknown>
  const geometry = data.type === "Feature" ? data.geometry : value
  if (!geometry || typeof geometry !== "object") {
    return null
  }

  const geometryData = geometry as Record<string, unknown>
  if (geometryData.type === "Polygon") {
    const coordinates = geometryData.coordinates
    if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) {
      throw new CoordinateParseError("Invalid Polygon coordinates.")
    }

    return {
      points: normalizeRing(coordinates[0] as LngLat[]),
      isClosed: true,
    }
  }

  if (geometryData.type === "LineString") {
    const coordinates = geometryData.coordinates
    if (!Array.isArray(coordinates)) {
      throw new CoordinateParseError("Invalid LineString coordinates.")
    }

    return {
      points: coordinates as LngLat[],
      isClosed: false,
    }
  }

  return null
}

function normalizeRing(ring: LngLat[]): LngLat[] {
  if (ring.length === 0) {
    return ring
  }

  const points = [...ring]
  const first = points[0]
  const last = points[points.length - 1]

  if (
    first &&
    last &&
    first[0] === last[0] &&
    first[1] === last[1] &&
    points.length > 1
  ) {
    points.pop()
  }

  return points
}

export interface ParsedCoordinates {
  points: LngLat[]
  isClosed: boolean
}

export interface ParsedShapeImport {
  points: LngLat[]
  isClosed: boolean
}

export function parseMultipleCoordinatesFromText(
  text: string,
): ParsedShapeImport[] {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new CoordinateParseError("Paste coordinates or GeoJSON to import.")
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        const fromArray = parseCoordinateArray(parsed)
        if (fromArray) {
          return [fromArray]
        }
        throw new CoordinateParseError("Unsupported JSON array format.")
      }

      return extractShapesFromGeoJson(parsed).map((shape) => ({
        points: shape.points,
        isClosed: shape.isClosed || shape.points.length >= 3,
      }))
    } catch (error) {
      if (error instanceof CoordinateParseError) {
        throw error
      }
      throw new CoordinateParseError("Invalid JSON.")
    }
  }

  const points = parseLineByLine(trimmed)
  return [
    {
      points,
      isClosed: points.length >= 3,
    },
  ]
}

export function parseCoordinatesFromText(text: string): ParsedCoordinates {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new CoordinateParseError("Paste coordinates or GeoJSON to import.")
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        const fromArray = parseCoordinateArray(parsed)
        if (fromArray) {
          return fromArray
        }
        throw new CoordinateParseError("Unsupported JSON array format.")
      }

      const shapes = extractShapesFromGeoJson(parsed)
      const first = shapes[0]
      if (!first) {
        throw new CoordinateParseError("No coordinates found in GeoJSON.")
      }

      return {
        points: first.points,
        isClosed: first.isClosed,
      }
    } catch (error) {
      if (error instanceof CoordinateParseError) {
        throw error
      }
      throw new CoordinateParseError("Invalid JSON.")
    }
  }

  return {
    points: parseLineByLine(trimmed),
    isClosed: false,
  }
}

export function formatCoordinatesLineByLine(points: LngLat[]): string {
  return points
    .map(([lng, lat]) => `${lng}, ${lat}`)
    .join("\n")
}

export function serializeShapeToUrl(points: LngLat[]): string {
  return points.map(([lng, lat]) => `${lng},${lat}`).join("|")
}

/** @deprecated Use serializeShapesToUrl */
export function serializeCoordsToUrl(points: LngLat[]): string {
  return serializeShapeToUrl(points)
}

export function serializeShapesToUrl(shapes: { points: LngLat[] }[]): string {
  return shapes
    .filter((shape) => shape.points.length > 0)
    .map((shape) => serializeShapeToUrl(shape.points))
    .join(";")
}

export function parseShapeFromUrl(value: string): LngLat[] {
  const pairs = value.split("|").filter(Boolean)
  if (pairs.length === 0) {
    return []
  }

  return pairs.map((pair) => parsePair(pair.replace(",", " ")))
}

export function parseShapesFromUrl(value: string | null): LngLat[][] {
  if (!value) {
    return []
  }

  return value
    .split(";")
    .map(parseShapeFromUrl)
    .filter((points) => points.length > 0)
}

/** @deprecated Use parseShapesFromUrl */
export function parseCoordsFromUrl(value: string | null): LngLat[] {
  const shapes = parseShapesFromUrl(value)
  return shapes[0] ?? []
}

export function pointsEqual(a: LngLat, b: LngLat): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

export function closeRing(points: LngLat[]): LngLat[] {
  if (points.length === 0) {
    return points
  }

  const ring = [...points]
  const first = ring[0]
  const last = ring[ring.length - 1]

  if (first && last && !pointsEqual(first, last)) {
    ring.push(first)
  }

  return ring
}
