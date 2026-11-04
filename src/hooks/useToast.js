import { useCallback, useRef, useState } from 'react'

export default function useToast() {
  const [toast, setToast] = useState(null)
  const sequence = useRef(0)
  const showToast = useCallback((message, { type = 'success', title, duration } = {}) => {
    const titles = {
      success: 'Listo',
      info: 'Información',
      warning: 'Revisa esta acción',
      error: 'No se pudo completar',
    }
    const timeouts = { success: 5000, info: 6000, warning: 7000, error: 9000 }
    sequence.current += 1
    setToast({
      id: sequence.current,
      message,
      type,
      title: title || titles[type],
      duration: duration ?? timeouts[type],
    })
  }, [])
  const dismissToast = useCallback(() => setToast(null), [])
  return { toast, showToast, dismissToast }
}
