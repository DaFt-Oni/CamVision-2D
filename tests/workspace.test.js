import test from 'node:test'
import assert from 'node:assert/strict'
import { clone, SCENARIOS, validateProject } from '../src/lib/project.js'
import { prepareProject, upsertProject, workspaceReducer } from '../src/lib/workspace.js'
import { loadWorkspace, saveWorkspace } from '../src/lib/storage.js'
const savedAt = '2026-11-02T22:00:00.000Z'
const blank = () =>
  prepareProject(
    { ...clone(SCENARIOS[3].project), name: '' },
    { id: 'new-project', now: new Date(savedAt) },
  )

test('el escenario en blanco recibe identidad y nombre por defecto antes de editar', () => {
  const project = blank()
  assert.equal(project.id, 'new-project')
  assert.ok(project.name.startsWith('Proyecto '))
  assert.equal(project.icon, 'folder')
  assert.equal(project.color, '#315b91')
  assert.deepEqual(validateProject(project), project)
})
test('abrir un ejemplo crea una identidad nueva y no modifica la plantilla', () => {
  const template = clone(SCENARIOS[0].project)
  const first = prepareProject(template, { fresh: true, id: 'one' })
  const second = prepareProject(first, { fresh: true, id: 'two' })
  assert.equal(first.id, 'one')
  assert.equal(second.id, 'two')
  assert.deepEqual(template, SCENARIOS[0].project)
  assert.equal(prepareProject(first, { id: 'unused' }).id, 'one')
})
test('los preguardados actualizan una entrada y no generan duplicados', () => {
  const project = blank()
  let library = upsertProject([], project, savedAt)
  library = upsertProject(library, { ...project, name: 'Editado' }, savedAt)
  assert.equal(library.length, 1)
  assert.equal(library[0].draft, true)
  assert.equal(library[0].project.name, 'Editado')
  library = upsertProject(library, project, savedAt, true)
  library = upsertProject(library, { ...project, name: 'Otro cambio' }, savedAt)
  assert.equal(library[0].draft, false)
  assert.equal(library.length, 1)
})
test('al salir se conservan nombre, icono, color y la geometría más reciente', () => {
  let state = { project: blank(), library: [], active: false }
  state = workspaceReducer(state, { type: 'begin', project: state.project, savedAt })
  state = workspaceReducer(state, {
    type: 'edit',
    value: (p) => ({ ...p, space: { ...p.space, width: 14 } }),
    savedAt,
  })
  assert.equal(state.library[0].project.space.width, 14)
  assert.equal(state.library[0].draft, true)
  state = workspaceReducer(state, {
    type: 'finish',
    identity: { name: 'Laboratorio', icon: 'camera', color: '#27786b' },
    savedAt,
  })
  assert.equal(state.active, false)
  assert.equal(state.library.length, 1)
  assert.equal(state.library[0].draft, false)
  assert.equal(state.library[0].project.name, 'Laboratorio')
  assert.equal(state.library[0].project.icon, 'camera')
  assert.equal(state.library[0].project.color, '#27786b')
  assert.equal(state.library[0].project.space.width, 14)
})
test('reabrir un guardado conserva su identidad y no altera las otras copias', () => {
  const project = blank()
  const other = { ...project, id: 'other', name: 'Otra sala' }
  let state = {
    project,
    active: false,
    library: upsertProject(upsertProject([], other, savedAt, true), project, savedAt, true),
  }
  state = workspaceReducer(state, { type: 'begin', project, savedAt })
  state = workspaceReducer(state, {
    type: 'edit',
    value: (p) => ({ ...p, name: 'Sala nueva' }),
    savedAt,
  })
  assert.equal(state.library.length, 2)
  assert.equal(state.library.find((e) => e.id === 'other').project.name, 'Otra sala')
  assert.equal(state.library.find((e) => e.id === project.id).draft, false)
})
test('un preguardado se recupera desde almacenamiento sin finalizar la sesión', (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
  })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else delete globalThis.localStorage
  })
  let state = { project: blank(), library: [], active: false }
  state = workspaceReducer(state, { type: 'begin', project: state.project, savedAt })
  state = workspaceReducer(state, {
    type: 'edit',
    value: (p) => ({ ...p, space: { ...p.space, height: 16 } }),
    savedAt,
  })
  saveWorkspace(state.project, state.library)
  const recovered = loadWorkspace()
  assert.deepEqual(recovered.project, state.project)
  assert.deepEqual(recovered.library, state.library)
  assert.equal(recovered.library[0].draft, true)
  assert.equal(recovered.library[0].project.space.height, 16)
  // One damaged library row must not erase the current workspace or healthy saved projects.
  const data = JSON.parse(values.get('optivision.workspace.v1'))
  data.library.push({ id: 'broken', project: {} })
  values.set('optivision.workspace.v1', JSON.stringify(data))
  assert.equal(loadWorkspace().library.length, 1)
})
test('la validación mantiene compatibilidad con proyectos antiguos y rechaza metadatos inválidos', () => {
  assert.deepEqual(validateProject(SCENARIOS[0].project), SCENARIOS[0].project)
  for (const values of [{ icon: 'unknown' }, { color: 'red' }, { id: '' }])
    assert.throws(() => validateProject({ ...blank(), ...values }))
})

test('una pestaña del menú recibe cambios sin interrumpir una sesión activa', () => {
  const initial = { project: blank(), library: [], active: false }
  const update = {
    project: { ...initial.project, name: 'Actualizado' },
    library: upsertProject([], initial.project, savedAt),
  }
  const synced = workspaceReducer(initial, { type: 'sync', value: update })
  assert.equal(synced.project.name, 'Actualizado')
  assert.equal(synced.library.length, 1)
  const editing = { ...initial, active: true }
  assert.equal(workspaceReducer(editing, { type: 'sync', value: update }), editing)
})
