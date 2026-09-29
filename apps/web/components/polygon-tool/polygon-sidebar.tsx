"use client"

import type { ComponentProps, ReactNode } from "react"
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
import { CREATOR_NAME, CREATOR_X_URL, GITHUB_REPO_URL } from "@/lib/site"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@workspace/ui/components/button-group"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type PolygonSidebarProps = PolygonToolState & PolygonToolActions

type ActionButtonProps = {
  tooltip: string
  label: string
  children: ReactNode
} & ComponentProps<typeof Button>

function ActionButton({
  tooltip,
  label,
  children,
  className,
  ...buttonProps
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button aria-label={label} className={className} {...buttonProps} />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

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

      <div className="space-y-2.5 border-b px-4 py-3">
        <div className="flex gap-2">
          <ActionButton
            tooltip="Add polygon from pasted coordinates"
            label="Import"
            variant={showImportPanel ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={openImportPanel}
          >
            <RiDownloadLine />
            Import
          </ActionButton>

          <ActionButton
            tooltip="Start a new polygon"
            label="New"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={newPolygon}
          >
            <RiAddLine />
            New
          </ActionButton>
        </div>

        <ButtonGroup className="w-full">
          <ActionButton
            tooltip="Remove the last point"
            label="Undo"
            variant="outline"
            size="icon-sm"
            className="flex-1"
            onClick={undo}
            disabled={!canUndo}
          >
            <RiArrowGoBackLine />
          </ActionButton>

          <ActionButton
            tooltip="Finish the active polygon"
            label="Close Shape"
            variant="outline"
            size="icon-sm"
            className="flex-1"
            onClick={closeShape}
            disabled={!canClose}
          >
            <RiCloseCircleLine />
          </ActionButton>

          <ButtonGroupSeparator />

          <ActionButton
            tooltip="Clear all polygons"
            label="Reset"
            variant="outline"
            size="icon-sm"
            className="flex-1"
            onClick={reset}
          >
            <RiRestartLine />
          </ActionButton>

          {activeShape ? (
            <ActionButton
              tooltip="Delete the active polygon"
              label="Delete"
              variant="destructive"
              size="icon-sm"
              className="flex-1"
              onClick={deleteActiveShape}
            >
              <RiDeleteBinLine />
            </ActionButton>
          ) : null}
        </ButtonGroup>
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
                placeholder={"-9.139337, 38.722252\n-9.142104, 38.716372"}
                className="field-sizing-fixed min-h-32 max-h-40 resize-none overflow-y-auto font-mono text-xs"
                autoFocus
              />
              <p className="text-muted-foreground shrink-0 text-xs leading-relaxed">
                Paste one point per line as{" "}
                <span className="font-mono">lng, lat</span>, GeoJSON, or a
                FeatureCollection with multiple polygons. Shapes with 3+ points
                are closed automatically.
              </p>
              <div className="flex shrink-0 gap-2">
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

      <footer className="text-muted-foreground shrink-0 border-t px-4 py-3 text-xs leading-relaxed">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          Open source on GitHub
        </a>
        <span aria-hidden="true"> · </span>
        <span>
          by{" "}
          <a
            href={CREATOR_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Rodrigo Barona
          </a>
        </span>
      </footer>
    </aside>
  )
}
