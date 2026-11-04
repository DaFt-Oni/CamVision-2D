import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCoverage } from '../src/lib/coverage.js'
import { rayEndpoint } from '../src/lib/geometry.js'
import { clone, SCENARIOS, validateProject } from '../src/lib/project.js'
import { loadWorkspace, saveWorkspace } from '../src/lib/storage.js'
import { exportMatrix, exportProject, exportReport } from '../src/lib/export.js'

test('eje visual se detiene en pared y en límites del recinto', () => {
  const p = SCENARIOS[1].project
  const c = { ...p.cameras[0], angle: 0, range: 70 }
  assert.deepEqual(rayEndpoint(c, 0, p.space, []), { x: 10, y: 0 })
  assert.deepEqual(rayEndpoint(c, 0, p.space, [{ a: { x: 2, y: 0 }, b: { x: 2, y: 8 } }]), {
    x: 2,
    y: 0,
  })
})

test('persistencia y exportaciones conservan valores reales y validan al restaurar', async (t) => {
  const values = new Map(),
    blobs = [],
    links = []
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => {
        const link = { click() {} }
        links.push(link)
        return link
      },
    },
  })
  t.after(() => {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage)
    else delete globalThis.localStorage
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
    else delete globalThis.document
  })
  t.mock.method(URL, 'createObjectURL', (blob) => {
    blobs.push(blob)
    return 'blob:test'
  })
  t.mock.method(URL, 'revokeObjectURL', () => {})
  const project = clone(SCENARIOS[1].project)
  assert.equal(loadWorkspace(), null)
  saveWorkspace(project, [{ id: 'copy1', savedAt: new Date().toISOString(), project }])
  const restored = loadWorkspace()
  assert.deepEqual(restored.project, project)
  assert.equal(restored.library.length, 1)
  restored.project.cameras[0].angle = 270
  assert.equal(loadWorkspace().project.cameras[0].angle, 45)
  values.set('optivision.workspace.v1', '{invalid')
  assert.equal(loadWorkspace(), null)
  values.set('optivision.workspace.v1', JSON.stringify({ version: 1, project: { invalid: true } }))
  assert.equal(loadWorkspace(), null)
  exportProject(project)
  const json = JSON.parse(await blobs[0].text())
  assert.equal(json.format, 'camvision')
  assert.deepEqual(validateProject(json.project), project)
  assert.deepEqual(Object.keys(json).sort(), ['exportedAt', 'format', 'project', 'version'])
  assert.equal(links[0].download, 'camvision-proyecto.json')
  const result = calculateCoverage(project)
  exportMatrix(project, result)
  const lines = (await blobs[1].text()).trim().split('\n')
  assert.equal(lines.length, result.totalCells + 1)
  const first = lines[1].split(',').map(Number)
  assert.deepEqual(first, [1, 1, 0.125, 0.125, 0.0625, result.matrix[0][0]])
  const partialProject = { ...project, space: { width: 2.1, height: 2.3, cellSize: 1 } }
  const partial = calculateCoverage(partialProject)
  exportMatrix(partialProject, partial)
  const last = (await blobs[2].text()).trim().split('\n').at(-1).split(',').map(Number)
  assert.ok(Math.abs(last[4] - 0.03) < 1e-9)
  exportReport(project, result)
  const report = await blobs[3].text()
  assert.ok(report.includes(result.coverage.toFixed(2)))
  assert.ok(report.includes('Cámara 01'))
  assert.ok(report.includes('Vectores') || report.includes('Vector unitario'))
  assert.ok(report.includes('centros de celda'))
  assert.ok(report.includes('2d tan(α/2)'))
})

test('fallo del almacenamiento no produce una restauración parcial', (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Storage bloqueado')
    },
  })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else delete globalThis.localStorage
  })
  assert.equal(loadWorkspace(), null)
  assert.throws(() => saveWorkspace(SCENARIOS[0].project, []), /Storage bloqueado/)
})
