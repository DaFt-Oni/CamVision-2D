import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateDrawingFrame } from '../lib/frameSize.js'

export default function useDrawingFrame(space, settings, enabled) {
  const ref = useRef(null)
  const [measurement, setMeasurement] = useState({
    width: 1200,
    viewportWidth: 1440,
    inspectorWidth: 310,
    gap: 0,
  })
  useEffect(() => {
    const host = ref.current
    if (!enabled || !host) return
    let animation = 0
    const measure = () => {
      const grid = host.querySelector('.simulator-grid')
      const inspector = host.querySelector('.inspector-slot')
      if (!grid || !inspector) return
      const next = {
        width: Math.round(host.getBoundingClientRect().width * 10) / 10,
        viewportWidth: window.innerWidth,
        inspectorWidth: Math.round(inspector.getBoundingClientRect().width * 10) / 10,
        gap: parseFloat(getComputedStyle(grid).columnGap) || 0,
      }
      setMeasurement((previous) =>
        Object.keys(next).every((key) => previous[key] === next[key]) ? previous : next,
      )
    }
    const schedule = () => {
      cancelAnimationFrame(animation)
      animation = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(host)
    const main = host.closest('main')
    if (main) observer.observe(main)
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(animation)
    }
  }, [enabled])
  const frame = useMemo(
    () => calculateDrawingFrame(space, measurement, settings),
    [space, measurement, settings],
  )
  return { ref, frame }
}
