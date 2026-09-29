import { ImageResponse } from "next/og"

import { buildOgPreviewSvg, svgToDataUri } from "@/lib/og-polygon-svg"
import { getOgPreviewData } from "@/lib/og-shapes"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

export const runtime = "edge"

const WIDTH = 1200
const HEIGHT = 630
const PREVIEW_WIDTH = 520
const PREVIEW_HEIGHT = 420

function buildSubtitle(preview: ReturnType<typeof getOgPreviewData>): string {
  if (!preview.hasGeometry) {
    return "Draw · Import · Export · Share GeoJSON"
  }

  if (preview.shapeCount === 1) {
    return `${preview.pointCount} point${preview.pointCount === 1 ? "" : "s"} · 1 polygon`
  }

  return `${preview.pointCount} points · ${preview.shapeCount} polygons`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const coords = searchParams.get("coords")
  const preview = getOgPreviewData(coords)
  const subtitle = buildSubtitle(preview)
  const previewSvg = buildOgPreviewSvg(preview.shapes, PREVIEW_WIDTH, PREVIEW_HEIGHT)
  const previewSrc = svgToDataUri(previewSvg)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f766e 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "44%",
            paddingRight: "40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#99f6e4",
              }}
            >
              Free Open Source
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: "#cbd5e1",
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              color: "#94a3b8",
              maxWidth: 420,
            }}
          >
            {preview.hasGeometry
              ? "Shared polygon preview from GeoJSON Polygon Builder."
              : SITE_DESCRIPTION}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: PREVIEW_WIDTH + 48,
              height: PREVIEW_HEIGHT + 48,
              borderRadius: 32,
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
            }}
          >
            <img
              src={previewSrc}
              alt="Polygon preview"
              width={PREVIEW_WIDTH}
              height={PREVIEW_HEIGHT}
              style={{
                borderRadius: 24,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  )
}
