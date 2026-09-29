import { buildPolygonOutput, type LngLat } from "@/lib/geojson"

export interface Shape {
  id: string
  points: LngLat[]
  isClosed: boolean
  ringWasReversed: boolean
}

export function createShapeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createShape(
  points: LngLat[] = [],
  isClosed = false,
): Shape {
  const shape: Shape = {
    id: createShapeId(),
    points,
    isClosed,
    ringWasReversed: false,
  }

  if (isClosed && points.length >= 3) {
    return closeShapeRecord(shape)
  }

  return shape
}

export function closeShapeRecord(shape: Shape): Shape {
  if (shape.points.length < 3) {
    return shape
  }

  const output = buildPolygonOutput(shape.points)
  return {
    ...shape,
    isClosed: true,
    ringWasReversed: output.ringWasReversed,
  }
}

export function isDraftShape(shape: Shape): boolean {
  return !shape.isClosed
}

export function getActiveDraftShape(
  shapes: Shape[],
  activeShapeId: string | null,
): Shape | null {
  if (!activeShapeId) {
    return null
  }

  const shape = shapes.find((entry) => entry.id === activeShapeId)
  if (!shape || shape.isClosed) {
    return null
  }

  return shape
}

export function getShapeOrNull(
  shapes: Shape[],
  activeShapeId: string | null,
): Shape | null {
  if (!activeShapeId) {
    return null
  }

  return shapes.find((entry) => entry.id === activeShapeId) ?? null
}
