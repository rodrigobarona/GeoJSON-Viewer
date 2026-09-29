import type { OgShapePreview } from "@/lib/og-shapes"
import { getPreviewBounds } from "@/lib/og-shapes"
import type { LngLat } from "@/lib/geojson"

function lngLatToSvgPoint(
  point: LngLat,
  bounds: [[number, number], [number, number]],
  width: number,
  height: number,
  padding: number,
): string {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  const lngSpan = maxLng - minLng || 0.0001
  const latSpan = maxLat - minLat || 0.0001
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  const x = padding + ((point[0] - minLng) / lngSpan) * innerWidth
  const y = padding + ((maxLat - point[1]) / latSpan) * innerHeight

  return `${x.toFixed(2)},${y.toFixed(2)}`
}

function buildPlaceholderGrid(width: number, height: number): string {
  const lines: string[] = []

  for (let index = 1; index < 4; index += 1) {
    const x = (width / 4) * index
    const y = (height / 4) * index
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#dbe4ea" stroke-width="1" />`,
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#dbe4ea" stroke-width="1" />`,
    )
  }

  return lines.join("")
}

export function buildOgPreviewSvg(
  shapes: OgShapePreview[],
  width: number,
  height: number,
): string {
  const padding = 28
  const bounds = getPreviewBounds(shapes)
  const shapeElements: string[] = []

  if (bounds) {
    for (const shape of shapes) {
      const pointPairs = shape.points.map((point) =>
        lngLatToSvgPoint(point, bounds, width, height, padding),
      )

      if (shape.isClosed && shape.points.length >= 3) {
        shapeElements.push(
          `<polygon points="${pointPairs.join(" ")}" fill="${shape.color}33" stroke="${shape.color}" stroke-width="4" stroke-linejoin="round" />`,
        )
      } else if (shape.points.length >= 2) {
        shapeElements.push(
          `<polyline points="${pointPairs.join(" ")}" fill="none" stroke="${shape.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />`,
        )
      } else if (shape.points.length === 1) {
        const [x, y] = pointPairs[0]!.split(",")
        shapeElements.push(
          `<circle cx="${x}" cy="${y}" r="8" fill="${shape.color}" stroke="#ffffff" stroke-width="3" />`,
        )
      }

      for (const pair of pointPairs) {
        const [x, y] = pair.split(",")
        shapeElements.push(
          `<circle cx="${x}" cy="${y}" r="5" fill="#ffffff" stroke="${shape.color}" stroke-width="2" />`,
        )
      }
    }
  }

  const grid = buildPlaceholderGrid(width, height)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f8fafc" rx="24" />
    ${grid}
    ${shapeElements.join("")}
  </svg>`
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
