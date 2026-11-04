import { useEffect, useRef, useState } from 'react'

export default function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 960, height: 720 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width * 10) / 10
      const height = Math.round(entry.contentRect.height * 10) / 10
      if (width > 0 && height > 0)
        setSize((previous) =>
          previous.width === width && previous.height === height ? previous : { width, height },
        )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}
