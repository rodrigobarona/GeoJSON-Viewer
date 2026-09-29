"use client"

import { RiDownloadLine, RiFileCopyLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"

interface CoordinateListProps {
  lineListText: string
  compactJsonText: string
  geojsonText: string
  isEmpty: boolean
  shapeLabel?: string
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard.`)
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}.`)
  }
}

function downloadJsonFile(text: string) {
  try {
    const blob = new Blob([text], { type: "application/geo+json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
    anchor.href = url
    anchor.download = `polygon-${stamp}.geojson`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("GeoJSON file downloaded.")
  } catch {
    toast.error("Could not download JSON file.")
  }
}

function SectionHeader({
  title,
  onCopy,
  onDownload,
}: {
  title: string
  onCopy: () => void
  onDownload?: () => void
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </p>
      <div className="flex items-center gap-1">
        {onDownload ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onDownload}
            aria-label={`Download ${title}`}
          >
            <RiDownloadLine />
            Download
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onCopy}
          aria-label={`Copy ${title}`}
        >
          <RiFileCopyLine />
          Copy
        </Button>
      </div>
    </div>
  )
}

export function CoordinateList({
  lineListText,
  compactJsonText,
  geojsonText,
  isEmpty,
  shapeLabel,
}: CoordinateListProps) {
  if (isEmpty) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        Right-click to add points (tap on mobile). Drag vertices to move them.
        On mobile, use two fingers to pan the map. Use New to start another
        polygon.
      </p>
    )
  }

  // Prefer full GeoJSON for downloads; fall back to compact panel text.
  const jsonText = compactJsonText || geojsonText
  const downloadText = geojsonText || compactJsonText

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {shapeLabel ? (
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {shapeLabel}
        </p>
      ) : null}

      <div className="min-h-0 flex-1">
        <SectionHeader
          title="Points"
          onCopy={() => void copyText(lineListText, "Points")}
        />
        <ScrollArea className="h-40 rounded-lg border bg-muted/30 p-3">
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {lineListText}
          </pre>
        </ScrollArea>
      </div>

      <Separator />

      <div className="min-h-0 flex-1">
        <SectionHeader
          title="JSON"
          onCopy={() => void copyText(jsonText, "JSON")}
          onDownload={() => downloadJsonFile(downloadText)}
        />
        <ScrollArea className="h-48 rounded-lg border bg-muted/30 p-3">
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {jsonText}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}
