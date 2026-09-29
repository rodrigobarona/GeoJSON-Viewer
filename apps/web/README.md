# GeoJSON Polygon Builder — Web App

The browser-based polygon editor for the GeoJSON Polygon Builder project. Users draw, edit, import, and export GeoJSON polygons on an interactive MapLibre map.

**Live demo:** [geojson-polygon-builder.vercel.app](https://geojson-polygon-builder.vercel.app/)

For full documentation — features, usage guide, share URL format, FAQ, and deployment — see the [root README](../../README.md).

---

## Quick start

From the monorepo root:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To run only this app:

```bash
pnpm --filter web dev
```

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start Next.js dev server with Turbopack |
| `pnpm build` | Copy MapLibre workers + production build |
| `pnpm start` | Serve production build |
| `pnpm typecheck` | Run TypeScript (`tsc --noEmit`) |
| `pnpm lint` | Run ESLint |
| `pnpm postinstall` | Copy MapLibre worker files to `public/` |

---

## Folder structure

```
apps/web/
├── app/
│   ├── layout.tsx          # Root layout, fonts, theme provider
│   └── page.tsx            # Full-viewport polygon tool page
├── components/polygon-tool/
│   ├── polygon-tool.tsx    # Resizable map + sidebar layout
│   ├── map-view.tsx        # MapLibre map, overlays, interactions
│   ├── polygon-sidebar.tsx # Controls, import panel, shape tabs
│   ├── coordinate-list.tsx # Points list and JSON output
│   └── layer-switcher.tsx  # Basemap style picker
├── hooks/
│   └── use-polygon-tool.ts # State, URL sync, import/export logic
├── lib/
│   ├── basemaps.ts         # OpenFreeMap + EOX satellite styles
│   ├── coordinates.ts      # Parse, format, URL serialization
│   ├── geojson.ts          # GeoJSON builders, map overlay data
│   ├── map-editing.ts      # Edge insertion, vertex updates
│   ├── maplibre-setup.ts   # Web worker configuration
│   └── shapes.ts           # Shape type and helpers
├── public/
│   ├── maplibre-gl-worker.mjs
│   └── maplibre-gl-shared.mjs
└── scripts/
    └── copy-maplibre-worker.mjs
```

Shared UI components live in `packages/ui` (`@workspace/ui`).

---

## Environment variables

None required. All basemaps use free public tile endpoints:

- OpenFreeMap (Bright, Liberty, Dark)
- EOX Sentinel-2 cloudless (Satellite)

---

## Deployment

Deployed on Vercel as **geojson-polygon-builder**.

| Setting | Value |
| ------- | ----- |
| Root Directory | `apps/web` |
| Build Command | `pnpm build` (from app directory) or `pnpm --filter web build` (from monorepo root) |
| Output | Next.js default |

The build script copies MapLibre worker files to `public/` before compiling.

---

## Key dependencies

- `maplibre-gl` — interactive map rendering
- `@turf/boolean-clockwise` — GeoJSON ring winding normalization
- `next` / `react` — app framework
- `@workspace/ui` — shadcn/ui component library (monorepo package)
