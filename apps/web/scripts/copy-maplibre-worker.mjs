import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const maplibreDist = dirname(require.resolve("maplibre-gl/package.json"))
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public")

mkdirSync(publicDir, { recursive: true })

for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(maplibreDist, "dist", file), join(publicDir, file))
}

console.log("Copied MapLibre worker files to public/")
