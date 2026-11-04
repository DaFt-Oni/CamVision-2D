import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

export function Toast({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const timer = setTimeout(onDismiss, toast.duration)
    return () => clearTimeout(timer)
  }, [toast.duration, onDismiss, paused])
  return (
    <div
      className={`app-toast app-toast-${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <span className="app-toast-icon">
        <Icon
          name={toast.type === 'success' ? 'check' : toast.type === 'warning' ? 'warning' : 'info'}
          size={19}
        />
      </span>
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
      <button className="app-toast-close" aria-label="Cerrar notificación" onClick={onDismiss}>
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}

export function ConfirmAction({ confirmation, onCancel, onConfirm }) {
  const cancelRef = useRef(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() => cancelRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div className="confirm-action">
      <div className="confirm-action-message" id="confirmation-description">
        <span className="confirm-action-symbol">
          <Icon name="trash" size={22} />
        </span>
        <div>
          <p>
            Vas a eliminar <strong>«{confirmation.name}»</strong>.
          </p>
          <p>
            {confirmation.kind === 'project'
              ? 'Se quitará de los proyectos guardados en este navegador. Esta acción no se puede deshacer.'
              : 'Se quitará del plano y se recalculará la cobertura del proyecto.'}
          </p>
        </div>
      </div>
      <div className="project-form-actions">
        <button ref={cancelRef} className="btn" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn confirm-destructive" onClick={onConfirm}>
          Eliminar{' '}
          {confirmation.kind === 'project'
            ? 'proyecto'
            : confirmation.kind === 'camera'
              ? 'cámara'
              : 'pared'}
        </button>
      </div>
    </div>
  )
}
