import { useEffect, useMemo, useRef, useState } from 'react'
import { coverageKey } from '../lib/coverageInput.js'
import { calculateCoverage } from '../lib/coverage.js'
export default function useCoverage(project) {
  const key = coverageKey(project)
  const worker = useRef(null)
  const [computed, setComputed] = useState(() => ({
    key,
    result: calculateCoverage(JSON.parse(key)),
  }))
  useEffect(() => {
    try {
      worker.current = new Worker(new URL('../lib/coverage.worker.js', import.meta.url), {
        type: 'module',
      })
    } catch {
      worker.current = null
    }
    return () => {
      worker.current?.terminate()
      worker.current = null
    }
  }, [])
  useEffect(() => {
    let cancelled = false
    const accept = ({ data }) => {
      if (!cancelled && data.key === key)
        setComputed({ key, result: data.error ? calculateCoverage(JSON.parse(key)) : data.result })
    }
    const current = worker.current
    const fallback = () => {
      if (!cancelled) setComputed({ key, result: calculateCoverage(JSON.parse(key)) })
    }
    if (current) {
      current.addEventListener('message', accept)
      current.addEventListener('error', fallback)
      current.postMessage({ key })
    } else {
      const timer = setTimeout(fallback, 0)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }
    return () => {
      cancelled = true
      current.removeEventListener('message', accept)
      current.removeEventListener('error', fallback)
    }
  }, [key])
  const compatible =
    computed.result.rows === Math.ceil(project.space.height / project.space.cellSize) &&
    computed.result.columns === Math.ceil(project.space.width / project.space.cellSize) &&
    computed.result.totalArea === project.space.width * project.space.height
  const emptyKey = JSON.stringify(project.space)
  const empty = useMemo(
    () => calculateCoverage({ space: JSON.parse(emptyKey), cameras: [], walls: [] }),
    [emptyKey],
  )
  return { result: compatible ? computed.result : empty, calculating: computed.key !== key }
}
