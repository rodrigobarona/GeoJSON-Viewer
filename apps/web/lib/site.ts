export const SITE_NAME = "GeoJSON Polygon Builder"
export const SITE_DESCRIPTION =
  "Free open-source browser tool to draw, edit, import, export, and share GeoJSON polygons on an interactive map."
export const GITHUB_REPO_URL = "https://github.com/rodrigobarona/GeoJSON-Viewer"
export const CREATOR_X_URL = "https://x.com/rbarona"
export const CREATOR_NAME = "Rodrigo Barona"

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
}
