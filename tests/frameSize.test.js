import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateDrawingFrame,
  DEFAULT_FRAME_SETTINGS,
  normalizeFrameSettings,
} from '../src/lib/frameSize.js'
const space = { width: 16, height: 12 }
const desktop = {
  width: 1380,
  viewportWidth: 1440,
  viewportHeight: 1000,
  inspectorWidth: 310,
  gap: 26,
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`)

test('el marco manual es vertical y mantiene separado el inspector', () => {
  const frame = calculateDrawingFrame(space, desktop, { scale: 100 })
  assert.ok(frame.drawingHeight > frame.drawingWidth)
  near(frame.gridWidth - frame.drawingWidth, desktop.inspectorWidth + desktop.gap)
  assert.ok(frame.gridWidth <= desktop.width)
})
test('la escala manual reduce ambos lados proporcionalmente en escritorio', () => {
  const original = calculateDrawingFrame(space, desktop, { scale: 100 })
  const reduced = calculateDrawingFrame(space, desktop, { scale: 60 })
  near(reduced.drawingWidth, original.drawingWidth * 0.6)
  near(reduced.drawingHeight, original.drawingHeight * 0.6)
})
test('la altura de pantalla y las dimensiones físicas no alteran la escala elegida', () => {
  const a = calculateDrawingFrame(space, desktop, { scale: 95 })
  const b = calculateDrawingFrame(
    { width: 40, height: 4 },
    { ...desktop, viewportHeight: 400 },
    { scale: 95 },
  )
  assert.deepEqual(a, b)
  assert.equal(a.effectiveScale, 95)
})
test('las preferencias antiguas migran a escala manual sin ajuste automático', () => {
  assert.deepEqual(normalizeFrameSettings({ scale: 80, fitToScreen: true }), { scale: 80 })
})
test('en móvil los controles conservan el ancho y la escala modifica la altura', () => {
  const mobile = { ...desktop, width: 345, viewportWidth: 390 }
  const full = calculateDrawingFrame(space, mobile, { scale: 100 })
  const small = calculateDrawingFrame(space, mobile, { scale: 60 })
  near(small.drawingWidth, 345)
  near(full.drawingHeight, 345 * 1.06)
  near(small.drawingHeight, full.drawingHeight * 0.6)
})
test('las preferencias inválidas vuelven a límites seguros', () => {
  assert.deepEqual(normalizeFrameSettings(null), DEFAULT_FRAME_SETTINGS)
  assert.deepEqual(normalizeFrameSettings({ scale: NaN }), DEFAULT_FRAME_SETTINGS)
  assert.equal(normalizeFrameSettings({ scale: -10 }).scale, 60)
  assert.equal(normalizeFrameSettings({ scale: 500 }).scale, 100)
})

test('el editor integrado reserva solo el ancho de parámetros, sin separación entre vistas', () => {
  const frame = calculateDrawingFrame(
    space,
    { ...desktop, inspectorWidth: 300, gap: 0 },
    { scale: 95 },
  )
  near(frame.gridWidth - frame.drawingWidth, 300)
  assert.equal(frame.effectiveScale, 95)
})
