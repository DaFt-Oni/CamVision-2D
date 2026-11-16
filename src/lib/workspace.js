import { clone, PROJECT_ICONS, PROJECT_COLORS, SCENARIOS, uid } from './project.js'

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

/** Keep crash recovery separate from the last explicit save. */
export function upsertProject(library, project, savedAt, confirmed = false) {
  const existing = library.find((entry) => entry.id === project.id)
  const checkpoint = confirmed
    ? { savedProject: clone(project), confirmedAt: savedAt }
    : existing && !existing.draft
      ? {
          savedProject: clone(existing.savedProject || existing.project),
          confirmedAt: existing.confirmedAt || existing.savedAt,
        }
      : {}
  return [
    {
      id: project.id,
      savedAt,
      draft: confirmed ? false : (existing?.draft ?? true),
      project: clone(project),
      ...checkpoint,
    },
    ...library.filter((entry) => entry.id !== project.id),
  ]
}

export function workspaceReducer(state, action) {
  if (action.type === 'sync') return state.active ? state : { ...state, ...action.value }
  if (action.type === 'begin') {
    return {
      past: [],
      future: [],
      historyGroup: null,
      project: action.project,
      active: true,
      library: upsertProject(state.library, action.project, action.savedAt),
    }
  }
  if (action.type === 'edit') {
    const project = typeof action.value === 'function' ? action.value(state.project) : action.value
    if (JSON.stringify(project) === JSON.stringify(state.project)) return state
    const grouped =
      action.group &&
      state.historyGroup === action.group &&
      (action.group.startsWith('drag:') || action.time - (state.historyTime || 0) < 750)
    return {
      ...state,
      project,
      past: grouped ? state.past : [...(state.past || []), state.project].slice(-60),
      future: [],
      historyGroup: action.group,
      historyTime: action.time,
      library: state.active ? upsertProject(state.library, project, action.savedAt) : state.library,
    }
  }
  if (action.type === 'save' || action.type === 'finish') {
    const project = { ...state.project, ...action.identity }
    return {
      ...state,
      project,
      active: action.type === 'finish' ? false : state.active,
      library: upsertProject(state.library, project, action.savedAt, true),
    }
  }
  if (action.type === 'discard') {
    const existing = state.library.find((entry) => entry.id === state.project.id)
    const saved = existing && !existing.draft
    const library = saved
      ? state.library.map((entry) =>
          entry.id === existing.id
            ? {
                ...entry,
                project: clone(entry.savedProject || entry.project),
                savedAt: entry.confirmedAt || entry.savedAt,
              }
            : entry,
        )
      : state.library.filter((entry) => entry.id !== state.project.id)
    return {
      project: clone(
        saved
          ? existing.savedProject || existing.project
          : library[0]?.project || SCENARIOS.find((scenario) => scenario.id === 'empty').project,
      ),
      library,
      active: false,
    }
  }
  if (action.type === 'library') {
    return {
      ...state,
      library: typeof action.value === 'function' ? action.value(state.library) : action.value,
    }
  }
  if (action.type === 'undo' || action.type === 'redo') {
    const undo = action.type === 'undo'
    const from = undo ? state.past : state.future
    if (!from?.length) return state
    const project = from.at(-1)
    return {
      ...state,
      project,
      historyGroup: null,
      past: undo ? state.past.slice(0, -1) : [...(state.past || []), state.project],
      future: undo ? [...(state.future || []), state.project] : state.future.slice(0, -1),
      library: upsertProject(state.library, project, action.savedAt),
    }
  }
  if (action.type === 'external-library') {
    const own = state.active && state.library.find((e) => e.id === state.project.id)
    return {
      ...state,
      library: own ? [own, ...action.library.filter((e) => e.id !== own.id)] : action.library,
    }
  }
  return state
}
