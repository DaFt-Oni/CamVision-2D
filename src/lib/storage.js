import { validateProject } from './project.js'
const KEY = 'optivision.workspace.v1'
export function loadWorkspace() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY))
    if (!data || data.version !== 1) return null
    return {
      project: validateProject(data.project),
      library: Array.isArray(data.library)
        ? data.library.flatMap((entry) => {
            try {
              const project = validateProject(entry.project)
              const id = project.id || entry.id
              if (typeof id !== 'string' || !id || id.length > 100) return []
              return [
                {
                  id,
                  savedAt: String(entry.savedAt),
                  draft: entry.draft === true,
                  project: { ...project, id },
                },
              ]
            } catch {
              return []
            }
          })
        : [],
    }
  } catch {
    return null
  }
}
export function saveWorkspace(project, library) {
  localStorage.setItem(KEY, JSON.stringify({ version: 1, project, library }))
}
