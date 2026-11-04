import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createViewport,
  coverageCellAt,
  visibleMatrixCells,
  niceStep,
  transformViewPoint,
} from '../src/lib/viewport.js'
import { calculateCoverage } from '../src/lib/coverage.js'
import { SCENARIOS } from '../src/lib/project.js'

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`)
const project = SCENARIOS[0].project
const result = calculateCoverage(project)

test('el encuadre aprovecha el marco y conserva una misma escala para X e Y', () => {
  const view = createViewport(project.space, { width: 1200, height: 950 })
  const scaleX = 1200 / view.width,
    scaleY = 950 / view.height
  near(scaleX, scaleY)
  assert.ok(project.space.width * scaleX > 1000)
  assert.ok(view.x <= 0 && view.y <= 0)
  assert.ok(view.x + view.width >= project.space.width)
  assert.ok(view.y + view.height >= project.space.height)
})
test('ejes y cámaras conservan tamaños legibles en escritorio y móvil', () => {
  for (const size of [
    { width: 1400, height: 1000 },
    { width: 650, height: 500 },
    { width: 345, height: 395 },
  ]) {
    const view = createViewport(project.space, size)
    near(view.fontSize * view.pixelsPerMeter, 12)
    near(view.markerRadius * view.pixelsPerMeter, 10)
  }
})
test('el zoom amplía el recinto sin deformarlo ni agrandar los iconos', () => {
  const size = { width: 1200, height: 900 }
  const a = createViewport(project.space, size, 1),
    b = createViewport(project.space, size, 2)
  near(b.width, a.width / 2)
  near(b.height, a.height / 2)
  near(b.pixelsPerMeter, a.pixelsPerMeter * 2)
  near(b.markerRadius * b.pixelsPerMeter, 10)
})
test('desplazar la vista cambia su origen, conservando la escala física', () => {
  const size = { width: 900, height: 700 }
  const a = createViewport(project.space, size, 2),
    b = createViewport(project.space, size, 2, { x: 1.25, y: -0.75 })
  near(b.x - a.x, 1.25)
  near(b.y - a.y, -0.75)
  near(b.width, a.width)
  near(b.height, a.height)
})
test('cada celda visual corresponde a la misma fila y columna de la matriz real', () => {
  const cell = coverageCellAt(project.space, result, { x: 4.1, y: 3.6 })
  assert.equal(cell.column, 16)
  assert.equal(cell.row, 14)
  assert.equal(cell.count, result.matrix[14][16])
  near(cell.center.x, 4.125)
  near(cell.center.y, 3.625)
})
test('el origen y los límites físicos seleccionan celdas válidas', () => {
  const bottom = coverageCellAt(project.space, result, { x: 0, y: 0 })
  const top = coverageCellAt(project.space, result, { x: 16, y: 12 })
  assert.equal(bottom.row, 0)
  assert.equal(bottom.column, 0)
  assert.equal(top.row, result.rows - 1)
  assert.equal(top.column, result.columns - 1)
  assert.equal(coverageCellAt(project.space, result, { x: 16.1, y: 1 }), null)
  assert.equal(coverageCellAt(project.space, result, { x: 1, y: -0.1 }), null)
})
test('las celdas parciales se muestran con dimensiones y centros reales', () => {
  const space = { width: 2.1, height: 2.3, cellSize: 1 }
  const matrix = {
    rows: 3,
    columns: 3,
    matrix: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 2],
    ],
  }
  const cell = coverageCellAt(space, matrix, { x: 2.1, y: 2.3 })
  near(cell.width, 0.1)
  near(cell.height, 0.3)
  near(cell.center.x, 2.05)
  near(cell.center.y, 2.15)
  assert.equal(cell.count, 2)
})
test('los números sobre el recinto usan los valores reales, sin extraer otra submatriz', () => {
  const view = createViewport(project.space, { width: 1400, height: 1050 })
  const labels = visibleMatrixCells(project.space, result, view)
  assert.equal(labels.length, result.totalCells)
  for (const label of labels) {
    assert.equal(label.count, result.matrix[label.row][label.column])
    const cell = coverageCellAt(project.space, result, { x: label.x, y: label.y })
    assert.equal(cell.row, label.row)
    assert.equal(cell.column, label.column)
  }
})
test('la densidad de valores se adapta al zoom sin modificar los datos de cobertura', () => {
  const size = { width: 345, height: 395 }
  const tiny = createViewport(project.space, size, 0.5)
  assert.equal(visibleMatrixCells(project.space, result, tiny).length, 0)
  const zoomed = createViewport(project.space, size, 4)
  const visible = visibleMatrixCells(project.space, result, zoomed)
  assert.ok(visible.length > 0 && visible.length < result.totalCells)
  for (const cell of visible) assert.equal(cell.count, result.matrix[cell.row][cell.column])
})
test('las marcas de escala usan pasos claros de 1, 2 o 5 unidades', () => {
  near(niceStep(0.12), 0.2)
  near(niceStep(0.6), 1)
  near(niceStep(1.1), 2)
  near(niceStep(2.1), 5)
  near(niceStep(7), 10)
})

test('girar 90 grados encuadra el recinto vertical con una escala uniforme', () => {
  const space = { width: 16, height: 12 }
  const size = { width: 700, height: 760 }
  const orientation = { rotation: 90 }
  const view = createViewport(space, size, 1, { x: 0, y: 0 }, orientation)
  near(view.pixelsPerMeter, Math.min(588 / 12, 640 / 16))
  for (const x of [0, space.width])
    for (const y of [0, space.height]) {
      const p = transformViewPoint(space, { x, y }, orientation)
      assert.ok(p.x >= view.x - 1e-8 && p.x <= view.x + view.width + 1e-8)
      assert.ok(p.y >= view.y - 1e-8 && p.y <= view.y + view.height + 1e-8)
    }
})
test('la inversa recupera coordenadas físicas tras cualquier giro y volteo', () => {
  for (const rotation of [0, 90, 180, 270])
    for (const flipX of [false, true])
      for (const flipY of [false, true]) {
        const orientation = { rotation, flipX, flipY }
        const point = { x: 3.25, y: 8.7 }
        const rendered = transformViewPoint(project.space, point, orientation)
        const recovered = transformViewPoint(project.space, rendered, orientation, true)
        near(recovered.x, point.x)
        near(recovered.y, point.y)
      }
})
test('los valores visibles de matriz corresponden al área tras girar, voltear y desplazar', () => {
  const orientation = { rotation: 90, flipX: true, flipY: false }
  const view = createViewport(
    project.space,
    { width: 800, height: 900 },
    3,
    { x: 2, y: -1 },
    orientation,
  )
  const labels = visibleMatrixCells(project.space, result, view)
  assert.ok(labels.length > 0 && labels.length < result.totalCells)
  let inside = 0
  for (let row = 0; row < result.rows; row++)
    for (let column = 0; column < result.columns; column++) {
      const cell = coverageCellAt(project.space, result, {
        x: (column + 0.5) * project.space.cellSize,
        y: (row + 0.5) * project.space.cellSize,
      })
      const p = transformViewPoint(
        project.space,
        { x: cell.center.x, y: project.space.height - cell.center.y },
        orientation,
      )
      if (p.x > view.x && p.x < view.x + view.width && p.y > view.y && p.y < view.y + view.height) {
        inside++
        assert.ok(labels.some((label) => label.row === row && label.column === column))
      }
    }
  assert.ok(inside > 0)
  for (const label of labels) assert.equal(label.count, result.matrix[label.row][label.column])
})
