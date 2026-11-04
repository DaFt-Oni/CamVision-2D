import test from 'node:test'
import assert from 'node:assert/strict'
import {
  angleDifference,
  degrees,
  directionVector,
  fieldWidth,
  inspectPoint,
  intersectionParameter,
  isBlocked,
  normalizeAngle,
  radians,
  visibilityPolygon,
} from '../src/lib/geometry.js'
import { calculateCoverage } from '../src/lib/coverage.js'
import { clone, resizeProject, SCENARIOS, validateProject } from '../src/lib/project.js'

const near = (a, b, error = 1e-7) => assert.ok(Math.abs(a - b) < error, `${a} ≠ ${b}`)
const c = (changes = {}) => ({
  id: 'c1',
  name: 'Cámara 01',
  color: '#27786b',
  x: 0,
  y: 0,
  angle: 45,
  fov: 90,
  range: 6,
  ...changes,
})
const p = (changes = {}) => ({
  name: 'Prueba',
  space: { width: 10, height: 8, cellSize: 0.25 },
  cameras: [c()],
  walls: [],
  ...changes,
})
const wall = { id: 'wall1', a: { x: 2, y: 0 }, b: { x: 2, y: 6 } }

test('grados y radianes se convierten sin perder la orientación', () => {
  near(radians(180), Math.PI)
  near(degrees(Math.PI / 2), 90)
})
test('normalización y diferencia mínima cruzan 0°/360°', () => {
  assert.equal(normalizeAngle(-10), 350)
  assert.equal(normalizeAngle(720), 0)
  assert.equal(angleDifference(359, 1), -2)
  assert.equal(angleDifference(1, 359), 2)
  near(angleDifference(-720, 1080), 0)
})
test('vectores unitarios respetan el sistema cartesiano', () => {
  near(directionVector(0).x, 1)
  near(directionVector(90).y, 1)
  near(directionVector(270).y, -1)
  for (const angle of [0, 35, 90, 180, 325]) {
    const v = directionVector(angle)
    near(Math.hypot(v.x, v.y), 1)
  }
})
test('ancho trigonométrico a distancia axial: 6 m y 90° → 12 m', () => near(fieldWidth(6, 90), 12))
test('el origen de la cámara pertenece a su cobertura', () =>
  assert.ok(inspectPoint(c(), { x: 0, y: 0 }).visible))
test('los límites exactos de alcance y apertura están incluidos', () => {
  assert.ok(inspectPoint(c(), { x: 6, y: 0 }).visible)
  assert.ok(inspectPoint(c(), { x: 0, y: 6 }).visible)
  assert.equal(inspectPoint(c(), { x: 6.01, y: 0 }).visible, false)
  assert.equal(inspectPoint(c(), { x: -0.01, y: 4 }).visible, false)
})
test('apertura que cruza el cero incluye puntos a ambos lados', () => {
  const camera = c({ x: 5, y: 5, angle: 359, fov: 10 })
  assert.ok(inspectPoint(camera, { x: 6, y: 5.01 }).visible)
  assert.ok(inspectPoint(camera, { x: 6, y: 4.96 }).visible)
  assert.equal(inspectPoint(camera, { x: 5, y: 6 }).visible, false)
})
test('atan2 diferencia correctamente todos los cuadrantes', () => {
  for (const [point, bearing] of [
    [{ x: 1, y: 1 }, 45],
    [{ x: -1, y: 1 }, 135],
    [{ x: -1, y: -1 }, 225],
    [{ x: 1, y: -1 }, 315],
  ])
    near(inspectPoint(c(), point).bearing, bearing)
})
test('pared intermedia bloquea; pared detrás del punto no bloquea', () => {
  assert.ok(isBlocked(c(), { x: 4, y: 3 }, [wall]))
  assert.equal(isBlocked(c(), { x: 1, y: 1 }, [wall]), false)
  assert.equal(inspectPoint(c(), { x: 4, y: 3 }, [wall]).visible, false)
})
test('intersección detecta contacto en extremos de pared y destino', () => {
  assert.ok(isBlocked({ x: 0, y: 0 }, { x: 4, y: 0 }, [wall]))
  assert.ok(isBlocked({ x: 0, y: 0 }, { x: 2, y: 1 }, [wall]))
})
test('segmentos paralelos separados no bloquean; colineales superpuestos sí', () => {
  assert.equal(
    intersectionParameter({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 1 }, { x: 4, y: 1 }),
    null,
  )
  near(intersectionParameter({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }), 0.25)
})
test('segmentos colineales disjuntos no bloquean', () => {
  assert.equal(
    intersectionParameter({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }),
    null,
  )
  assert.equal(
    intersectionParameter({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -3, y: 0 }, { x: -2, y: 0 }),
    null,
  )
})
test('contacto solo en el origen permite montar una cámara en la pared', () => {
  const mounting = { a: { x: 0, y: -2 }, b: { x: 0, y: 2 } }
  assert.equal(isBlocked({ x: 0, y: 0 }, { x: 3, y: 0 }, [mounting]), false)
  assert.equal(
    isBlocked({ x: 0, y: 0 }, { x: 3, y: 0 }, [{ a: { x: -2, y: 0 }, b: { x: 0, y: 0 } }]),
    false,
  )
})
test('sin cámaras: matriz nula, cobertura cero y 100% puntos ciegos', () => {
  const r = calculateCoverage(p({ cameras: [] }))
  assert.equal(r.coverage, 0)
  assert.equal(r.blind, 100)
  assert.equal(r.overlap, 0)
  assert.equal(r.totalCells, 1280)
  assert.ok(r.matrix.flat().every((n) => n === 0))
})
test('escenario académico converge al área del cuarto de círculo', () => {
  const r = calculateCoverage(p())
  near(r.coveredArea, (Math.PI * 6 ** 2) / 4, 0.4)
  near(r.coverage, ((Math.PI * 36) / 4 / 80) * 100, 0.5)
})
test('dos cámaras idénticas duplican conteos, nunca duplican área cubierta', () => {
  const one = calculateCoverage(p()),
    two = calculateCoverage(p({ cameras: [c(), c({ id: 'c2' })] }))
  near(two.coveredArea, one.coveredArea)
  near(two.overlapArea, one.coveredArea)
  assert.ok(two.matrix.flat().every((n) => n === 0 || n === 2))
  near(two.perCamera[0].exclusiveArea, 0)
})
test('la matriz evalúa realmente sombras de paredes', () => {
  const open = calculateCoverage(p()),
    blocked = calculateCoverage(p({ walls: [wall] }))
  assert.ok(blocked.coveredArea < open.coveredArea)
  assert.equal(blocked.matrix[12][16], 0)
})
test('alcance fuera del espacio no suma área exterior', () => {
  const r = calculateCoverage(p({ cameras: [c({ range: 70 })] }))
  near(r.coveredArea, 80)
  near(r.coverage, 100)
  near(r.blindArea, 0)
})
test('celdas parciales ponderadas mantienen el área física total', () => {
  const r = calculateCoverage(
    p({ space: { width: 2.1, height: 2.3, cellSize: 1 }, cameras: [c({ range: 70 })] }),
  )
  assert.equal(r.totalCells, 9)
  near(r.totalArea, 4.83)
  near(r.coveredArea, 4.83)
  near(r.coverage, 100)
})
test('porcentajes y categorías disjuntas son consistentes en todos los escenarios', () => {
  for (const scenario of SCENARIOS) {
    const r = calculateCoverage(scenario.project)
    near(r.coverage + r.blind, 100)
    near(r.exclusiveArea + r.overlapArea + r.blindArea, r.totalArea)
    assert.ok(r.overlap <= r.coverage)
    assert.equal(r.coveredCells + r.blindCells, r.totalCells)
    for (const row of r.matrix)
      for (const n of row) assert.ok(n >= 0 && n <= scenario.project.cameras.length)
  }
})
test('añadir una cámara no reduce la unión de cobertura', () => {
  const a = p(),
    b = p({ cameras: [c(), c({ id: 'c2', x: 10, y: 8, angle: 225 })] })
  assert.ok(calculateCoverage(b).coveredArea >= calculateCoverage(a).coveredArea)
})
test('polígonos visuales están recortados a los límites del espacio', () => {
  const space = p().space
  for (const camera of [
    c({ range: 70 }),
    c({ x: 10, y: 8, angle: 225, range: 70 }),
    c({ angle: 210 }),
  ]) {
    for (const point of visibilityPolygon(camera, space, []))
      assert.ok(point.x >= 0 && point.x <= 10 && point.y >= 0 && point.y <= 8)
  }
})
test('polígono visual termina en el obstáculo al lanzar sus rayos', () => {
  const points = visibilityPolygon(c({ angle: 0, fov: 20 }), p().space, [
    { a: { x: 2, y: -10 }, b: { x: 2, y: 10 } },
  ])
  assert.ok(points.every((point) => point.x <= 2 + 1e-7))
})
test('cambiar dimensiones reubica cámaras y recorta paredes, sin segmentos nulos', () => {
  const resized = resizeProject(SCENARIOS[0].project, { width: 4, height: 3 })
  for (const cam of resized.cameras) assert.ok(cam.x <= 4 && cam.y <= 3)
  for (const w of resized.walls) assert.ok(Math.hypot(w.a.x - w.b.x, w.a.y - w.b.y) > 0.01)
  assert.ok(validateProject(resized))
})
test('todos los escenarios cumplen el contrato de importación', () => {
  for (const scenario of SCENARIOS)
    assert.deepEqual(validateProject(scenario.project), scenario.project)
})
test('importación rechaza valores no finitos, rangos inválidos y cámaras fuera del espacio', () => {
  for (const changes of [
    { x: NaN },
    { range: -1 },
    { fov: 180 },
    { angle: Infinity },
    { x: 11 },
    { color: 'url(x)' },
  ])
    assert.throws(() => validateProject(p({ cameras: [c(changes)] })))
  assert.throws(() => validateProject(p({ space: { width: 0, height: 8, cellSize: 0.25 } })))
  assert.throws(() => validateProject(p({ space: { width: 10, height: 8, cellSize: 0.001 } })))
})
test('importación rechaza identificadores duplicados y paredes degeneradas', () => {
  assert.throws(() => validateProject(p({ cameras: [c(), c()] })))
  assert.throws(() =>
    validateProject(p({ walls: [{ id: 'w1', a: { x: 2, y: 2 }, b: { x: 2, y: 2 } }] })),
  )
  assert.throws(() =>
    validateProject(p({ cameras: Array.from({ length: 17 }, (_, i) => c({ id: `c${i}` })) })),
  )
})
test('las copias guardadas son independientes de la distribución editable', () => {
  const original = p(),
    savedCopy = clone(original)
  original.cameras[0].angle = 270
  original.space.width = 20
  assert.equal(savedCopy.cameras[0].angle, 45)
  assert.equal(savedCopy.space.width, 10)
})
