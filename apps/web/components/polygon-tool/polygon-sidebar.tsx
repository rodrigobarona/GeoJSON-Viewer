"use client"

import {
  RiAddLine,
  RiArrowGoBackLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiLink,
  RiRestartLine,
} from "@remixicon/react"

import { CoordinateList } from "@/components/polygon-tool/coordinate-list"
import type {
  PolygonToolActions,
  PolygonToolState,
} from "@/hooks/use-polygon-tool"
import { getShapeColor } from "@/lib/geojson"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type PolygonSidebarProps = PolygonToolState & PolygonToolActions

export function PolygonSidebar({
  shapes,
  activeShapeId,
  importText,
  lineListText,
  compactJsonText,
  geojsonText,
  showImportPanel,
  canUndo,
  canClose,
  isEmpty,
  shapeCount,
  setImportText,
  openImportPanel,
  cancelImport,
  importFromText,
  reset,
  undo,
  closeShape,
  newPolygon,
  selectShape,
  deleteActiveShape,
  shareLink,
}: PolygonSidebarProps) {
  const activeIndex = shapes.findIndex((shape) => shape.id === activeShapeId)
  const activeShape = activeIndex >= 0 ? shapes[activeIndex] : null
  const shapeLabel =
    shapeCount > 1 && activeShape
      ? `Polygon ${activeIndex + 1} of ${shapeCount}${activeShape.isClosed ? " (closed)" : " (draft)"}`
      : undefined

  return (
    <aside className="bg-card flex h-full min-h-0 flex-col border-l">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-xl tracking-tight">Polygon Tool</h1>
          {shapeCount > 0 ? (
            <Badge variant="secondary">{shapeCount}</Badge>
          ) : null}
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => void shareLink()}
                aria-label="Share link"
              />
            }
          >
            <RiLink />
          </TooltipTrigger>
          <TooltipContent>Copy share link</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-wrap gap-2 border-b px-4 py-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={showImportPanel ? "default" : "outline"}
                size="sm"
                onClick={openImportPanel}
              />
            }
          >
            <RiDownloadLine />
            Import
          </TooltipTrigger>
          <TooltipContent>Add polygon from pasted coordinates</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="sm" onClick={newPolygon} />
            }
          >
            <RiAddLine />
            New
          </TooltipTrigger>
          <TooltipContent>Start a new polygon</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="sm" onClick={reset} />
            }
          >
            <RiRestartLine />
            Reset
          </TooltipTrigger>
          <TooltipContent>Clear all polygons</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
              />
            }
          >
            <RiArrowGoBackLine />
            Undo
          </TooltipTrigger>
          <TooltipContent>Remove the last point</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={closeShape}
                disabled={!canClose}
              />
            }
          >
            <RiCloseCircleLine />
            Close Shape
          </TooltipTrigger>
          <TooltipContent>Finish the active polygon</TooltipContent>
        </Tooltip>

        {activeShape ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteActiveShape}
                />
              }
            >
              <RiDeleteBinLine />
              Delete
            </TooltipTrigger>
            <TooltipContent>Delete the active polygon</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-4 py-4">
          {shapeCount > 1 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Polygons
              </p>
              <div className="flex flex-wrap gap-2">
                {shapes.map((shape, index) => {
                  const isActive = shape.id === activeShapeId
                  return (
                    <Button
                      key={shape.id}
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      onClick={() => selectShape(shape.id)}
                      className="gap-2"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: getShapeColor(index) }}
                      />
                      {index + 1}
                      {shape.isClosed ? "" : " *"}
                    </Button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {showImportPanel ? (
            <div className="space-y-3">
              <label
                htmlFor="coordinate-import"
                className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                Import coordinates
              </label>
              <Textarea
                id="coordinate-import"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder={"-72.2839987, 42.9276063\n-72.2842133, 42.9272135"}
                className="min-h-48 font-mono text-xs"
                autoFocus
              />
              <p className="text-muted-foreground text-xs leading-relaxed">
                Paste one point per line as{" "}
                <span className="font-mono">lng, lat</span>, GeoJSON, or a
                FeatureCollection with multiple polygons. Shapes with 3+ points
                are closed automatically.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={importFromText}>
                  <RiDownloadLine />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={cancelImport}>
                  <RiCloseLine />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {activeShape?.ringWasReversed ? (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Coordinate order reversed to conform to right-hand rule.
                </p>
              ) : null}

              <CoordinateList
                lineListText={lineListText}
                compactJsonText={compactJsonText}
                geojsonText={geojsonText}
                isEmpty={isEmpty}
                shapeLabel={shapeLabel}
              />
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
