"use client"

import {
  RiArrowGoBackLine,
  RiCloseCircleLine,
  RiDownloadLine,
  RiLink,
  RiRestartLine,
} from "@remixicon/react"

import { CoordinateList } from "@/components/polygon-tool/coordinate-list"
import type {
  PolygonToolActions,
  PolygonToolState,
} from "@/hooks/use-polygon-tool"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

type PolygonSidebarProps = PolygonToolState & PolygonToolActions

export function PolygonSidebar({
  importText,
  lineListText,
  compactJsonText,
  geojsonText,
  ringWasReversed,
  canUndo,
  canClose,
  isEmpty,
  setImportText,
  importFromText,
  reset,
  undo,
  closeShape,
  shareLink,
}: PolygonSidebarProps) {
  return (
    <aside className="bg-card flex h-full min-h-0 flex-col border-l">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
        <h1 className="font-serif text-xl tracking-tight">Polygon Tool</h1>
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
              <Button variant="outline" size="sm" onClick={importFromText} />
            }
          >
            <RiDownloadLine />
            Import
          </TooltipTrigger>
          <TooltipContent>Load coordinates from the text area</TooltipContent>
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
          <TooltipContent>Clear all points</TooltipContent>
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
          <TooltipContent>Finish the polygon</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
        <div className="space-y-2">
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
            className="min-h-28 font-mono text-xs"
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Paste one point per line as{" "}
            <span className="font-mono">lng, lat</span>, or paste GeoJSON.
          </p>
        </div>

        {ringWasReversed ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Coordinate order reversed to conform to right-hand rule.
          </p>
        ) : null}

        <CoordinateList
          lineListText={lineListText}
          compactJsonText={compactJsonText}
          geojsonText={geojsonText}
          isEmpty={isEmpty}
        />
      </div>
    </aside>
  )
}
