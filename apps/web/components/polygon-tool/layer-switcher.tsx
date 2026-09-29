"use client"

import { RiStackLine } from "@remixicon/react"

import { BASEMAPS, type BasemapId } from "@/lib/basemaps"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

interface LayerSwitcherProps {
  value: BasemapId
  onChange: (value: BasemapId) => void
}

export function LayerSwitcher({ value, onChange }: LayerSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="bg-background/95 inline-flex size-8 items-center justify-center rounded-lg border shadow-sm backdrop-blur outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Switch basemap"
      >
        <RiStackLine className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as BasemapId)}
        >
          {BASEMAPS.map((basemap) => (
            <DropdownMenuRadioItem key={basemap.id} value={basemap.id}>
              {basemap.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
