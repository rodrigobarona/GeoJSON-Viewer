import { setWorkerUrl } from "maplibre-gl"

let configured = false

export function configureMapLibreWorker() {
  if (configured || typeof window === "undefined") {
    return
  }

  // Worker imports ./maplibre-gl-shared.mjs — both files live in public/
  setWorkerUrl(new URL("/maplibre-gl-worker.mjs", window.location.origin).href)
  configured = true
}
