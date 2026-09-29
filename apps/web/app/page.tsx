import type { Metadata } from "next"

import { PolygonTool } from "@/components/polygon-tool/polygon-tool"
import { buildPageMetadata } from "@/lib/og-metadata"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ coords?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  return buildPageMetadata(params.coords ?? null)
}

export default function Page() {
  return (
    <main className="h-svh overflow-hidden">
      <PolygonTool />
    </main>
  )
}
