import { clamp } from './geometry.js'

/** Fit the complete room with pixel margins. X and Y always share one metre scale. */
export function createViewport(space, size, zoom = 1, pan = { x: 0, y: 0 }, orientation = {}) {
  const width = Math.max(160, size.width)
  const height = Math.max(160, size.height)
  const angle = ((orientation.rotation || 0) * Math.PI) / 180
  const boundsWidth =
    Math.abs(space.width * Math.cos(angle)) + Math.abs(space.height * Math.sin(angle))
  const boundsHeight =
    Math.abs(space.width * Math.sin(angle)) + Math.abs(space.height * Math.cos(angle))
  const fitScale = Math.min((width - 112) / boundsWidth, (height - 120) / boundsHeight)
  const pixelsPerMeter = fitScale * clamp(zoom, 0.5, 4)
  const unitsPerPixel = 1 / pixelsPerMeter
  const viewWidth = width * unitsPerPixel
  const viewHeight = height * unitsPerPixel
  return {
    x: (space.width - viewWidth) / 2 + pan.x,
    y: (space.height - viewHeight) / 2 + pan.y,
    width: viewWidth,
    height: viewHeight,
    unitsPerPixel,
    pixelsPerMeter,
    fontSize: 12 * unitsPerPixel,
    markerRadius: 10 * unitsPerPixel,
    orientation,
  }
}

export function niceStep(minimum) {
  const power = 10 ** Math.floor(Math.log10(Math.max(0.001, minimum)))
  return [1, 2, 5, 10].map((value) => value * power).find((value) => value >= minimum) || power * 10
}

/** Matrix row 0 is the lower edge; include partial boundary cells at their real centres. */
export function coverageCellAt(space, result, point) {
  if (!point || point.x < 0 || point.y < 0 || point.x > space.width || point.y > space.height)
    return null
  const column = Math.min(result.columns - 1, Math.floor(point.x / space.cellSize))
  const row = Math.min(result.rows - 1, Math.floor(point.y / space.cellSize))
  const x = column * space.cellSize,
    y = row * space.cellSize
  const width = Math.min(space.cellSize, space.width - x)
  const height = Math.min(space.cellSize, space.height - y)
  return {
    row,
    column,
    count: result.matrix[row][column],
    x,
    y,
    width,
    height,
    center: { x: x + width / 2, y: y + height / 2 },
  }
}

/** Render legible values only for cells inside the visible region, without sampling a different matrix. */
export function visibleMatrixCells(space, result, viewport) {
  if (space.cellSize * viewport.pixelsPerMeter < 12) return []
  const cells = []
  // Invert the view transform before culling: matrix indices stay in world coordinates.
  const corners = [
    { x: viewport.x, y: viewport.y },
    { x: viewport.x + viewport.width, y: viewport.y },
    { x: viewport.x, y: viewport.y + viewport.height },
    { x: viewport.x + viewport.width, y: viewport.y + viewport.height },
  ].map((point) => transformViewPoint(space, point, viewport.orientation, true))
  const left = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.x)) / space.cellSize))
  const right = Math.min(
    result.columns - 1,
    Math.ceil(Math.max(...corners.map((p) => p.x)) / space.cellSize),
  )
  const bottom = Math.max(
    0,
    Math.floor((space.height - Math.max(...corners.map((p) => p.y))) / space.cellSize),
  )
  const top = Math.min(
    result.rows - 1,
    Math.ceil((space.height - Math.min(...corners.map((p) => p.y))) / space.cellSize),
  )
  for (let row = bottom; row <= top; row++)
    for (let column = left; column <= right; column++) {
      const x = column * space.cellSize,
        y = row * space.cellSize
      const width = Math.min(space.cellSize, space.width - x)
      const height = Math.min(space.cellSize, space.height - y)
      if (Math.min(width, height) * viewport.pixelsPerMeter < 10) continue
      cells.push({
        row,
        column,
        count: result.matrix[row][column],
        x: x + width / 2,
        y: y + height / 2,
      })
    }
  return cells
}

/** View transforms operate on SVG coordinates; the underlying project is untouched. */
export function viewTransform(space, { rotation = 0, flipX = false, flipY = false } = {}) {
  const x = space.width / 2,
    y = space.height / 2
  return `translate(${x} ${y}) rotate(${rotation}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1}) translate(${-x} ${-y})`
}

export function transformViewPoint(
  space,
  point,
  { rotation = 0, flipX = false, flipY = false } = {},
  inverse = false,
) {
  const angle = (rotation * Math.PI) / 180
  const cos = Math.cos(angle),
    sin = Math.sin(angle)
  const x = point.x - space.width / 2,
    y = point.y - space.height / 2
  const sx = flipX ? -1 : 1,
    sy = flipY ? -1 : 1
  return inverse
    ? {
        x: (cos * x + sin * y) * sx + space.width / 2,
        y: (-sin * x + cos * y) * sy + space.height / 2,
      }
    : {
        x: cos * x * sx - sin * y * sy + space.width / 2,
        y: sin * x * sx + cos * y * sy + space.height / 2,
      }
}

/** Counter-transform annotations so their text remains readable after rotating or flipping. */
export function uprightTransform(
  x,
  y,
  { rotation = 0, flipX = false, flipY = false } = {},
  world = false,
) {
  return `translate(${x} ${y}) ${world ? 'scale(1 -1)' : ''} scale(${flipX ? -1 : 1} ${flipY ? -1 : 1}) rotate(${-rotation})`
}
