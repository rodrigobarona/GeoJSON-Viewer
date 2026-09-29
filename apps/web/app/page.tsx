import type { Metadata } from "next"
import { headers } from "next/headers"

import { PolygonTool } from "@/components/polygon-tool/polygon-tool"
import { buildPageMetadata } from "@/lib/og-metadata"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ coords?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const headersList = await headers()
  const requestHost =
    headersList.get("x-forwarded-host") ?? headersList.get("host")

  return buildPageMetadata(params.coords ?? null, requestHost)
}

export default function Page() {
  return (
    <main className="h-svh overflow-hidden">
      <PolygonTool />
    </main>
  )
}
