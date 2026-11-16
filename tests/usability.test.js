import test from 'node:test'
import assert from 'node:assert/strict'
import { clone, SCENARIOS, validateProject } from '../src/lib/project.js'
import { prepareProject, upsertProject, workspaceReducer } from '../src/lib/workspace.js'
import {
  mergeWorkspace,
  WorkspaceConflict,
  loadWorkspace,
  saveWorkspace,
} from '../src/lib/storage.js'
import { coverageKey } from '../src/lib/coverageInput.js'
import { initialTriangulation } from '../src/lib/triangulation.js'
const date = '2026-11-16T12:00:00.000Z'
const project = (id = 'one') => prepareProject(clone(SCENARIOS[0].project), { id })
const entry = (p) => upsertProject([], p, date, true)[0]

test('editar una medición nueva usa el mismo formato que guardar y recargar', () => {
  const p = project()
  const state = { project: p, library: [entry(p)], active: true, past: [], future: [] }
  const edited = workspaceReducer(state, {
    type: 'edit',
    value: { ...p, measurement: { ...initialTriangulation(p), enabled: true } },
    savedAt: date,
  })
  assert.deepEqual(edited.project, validateProject(edited.project))
  assert.equal(edited.project.measurement.probe, null)
})

test('guardar una medición antigua sin probe no simula otra pestaña al volver a editar', (t) => {
  storage(t)
  const p = { ...project(), measurement: { ...initialTriangulation(project()), enabled: true } }
  const base = { project: p, library: [entry(p)] }
  saveWorkspace(p, base.library)
  const remote = loadWorkspace()
  const changed = { ...p, measurement: { ...p.measurement, angleA: '54' } }
  const merged = mergeWorkspace(base, { project: changed, library: [entry(changed)] }, remote)
  assert.equal(merged.project.measurement.angleA, '54')
})

test('eliminar una cámara o pared normaliza referencias de medición antes del preguardado', () => {
  const p = project()
  p.measurement = { ...initialTriangulation(p), target: `wall:${p.walls[0].id}:a` }
  const state = { project: p, library: [entry(p)], active: true, past: [], future: [] }
  const edited = workspaceReducer(state, {
    type: 'edit',
    value: { ...p, cameras: p.cameras.slice(1), walls: [] },
    savedAt: date,
  })
  assert.deepEqual(edited.project, validateProject(edited.project))
  assert.equal(edited.project.measurement.target, 'probe')
})
function storage(t) {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
    values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v) },
  })
  t.after(() => {
    if (old) Object.defineProperty(globalThis, 'localStorage', old)
    else delete globalThis.localStorage
  })
  return values
}
test('un proyecto activo inválido no oculta una biblioteca sana', (t) => {
  storage(t)
  const p = project()
  localStorage.setItem(
    'optivision.workspace.v1',
    JSON.stringify({ version: 1, project: { broken: true }, library: [entry(p)] }),
  )
  const state = loadWorkspace()
  assert.equal(state.project.id, p.id)
  assert.equal(state.library.length, 1)
  assert.equal(state.recovered, true)
})
test('se recuperan nombres antiguos con espacios sin inventar geometría', (t) => {
  storage(t)
  const p = project()
  p.name = '   '
  p.cameras[0].name = ' '
  localStorage.setItem(
    'optivision.workspace.v1',
    JSON.stringify({ version: 1, project: p, library: [entry(p)] }),
  )
  const state = loadWorkspace()
  assert.equal(state.project.name, 'Proyecto recuperado')
  assert.equal(state.project.cameras[0].name, 'Cámara 01')
  assert.deepEqual(state.project.walls, p.walls)
  assert.equal(state.library.length, 1)
})
test('el guardado rechaza nombres inválidos en vez de persistirlos', (t) => {
  storage(t)
  const p = project()
  p.name = ' '
  assert.throws(() => saveWorkspace(p, []))
  assert.equal(loadWorkspace(), null)
})
test('se conserva el último guardado si la recuperación de una fila está dañada', (t) => {
  storage(t)
  const p = project(),
    row = entry(p)
  row.project = { broken: true }
  localStorage.setItem(
    'optivision.workspace.v1',
    JSON.stringify({ version: 1, project: p, library: [row] }),
  )
  assert.deepEqual(loadWorkspace().library[0].project, p)
})
test('escribir un proyecto no elimina entradas creadas en otra pestaña', () => {
  const a = project('a'),
    b = project('b')
  const base = { project: a, library: [entry(a)] }
  const changed = { ...a, name: 'A editado' }
  const remote = { project: b, library: [entry(a), entry(b)] }
  const merged = mergeWorkspace(base, { project: changed, library: [entry(changed)] }, remote, {
    writeIds: ['a'],
  })
  assert.equal(merged.library.length, 2)
  assert.equal(merged.library.find((e) => e.id === 'b').project.name, b.name)
})
test('las ediciones simultáneas del mismo proyecto producen conflicto', () => {
  const p = project(),
    base = { project: p, library: [entry(p)] }
  const local = { ...p, name: 'Mi versión' },
    other = { ...p, name: 'Otra pestaña' }
  assert.throws(
    () =>
      mergeWorkspace(
        base,
        { project: local, library: [entry(local)] },
        { project: other, library: [entry(other)] },
        { writeIds: [p.id] },
      ),
    WorkspaceConflict,
  )
})
test('el orden de claves de JSON no crea falsos conflictos', () => {
  const p = project(),
    base = { project: p, library: [entry(p)] }
  const remoteProject = validateProject(p),
    edited = { ...p, name: 'Cambio' }
  assert.equal(
    mergeWorkspace(
      base,
      { project: edited, library: [entry(edited)] },
      { project: remoteProject, library: [entry(remoteProject)] },
    ).project.name,
    'Cambio',
  )
})
test('una eliminación solo afecta la identidad solicitada', () => {
  const a = project('a'),
    b = project('b'),
    c = project('c')
  const base = { project: a, library: [entry(a), entry(b)] }
  const merged = mergeWorkspace(
    base,
    { project: a, library: [entry(a)] },
    { project: c, library: [entry(a), entry(b), entry(c)] },
    { writeIds: ['b'] },
  )
  assert.deepEqual(merged.library.map((e) => e.id).sort(), ['a', 'c'])
})
test('medición y referencia sobreviven JSON y almacenamiento', (t) => {
  storage(t)
  const p = project()
  p.measurement = {
    enabled: true,
    aId: 'c1',
    bId: 'c2',
    mode: 'angles',
    target: 'wall:w1:a',
    angleA: '53.1301',
    angleB: '53.1301',
    side: 'left',
    probe: { x: 3, y: 4 },
  }
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))), p)
  saveWorkspace(p, [entry(p)])
  assert.deepEqual(loadWorkspace().project.measurement, p.measurement)
})
test('las referencias de medición retiradas vuelven a opciones válidas', () => {
  const p = project()
  p.measurement = {
    aId: 'deleted',
    bId: 'deleted',
    target: 'wall:deleted:a',
    probe: { x: 100, y: -3 },
  }
  const m = validateProject(p).measurement
  assert.equal(m.aId, 'c1')
  assert.equal(m.bId, 'c2')
  assert.equal(m.target, 'probe')
  assert.deepEqual(m.probe, { x: 16, y: 0 })
})
test('el historial agrupa un arrastre, conserva el guardado y permite rehacer', () => {
  const p = project()
  let state = { project: p, library: [entry(p)], active: true, past: [], future: [] }
  state = workspaceReducer(state, {
    type: 'edit',
    group: 'drag:c1:1',
    time: 1,
    savedAt: date,
    value: { ...p, name: 'Uno' },
  })
  state = workspaceReducer(state, {
    type: 'edit',
    group: 'drag:c1:1',
    time: 2000,
    savedAt: date,
    value: (v) => ({ ...v, name: 'Dos' }),
  })
  assert.equal(state.past.length, 1)
  state = workspaceReducer(state, { type: 'undo', savedAt: date })
  assert.equal(state.project.name, p.name)
  state = workspaceReducer(state, { type: 'redo', savedAt: date })
  assert.equal(state.project.name, 'Dos')
  assert.deepEqual(state.library[0].savedProject, p)
})
test('editar después de deshacer elimina la rama anterior de rehacer', () => {
  const p = project()
  let state = { project: p, library: [entry(p)], active: true }
  state = workspaceReducer(state, { type: 'edit', savedAt: date, value: { ...p, name: 'Uno' } })
  state = workspaceReducer(state, { type: 'undo', savedAt: date })
  state = workspaceReducer(state, {
    type: 'edit',
    savedAt: date,
    value: { ...p, name: 'Otra rama' },
  })
  assert.deepEqual(state.future, [])
})
test('renombrar, recolorear o medir no obliga a recalcular cobertura', () => {
  const p = project(),
    key = coverageKey(p)
  const next = {
    ...p,
    name: 'Otro nombre',
    cameras: p.cameras.map((c) => ({ ...c, name: 'Nombre', color: '#ffffff' })),
    measurement: { probe: { x: 2, y: 3 } },
  }
  assert.equal(coverageKey(next), key)
  next.cameras[0].angle += 1
  assert.notEqual(coverageKey(next), key)
})
