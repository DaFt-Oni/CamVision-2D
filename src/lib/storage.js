import { validateProject } from './project.js'
export const WORKSPACE_KEY = 'optivision.workspace.v1'
export const stableStringify = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  )
function recoverProject(raw) {
  if (!raw) throw new Error('Proyecto ausente')
  return validateProject({
    ...raw,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Proyecto recuperado',
    cameras: Array.isArray(raw.cameras)
      ? raw.cameras.map((c, i) => ({
          ...c,
          name:
            typeof c?.name === 'string' && c.name.trim()
              ? c.name
              : `Cámara ${String(i + 1).padStart(2, '0')}`,
        }))
      : raw.cameras,
  })
}
export function loadWorkspace() {
  try {
    const data = JSON.parse(localStorage.getItem(WORKSPACE_KEY))
    if (!data || data.version !== 1) return null
    let recovered = false
    const library = (Array.isArray(data.library) ? data.library : []).flatMap((entry) => {
      try {
        let savedProject
        try {
          if (entry.savedProject) savedProject = recoverProject(entry.savedProject)
        } catch {
          recovered = true
        }
        let project
        try {
          project = recoverProject(entry.project)
        } catch {
          project = savedProject
          recovered = true
        }
        if (!project) return []
        const id = project.id || entry.id
        if (typeof id !== 'string' || !id || id.length > 100) return []
        if (stableStringify(project) !== stableStringify(entry.project)) recovered = true
        return [
          {
            id,
            savedAt: String(entry.savedAt),
            draft: entry.draft === true,
            project: { ...project, id },
            ...(savedProject && !entry.draft
              ? {
                  savedProject: { ...savedProject, id },
                  confirmedAt: String(entry.confirmedAt || entry.savedAt),
                }
              : {}),
          },
        ]
      } catch {
        recovered = true
        return []
      }
    })
    let project
    try {
      project = recoverProject(data.project)
      if (stableStringify(project) !== stableStringify(data.project)) recovered = true
    } catch {
      project = library[0]?.project
      recovered = true
    }
    return project ? { project, library, ...(recovered ? { recovered: true } : {}) } : null
  } catch {
    return null
  }
}
export function saveWorkspace(project, library) {
  validateProject(project)
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ version: 1, project, library }))
}
const fingerprint = (entry) =>
  entry ? stableStringify([entry.project, entry.savedProject, entry.draft]) : null
export class WorkspaceConflict extends Error {
  constructor() {
    super(
      'Este proyecto cambió en otra pestaña. Abre su versión actual o conserva tus cambios en una copia.',
    )
    this.name = 'WorkspaceConflict'
  }
}
export function mergeWorkspace(base, next, remote, options = {}) {
  const before = new Map((base?.library || []).map((e) => [e.id, e]))
  const after = new Map(next.library.map((e) => [e.id, e]))
  const latest = new Map((remote?.library || []).map((e) => [e.id, e]))
  const candidates = options.writeIds || [...new Set([...before.keys(), ...after.keys()])]
  const changed = candidates.filter(
    (id) => fingerprint(before.get(id)) !== fingerprint(after.get(id)),
  )
  for (const id of changed) {
    if (
      fingerprint(latest.get(id)) !== fingerprint(before.get(id)) &&
      fingerprint(latest.get(id)) !== fingerprint(after.get(id))
    )
      throw new WorkspaceConflict()
    if (after.has(id)) latest.set(id, after.get(id))
    else latest.delete(id)
  }
  return {
    project: next.project,
    library: [...latest.values()].sort((a, b) =>
      String(b.savedAt).localeCompare(String(a.savedAt)),
    ),
  }
}
export async function commitWorkspace(base, next, options) {
  const commit = () => {
    const merged = mergeWorkspace(base, next, loadWorkspace(), options)
    saveWorkspace(merged.project, merged.library)
    return merged
  }
  return globalThis.navigator?.locks
    ? navigator.locks.request('camvision-workspace', commit)
    : commit()
}
