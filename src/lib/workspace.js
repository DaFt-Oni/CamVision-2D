import { clone, PROJECT_ICONS, PROJECT_COLORS, uid } from './project.js'

export function prepareProject(value, { fresh = false, now = new Date(), id = uid() } = {}) {
  return {
    ...clone(value),
    id: fresh ? id : value.id || id,
    name:
      value.name?.trim() ||
      `Proyecto ${now.toLocaleDateString('es-CL')} ${now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`,
    icon: PROJECT_ICONS.includes(value.icon) ? value.icon : 'folder',
    color: /^#[0-9a-f]{6}$/i.test(value.color || '') ? value.color : PROJECT_COLORS[0],
  }
}

/** One row per project: editing a saved project updates it without creating duplicates. */
export function upsertProject(library, project, savedAt, confirmed = false) {
  const existing = library.find((entry) => entry.id === project.id)
  return [
    {
      id: project.id,
      savedAt,
      draft: confirmed ? false : (existing?.draft ?? true),
      project: clone(project),
    },
    ...library.filter((entry) => entry.id !== project.id),
  ]
}

export function workspaceReducer(state, action) {
  if (action.type === 'sync') return state.active ? state : { ...state, ...action.value }
  if (action.type === 'begin') {
    return {
      project: action.project,
      active: true,
      library: upsertProject(state.library, action.project, action.savedAt),
    }
  }
  if (action.type === 'edit') {
    const project = typeof action.value === 'function' ? action.value(state.project) : action.value
    return {
      ...state,
      project,
      library: state.active ? upsertProject(state.library, project, action.savedAt) : state.library,
    }
  }
  if (action.type === 'save' || action.type === 'finish') {
    const project = { ...state.project, ...action.identity }
    return {
      project,
      active: action.type === 'finish' ? false : state.active,
      library: upsertProject(state.library, project, action.savedAt, true),
    }
  }
  if (action.type === 'library') {
    return {
      ...state,
      library: typeof action.value === 'function' ? action.value(state.library) : action.value,
    }
  }
  return state
}
