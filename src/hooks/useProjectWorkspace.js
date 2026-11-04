import { useEffect, useReducer, useState } from 'react'
import { clone, SCENARIOS } from '../lib/project.js'
import { loadWorkspace, saveWorkspace } from '../lib/storage.js'
import { prepareProject, workspaceReducer } from '../lib/workspace.js'

export default function useProjectWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, null, () => {
    const stored = loadWorkspace()
    return {
      project: prepareProject(stored?.project || clone(SCENARIOS[0].project)),
      library: stored?.library || [],
      active: false,
    }
  })
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    if (!state.active) return
    const persist = () => {
      try {
        saveWorkspace(state.project, state.library)
        setStorageError(false)
      } catch {
        setStorageError(true)
      }
    }
    // Save each committed edit; pagehide/hidden also flush synchronously when available.
    persist()
    const hidden = () => {
      if (document.visibilityState === 'hidden') persist()
    }
    window.addEventListener('beforeunload', persist)
    window.addEventListener('pagehide', persist)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      window.removeEventListener('beforeunload', persist)
      window.removeEventListener('pagehide', persist)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [state])
  useEffect(() => {
    const sync = (event) => {
      if (event.key !== 'optivision.workspace.v1') return
      const stored = loadWorkspace()
      if (stored)
        dispatch({
          type: 'sync',
          value: { project: prepareProject(stored.project), library: stored.library },
        })
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  const send = (type, values = {}) =>
    dispatch({ type, ...values, savedAt: new Date().toISOString() })
  const save = (identity, finish = false) => {
    // Persist before leaving the editor; a storage failure keeps the naming dialog open.
    const action = { type: finish ? 'finish' : 'save', identity, savedAt: new Date().toISOString() }
    const next = workspaceReducer(state, action)
    saveWorkspace(next.project, next.library)
    setStorageError(false)
    dispatch(action)
  }
  return {
    ...state,
    storageError,
    setProject: (value) => send('edit', { value }),
    setLibrary: (value) => {
      const action = { type: 'library', value }
      const next = workspaceReducer(state, action)
      try {
        saveWorkspace(next.project, next.library)
        dispatch(action)
        setStorageError(false)
        return true
      } catch {
        setStorageError(true)
        return false
      }
    },
    begin: (value, options) => send('begin', { project: prepareProject(value, options) }),
    save,
  }
}
