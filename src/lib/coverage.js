import { inspectPoint } from './geometry.js'
/** Midpoint quadrature; boundary cells carry their real area.
 * Zero-thickness walls do not subtract floor area. */
export function calculateCoverage(project) {
  const { space, cameras, walls } = project,
    step = space.cellSize
  const columns = Math.ceil(space.width / step),
    rows = Math.ceil(space.height / step)
  const matrix = [],
    perCamera = cameras.map((camera) => ({ id: camera.id, area: 0, exclusiveArea: 0 }))
  let coveredArea = 0,
    overlapArea = 0,
    coveredCells = 0,
    overlapCells = 0
  for (let row = 0; row < rows; row++) {
    const values = [],
      height = Math.min(step, space.height - row * step)
    for (let column = 0; column < columns; column++) {
      const width = Math.min(step, space.width - column * step),
        area = width * height
      const point = { x: column * step + width / 2, y: row * step + height / 2 },
        visible = []
      for (let index = 0; index < cameras.length; index++)
        if (inspectPoint(cameras[index], point, walls).visible) {
          visible.push(index)
          perCamera[index].area += area
        }
      const count = visible.length
      if (count > 0) {
        coveredArea += area
        coveredCells++
      }
      if (count > 1) {
        overlapArea += area
        overlapCells++
      }
      if (count === 1) perCamera[visible[0]].exclusiveArea += area
      values.push(count)
    }
    matrix.push(values)
  }
  const totalArea = space.width * space.height,
    blindArea = Math.max(0, totalArea - coveredArea)
  return {
    matrix,
    columns,
    rows,
    totalCells: columns * rows,
    coveredCells,
    overlapCells,
    blindCells: columns * rows - coveredCells,
    totalArea,
    coveredArea,
    blindArea,
    overlapArea,
    exclusiveArea: coveredArea - overlapArea,
    coverage: (coveredArea / totalArea) * 100,
    blind: (blindArea / totalArea) * 100,
    overlap: (overlapArea / totalArea) * 100,
    cameraCount: cameras.length,
    perCamera,
  }
}
/** Consecutive cells of a class become one rectangle to keep SVG lightweight. */
export function matrixPaths(result, space) {
  const paths = ['', '', '']
  result.matrix.forEach((row, r) => {
    let start = 0
    while (start < row.length) {
      const kind = Math.min(2, row[start])
      let end = start + 1
      while (end < row.length && Math.min(2, row[end]) === kind) end++
      const x = start * space.cellSize,
        y = r * space.cellSize
      const w = Math.min(space.width, end * space.cellSize) - x,
        h = Math.min(space.cellSize, space.height - y)
      paths[kind] += `M${x},${y}h${w}v${h}h${-w}z`
      start = end
    }
  })
  return paths
}
