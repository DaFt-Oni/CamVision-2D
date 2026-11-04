import { clamp } from './geometry.js'

export const DEFAULT_FRAME_SETTINGS = { scale: 95 }
const STORAGE_KEY = 'optivision.frame.v1'

export function normalizeFrameSettings(value) {
  return {
    scale:
      typeof value?.scale === 'number' && Number.isFinite(value.scale)
        ? clamp(value.scale, 60, 100)
        : 95,
  }
}
export function loadFrameSettings() {
  try {
    return normalizeFrameSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)))
  } catch {
    return { ...DEFAULT_FRAME_SETTINGS }
  }
}
export function saveFrameSettings(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeFrameSettings(value)))
  } catch {
    /* Display preferences are optional when browser storage is blocked. */
  }
}

/** Manual presentation size, independent of room dimensions and viewport height. */
export function calculateDrawingFrame(_space, measurement, settings) {
  const { scale } = normalizeFrameSettings(settings)
  const { width, viewportWidth, inspectorWidth, gap } = measurement
  const stacked = viewportWidth <= 950
  const available = Math.max(160, width - (stacked ? 0 : inspectorWidth + gap))
  const originalWidth = Math.min(760, available)
  const factor = scale / 100
  const drawingWidth = stacked ? available : originalWidth * factor
  const originalHeight = (stacked ? available : originalWidth) * 1.06
  return {
    drawingWidth,
    drawingHeight: originalHeight * factor,
    gridWidth: stacked ? available : drawingWidth + inspectorWidth + gap,
    effectiveScale: scale,
    stacked,
  }
}
