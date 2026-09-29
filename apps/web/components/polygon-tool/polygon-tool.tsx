"use client"

import { Suspense } from "react"

import { MapView } from "@/components/polygon-tool/map-view"
import { PolygonSidebar } from "@/components/polygon-tool/polygon-sidebar"
import { usePolygonTool } from "@/hooks/use-polygon-tool"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"

function PolygonToolContent() {
  const tool = usePolygonTool()

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      <ResizablePanel defaultSize="75" minSize="50" className="min-w-0">
        <MapView
          shapes={tool.shapes}
          activeShapeId={tool.activeShapeId}
          basemapId={tool.basemapId}
          fitBoundsKey={tool.fitBoundsKey}
          onBasemapChange={tool.setBasemapId}
          onAddPoint={tool.addPoint}
          onMoveVertex={tool.moveVertex}
          onFinalizeVertexMove={tool.finalizeVertexMove}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="25" minSize="20" maxSize="40" className="min-w-0">
        <PolygonSidebar {...tool} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function PolygonTool() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          Loading map…
        </div>
      }
    >
      <PolygonToolContent />
    </Suspense>
  )
}
