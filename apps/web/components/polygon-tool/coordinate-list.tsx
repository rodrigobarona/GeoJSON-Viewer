"use client"

import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"

interface CoordinateListProps {
  lineListText: string
  compactJsonText: string
  geojsonText: string
  isEmpty: boolean
}

export function CoordinateList({
  lineListText,
  compactJsonText,
  geojsonText,
  isEmpty,
}: CoordinateListProps) {
  if (isEmpty) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        Click the map to add points. Use Close Shape to finish a polygon.
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="min-h-0 flex-1">
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          Points
        </p>
        <ScrollArea className="h-40 rounded-lg border bg-muted/30 p-3">
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {lineListText}
          </pre>
        </ScrollArea>
      </div>

      <Separator />

      <div className="min-h-0 flex-1">
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          JSON
        </p>
        <ScrollArea className="h-48 rounded-lg border bg-muted/30 p-3">
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {compactJsonText || geojsonText}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}
