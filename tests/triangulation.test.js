import test from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateTriangulation,
  initialTriangulation,
  inspectMeasurementSight,
  solveTriangle,
  triangulateAngles,
  triangulatePoint,
} from '../src/lib/triangulation.js'
import { inspectPoint } from '../src/lib/geometry.js'
import { SCENARIOS } from '../src/lib/project.js'
import { describeTriangulation } from '../src/lib/export.js'

const near = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`)
const a = { id: 'a', name: 'Cámara A', x: 0, y: 0, angle: 45, fov: 100, range: 20 }
const b = { ...a, id: 'b', name: 'Cámara B', x: 6, angle: 135 }
const project = { space: { width: 12, height: 10 }, cameras: [a, b], walls: [] }

test('la base 6 m y ángulos 53,1301° reconstruyen el triángulo 5–5–6', () => {
  const r = solveTriangle(6, 53.1301, 53.1301)
  near(r.gamma, 73.7398)
  near(r.ap, 5, 1e-6)
  near(r.bp, 5, 1e-6)
  near(r.cosineBase, 6)
  assert.equal(r.consistent, true)
})

test('los ángulos opuestos no se intercambian en el triángulo escaleno 3–4–5', () => {
  const r = triangulatePoint({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 })
  near(r.phi1, 90)
  near(r.ap, 3)
  near(r.bp, 5)
  near(r.cosineBase, 4)
  near(r.reconstructionError, 0)
})

test('la ley de cosenos también verifica un triángulo obtuso', () => {
  const r = triangulatePoint(a, b, { x: -2, y: 4 })
  assert.ok(r.phi1 > 90)
  near(r.ap, Math.sqrt(20))
  near(r.bp, Math.sqrt(80))
  near(r.point.x, -2)
  near(r.point.y, 4)
  near(r.cosineBase, 6)
})

test('se rechazan bases nulas, no finitas y ángulos inválidos o casi degenerados', () => {
  for (const base of [0, -1, 1e-10, NaN, Infinity, '6'])
    assert.throws(() => solveTriangle(base, 50, 50), RangeError)
  for (const [first, second] of [
    [0, 45],
    [-1, 50],
    [180, 1],
    [90, 90],
    [100, 90],
    [0.001, 50],
    [90, 89.999],
    [NaN, 50],
    [50, Infinity],
    ['53', 50],
  ])
    assert.throws(() => solveTriangle(6, first, second), RangeError)
})

test('el cálculo conserva consistencia en triángulos estrechos y advierte su sensibilidad', () => {
  const r = solveTriangle(6, 89.99, 89.99)
  assert.equal(r.narrow, true)
  assert.equal(r.consistent, true)
  assert.ok(Number.isFinite(r.ap))
  near(r.cosineBase, 6)
})

test('dos cámaras coincidentes o P sobre la base no definen una triangulación', () => {
  assert.throws(() => triangulatePoint(a, a, { x: 3, y: 4 }), /coinciden/)
  for (const point of [a, b, { x: 3, y: 0 }, { x: 9, y: 0 }])
    assert.throws(() => triangulatePoint(a, b, point), RangeError)
  assert.throws(() => triangulatePoint(a, b, { x: NaN, y: 4 }), RangeError)
})

test('los lados elegidos producen las dos soluciones reflejadas de los mismos ángulos', () => {
  const left = triangulateAngles(a, b, 53.1301, 53.1301, 'left')
  const right = triangulateAngles(a, b, 53.1301, 53.1301, 'right')
  near(left.point.x, 3)
  near(left.point.y, 4, 1e-6)
  near(right.point.x, 3)
  near(right.point.y, -4, 1e-6)
  near(left.ap, right.ap)
  assert.throws(() => triangulateAngles(a, b, 50, 50, 'invalid'), RangeError)
})

test('la triangulación funciona con base vertical y trasladada, e intercambiar A y B conserva P', () => {
  const first = { x: 7, y: -3 },
    second = { x: 7, y: 3 },
    point = { x: 3, y: 0 }
  for (const [start, end] of [
    [first, second],
    [second, first],
  ]) {
    const r = triangulatePoint(start, end, point)
    near(r.base, 6)
    near(r.ap, 5)
    near(r.bp, 5)
    near(r.point.x, point.x)
    near(r.point.y, point.y)
  }
})

test('medir una esquina admite contacto en P pero detecta obstáculos anteriores', () => {
  const point = { x: 3, y: 4 }
  const corner = { a: point, b: { x: 3, y: 8 } }
  assert.equal(inspectMeasurementSight(a, point, [corner]).visible, true)
  assert.equal(inspectPoint(a, point, [corner]).blocked, true, 'cobertura conserva su semántica')
  const blocker = { a: { x: 1.5, y: 0 }, b: { x: 1.5, y: 5 } }
  assert.equal(inspectMeasurementSight(a, point, [corner, blocker]).blocked, true)
  assert.equal(inspectMeasurementSight(a, point, [{ a, b: { x: -1, y: 0 } }]).blocked, false)
})

test('los ángulos de medición admiten coma decimal, conservan precisión y validan borrados', () => {
  const settings = {
    ...initialTriangulation(project),
    mode: 'angles',
    angleA: '53,1301',
    angleB: '53.1301',
  }
  const r = evaluateTriangulation(project, settings, null)
  assert.equal(r.valid, true)
  near(r.ap, 5, 1e-6)
  for (const angleA of ['', ' ', 'nada', '1,2,3', 'Infinity'])
    assert.equal(evaluateTriangulation(project, { ...settings, angleA }, null).valid, false)
})

test('las mediciones siguen el extremo de pared y fallan claramente si se elimina', () => {
  const wall = { id: 'w1', a: { x: 3, y: 4 }, b: { x: 3, y: 8 } }
  const settings = { ...initialTriangulation(project), target: 'wall:w1:a' }
  const p = { ...project, walls: [wall] }
  near(evaluateTriangulation(p, settings, null).ap, 5)
  near(
    evaluateTriangulation({ ...p, walls: [{ ...wall, a: { x: 3, y: 5 } }] }, settings, null).ap,
    Math.sqrt(34),
  )
  assert.match(evaluateTriangulation(project, settings, null).error, /ya no existe/)
})

test('cámaras eliminadas, repetidas o ausentes no dejan un triángulo obsoleto', () => {
  const settings = initialTriangulation(project)
  assert.equal(
    evaluateTriangulation({ ...project, cameras: [a] }, settings, { x: 3, y: 4 }).valid,
    false,
  )
  assert.equal(evaluateTriangulation(project, { ...settings, bId: a.id }, null).valid, false)
  assert.equal(evaluateTriangulation({ ...project, cameras: [] }, settings, null).valid, false)
})

test('un punto fuera del recinto o de la apertura puede ser geométricamente válido sin ser observable', () => {
  const settings = { ...initialTriangulation(project), mode: 'angles', side: 'right' }
  const r = evaluateTriangulation(project, settings, null)
  assert.equal(r.valid, true)
  assert.equal(r.insideRoom, false)
  assert.equal(r.sightA.visible, false)
  assert.equal(r.consistent, true)
})

test('mover cámaras recalcula la base y las distancias sin modificar el proyecto', () => {
  const before = structuredClone(project)
  const settings = { ...initialTriangulation(project), mode: 'angles' }
  const first = evaluateTriangulation(project, settings, null)
  const second = evaluateTriangulation(
    { ...project, cameras: [a, { ...b, x: 12 }] },
    settings,
    null,
  )
  near(second.base, first.base * 2)
  near(second.ap, first.ap * 2)
  assert.deepEqual(project, before)
})

test('el ejemplo incluido permite observar y medir la esquina con base 6 m y distancias 5 m', () => {
  const demo = SCENARIOS.find((scenario) => scenario.id === 'triangulation').project
  const result = evaluateTriangulation(demo, initialTriangulation(demo), null)
  assert.equal(result.valid, true)
  near(result.base, 6)
  near(result.ap, 5)
  near(result.bp, 5)
  assert.equal(result.sightA.visible, true)
  assert.equal(result.sightB.visible, true)
  near(result.point.x, 5)
  near(result.point.y, 6)
  const report = describeTriangulation(result)
  assert.match(report, /AP = .* = 5\.000000 m/)
  assert.match(report, /Ley de cosenos/)
  assert.equal(describeTriangulation({ valid: false }), '')
})

test('el límite de 0,01° se admite pese al redondeo binario de la suma angular', () => {
  const result = solveTriangle(6, 90, 89.99)
  assert.equal(result.consistent, true)
  near(result.gamma, 0.01)
})
