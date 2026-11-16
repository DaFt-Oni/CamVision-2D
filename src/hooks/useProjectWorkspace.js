import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { clone, SCENARIOS } from '../lib/project.js'
import {
  loadWorkspace,
  commitWorkspace,
  mergeWorkspace,
  saveWorkspace,
  WORKSPACE_KEY,
  WorkspaceConflict,
  stableStringify,
} from '../lib/storage.js'
import { prepareProject, workspaceReducer } from '../lib/workspace.js'
export default function useProjectWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, null, () => {
    const stored = loadWorkspace()
    return {
      project: prepareProject(stored?.project || clone(SCENARIOS[0].project)),
      library: stored?.library || [],
      active: globalThis.location?.hash === '#simulator' && Boolean(stored?.project),
      recovered: stored?.recovered || false,
      past: [],
      future: [],
    }
  })
  const latest = useRef(state),
    durable = useRef(state),
    queue = useRef(Promise.resolve()),
    blocked = useRef(false),
    pending = useRef(0)
  const [storageError, setStorageError] = useState(false),
    [conflict, setConflict] = useState(false),
    [saving, setSaving] = useState(false)
  const apply = useCallback((action) => {
    latest.current = workspaceReducer(latest.current, action)
    dispatch(action)
    return latest.current
  }, [])
  const enqueue = useCallback(
    (next, writeIds) => {
      pending.current++
      setSaving(true)
      const operation = queue.current
        .catch(() => {})
        .then(async () => {
          if (blocked.current) throw new WorkspaceConflict()
          const merged = await commitWorkspace(durable.current, next, { writeIds })
          durable.current = merged
          setStorageError(false)
          apply({ type: 'external-library', library: merged.library })
          return merged
        })
        .catch((error) => {
          if (error instanceof WorkspaceConflict) {
            blocked.current = true
            setConflict(true)
          } else setStorageError(true)
          throw error
        })
        .finally(() => {
          pending.current--
          if (!pending.current) setSaving(false)
        })
      queue.current = operation.catch(() => {})
      return operation
    },
    [apply],
  )
  useEffect(() => {
    if (!state.active) return
    const currentEntry = latest.current.library.find((e) => e.id === state.project.id)
    const previousEntry = durable.current.library?.find((e) => e.id === state.project.id)
    if (
      state.project.id === durable.current.project?.id &&
      stableStringify([currentEntry?.project, currentEntry?.savedProject, currentEntry?.draft]) ===
        stableStringify([previousEntry?.project, previousEntry?.savedProject, previousEntry?.draft])
    )
      return
    enqueue(latest.current, [state.project.id]).catch(() => {})
  }, [state.project, state.active, enqueue])
  useEffect(() => {
    const flush = () => {
      const current = latest.current
      if (!current.active || blocked.current) return
      try {
        const merged = mergeWorkspace(durable.current, current, loadWorkspace(), {
          writeIds: [current.project.id],
        })
        saveWorkspace(merged.project, merged.library)
        durable.current = merged
      } catch (error) {
        if (error instanceof WorkspaceConflict) {
          blocked.current = true
          setConflict(true)
        } else setStorageError(true)
      }
    }
    const hidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    const sync = (event) => {
      if (event.key !== WORKSPACE_KEY) return
      const stored = loadWorkspace()
      if (!stored) return
      if (latest.current.active) apply({ type: 'external-library', library: stored.library })
      else {
        durable.current = stored
        apply({
          type: 'sync',
          value: { project: prepareProject(stored.project), library: stored.library },
        })
      }
    }
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('beforeunload', flush)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('storage', sync)
    }
  }, [apply])
  const send = (type, values = {}) =>
    apply({ type, ...values, time: Date.now(), savedAt: new Date().toISOString() })
  const save = async (identity = {}, finish = false) => {
    await queue.current
    if (blocked.current) throw new WorkspaceConflict()
    const action = { type: finish ? 'finish' : 'save', identity, savedAt: new Date().toISOString() }
    const next = workspaceReducer(latest.current, action)
    await enqueue(next, [next.project.id])
    apply(action)
    return next.project
  }
  return {
    ...state,
    storageError,
    saving,
    conflict,
    dirty:
      !state.library.find((e) => e.id === state.project.id)?.savedProject ||
      stableStringify(state.project) !==
        stableStringify(state.library.find((e) => e.id === state.project.id)?.savedProject),
    setProject: (value, options = {}) => send('edit', { value, group: options.group }),
    begin: (value, options) => {
      const stored = loadWorkspace()
      if (stored) {
        durable.current = stored
        apply({ type: 'external-library', library: stored.library })
      }
      blocked.current = false
      setConflict(false)
      const current = !options?.fresh && stored?.library.find((entry) => entry.id === value.id)
      return send('begin', { project: prepareProject(current?.project ?? value, options) })
    },
    save,
    undo: () => send('undo'),
    redo: () => send('redo'),
    setLibrary: async (value) => {
      await queue.current
      const previous = latest.current
      const action = { type: 'library', value }
      const next = workspaceReducer(previous, action)
      const ids = [...new Set([...previous.library, ...next.library].map((e) => e.id))].filter(
        (id) =>
          JSON.stringify(previous.library.find((e) => e.id === id)) !==
          JSON.stringify(next.library.find((e) => e.id === id)),
      )
      try {
        const merged = await enqueue(next, ids)
        apply({ type: 'library', value: merged.library })
        return true
      } catch {
        return false
      }
    },
    discard: async () => {
      await queue.current
      const id = latest.current.project.id
      const next = workspaceReducer(latest.current, { type: 'discard' })
      await enqueue(next, [id])
      apply({ type: 'discard' })
      return next.project
    },
    resolveConflict: async (copy) => {
      await queue.current
      const stored = loadWorkspace()
      if (!stored) throw new Error('No se pudo recuperar la biblioteca.')
      if (!copy) {
        const remote = stored.library.find((e) => e.id === latest.current.project.id)
        if (!remote)
          throw new Error(
            'La otra pestaña eliminó este proyecto. Conserva tus cambios en una copia.',
          )
        blocked.current = false
        setConflict(false)
        durable.current = stored
        apply({
          type: 'begin',
          project: prepareProject(remote.project),
          savedAt: new Date().toISOString(),
        })
        apply({ type: 'library', value: stored.library })
        return
      }
      const project = prepareProject(
        { ...latest.current.project, name: `${latest.current.project.name.slice(0, 70)} (copia)` },
        { fresh: true },
      )
      let next = workspaceReducer(
        { ...latest.current, library: stored.library },
        { type: 'begin', project, savedAt: new Date().toISOString() },
      )
      next = workspaceReducer(next, {
        type: 'save',
        identity: {},
        savedAt: new Date().toISOString(),
      })
      durable.current = stored
      blocked.current = false
      const merged = await enqueue(next, [project.id])
      apply({ type: 'begin', project, savedAt: new Date().toISOString() })
      apply({ type: 'library', value: merged.library })
      setConflict(false)
    },
  }
}
