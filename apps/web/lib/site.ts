export const SITE_NAME = "GeoJSON Polygon Builder"
export const SITE_DESCRIPTION =
  "Free open-source browser tool to draw, edit, import, export, and share GeoJSON polygons on an interactive map."
export const GITHUB_REPO_URL = "https://github.com/rodrigobarona/GeoJSON-Viewer"
export const CREATOR_X_URL = "https://x.com/rbarona"
export const CREATOR_NAME = "Rodrigo Barona"
export const DEFAULT_PRODUCTION_URL = "https://geojson-polygon-builder.vercel.app"

export function getSiteUrl(requestHost?: string | null): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }

  const normalizedHost = requestHost?.split(",")[0]?.trim()
  if (normalizedHost && !normalizedHost.startsWith("localhost")) {
    return `https://${normalizedHost}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_ENV === "production") {
    return DEFAULT_PRODUCTION_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
}
