import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraMath } from '../src/lib/mathematics.js'
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`)
const camera = { x: 1, y: 2, angle: 0, fov: 90, range: 6 }
const space = { width: 10, height: 8 }
test('el desarrollo distingue el extremo teórico del eje bloqueado por una pared', () => {
  const result = cameraMath(camera, space, [{ a: { x: 3, y: 0 }, b: { x: 3, y: 8 } }])
  assert.deepEqual(result.theoretical, { x: 7, y: 2 })
  assert.deepEqual(result.visible, { x: 3, y: 2 })
  near(result.visibleDistance, 2)
  assert.equal(result.clipped, true)
  near(result.width, 12)
})
test('el extremo visible se recorta al recinto sin cambiar el alcance teórico', () => {
  const result = cameraMath({ ...camera, range: 20 }, space, [])
  assert.deepEqual(result.theoretical, { x: 21, y: 2 })
  assert.deepEqual(result.visible, { x: 10, y: 2 })
  near(result.visibleDistance, 9)
  assert.equal(result.clipped, true)
})
test('el desarrollo se recalcula para la cámara editada sin alterar parámetros', () => {
  const input = { ...camera, angle: 90, range: 3, fov: 60 }
  const original = structuredClone(input)
  const result = cameraMath(input, space, [])
  near(result.angleRad, Math.PI / 2)
  near(result.vector.x, 0)
  near(result.vector.y, 1)
  near(result.theoretical.x, 1)
  near(result.theoretical.y, 5)
  near(result.width, 6 * Math.tan(Math.PI / 6))
  assert.equal(result.clipped, false)
  assert.deepEqual(input, original)
})
