import type { Metadata } from "next"

import { getOgPreviewData } from "@/lib/og-shapes"
import {
  CREATOR_NAME,
  CREATOR_X_URL,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site"

const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

function buildOgImagePath(coords: string | null): string {
  if (!coords) {
    return "/api/og"
  }

  return `/api/og?coords=${encodeURIComponent(coords)}`
}

function buildTitle(preview: ReturnType<typeof getOgPreviewData>): string {
  if (!preview.hasGeometry) {
    return SITE_NAME
  }

  if (preview.shapeCount === 1) {
    return `${preview.pointCount} points · ${SITE_NAME}`
  }

  return `${preview.shapeCount} polygons · ${preview.pointCount} points · ${SITE_NAME}`
}

function buildDescription(preview: ReturnType<typeof getOgPreviewData>): string {
  if (!preview.hasGeometry) {
    return SITE_DESCRIPTION
  }

  if (preview.shapeCount === 1) {
    return `Shared polygon with ${preview.pointCount} coordinate points. ${SITE_DESCRIPTION}`
  }

  return `Shared map with ${preview.shapeCount} polygons and ${preview.pointCount} coordinate points. ${SITE_DESCRIPTION}`
}

export function buildPageMetadata(
  coords: string | null,
  requestHost?: string | null,
): Metadata {
  const preview = getOgPreviewData(coords)
  const title = buildTitle(preview)
  const description = buildDescription(preview)
  const siteUrl = getSiteUrl(requestHost)
  const ogImagePath = buildOgImagePath(coords)
  const pageUrl = coords
    ? `${siteUrl}/?coords=${encodeURIComponent(coords)}`
    : siteUrl

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: pageUrl,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: ogImagePath,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: preview.hasGeometry
            ? `Polygon preview with ${preview.pointCount} points`
            : SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@rbarona",
      images: [ogImagePath],
    },
    authors: [{ name: CREATOR_NAME, url: CREATOR_X_URL }],
    creator: CREATOR_NAME,
    applicationName: SITE_NAME,
  }
}
