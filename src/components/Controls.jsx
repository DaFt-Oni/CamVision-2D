import { useId, useRef, useState } from 'react'
export function NameInput({ value, onChange, maxLength = 80, ...props }) {
  const [draft, setDraft] = useState(null),
    [error, setError] = useState('')
  const id = useId(),
    cancel = useRef(false)
  return (
    <>
      <input
        {...props}
        value={draft ?? value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? id : undefined}
        onFocus={() => {
          if (draft === null) setDraft(value)
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          setError('')
        }}
        onBlur={() => {
          if (cancel.current) {
            cancel.current = false
            return
          }
          const name = (draft ?? value).trim()
          if (!name) {
            setError('Escribe un nombre; los espacios solos no son válidos.')
            return
          }
          onChange(name)
          setDraft(null)
          setError('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
          if (e.key === 'Escape') {
            cancel.current = true
            setDraft(null)
            setError('')
            e.stopPropagation()
            e.currentTarget.blur()
          }
        }}
      />
      {error && (
        <span id={id} className="field-error" role="alert">
          {error}
        </span>
      )}
    </>
  )
}
export function NumberField({ value, min, max, step = 0.1, onChange, label, unit, slider }) {
  const id = useId(),
    cancel = useRef(false)
  const [draft, setDraft] = useState(null),
    [error, setError] = useState('')
  const commit = () => {
    if (cancel.current) {
      cancel.current = false
      return
    }
    const text = draft ?? String(value),
      parsed = Number(text.replace(',', '.'))
    if (!text.trim() || !Number.isFinite(parsed) || parsed < min || parsed > max) {
      setError(`Introduce un número entre ${min} y ${max} ${unit || ''}.`)
      return
    }
    onChange(Math.round(parsed * 1000) / 1000)
    setDraft(null)
    setError('')
  }
  return (
    <div className={`number-field ${slider ? 'has-slider' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-unit">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={draft ?? value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={() => {
            if (draft === null) setDraft(String(value))
          }}
          onChange={(e) => {
            setDraft(e.target.value)
            setError('')
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') {
              cancel.current = true
              setDraft(null)
              setError('')
              e.stopPropagation()
              e.currentTarget.blur()
            }
            if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault()
              const parsed = Number((draft ?? String(value)).replace(',', '.'))
              const next =
                Math.round(
                  Math.max(
                    min,
                    Math.min(
                      max,
                      (Number.isFinite(parsed) ? parsed : value) +
                        (e.key === 'ArrowUp' ? step : -step),
                    ),
                  ) * 1000,
                ) / 1000
              setDraft(String(next))
              setError('')
            }
          }}
        />
        <span>{unit}</span>
      </div>
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
      {slider && (
        <input
          className="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${label}, deslizador`}
          onChange={(e) => {
            setDraft(null)
            setError('')
            onChange(Number(e.target.value))
          }}
        />
      )}
    </div>
  )
}
export function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  )
}
export function Legend({ mode = 'matrix' }) {
  return (
    <div className="legend">
      {mode === 'sectors' ? (
        <>
          <span>
            <i className="sector-key" />
            Campos de visión por cámara
          </span>
          <span>Conteos y superposición en la vista Matriz</span>
        </>
      ) : (
        <>
          <span>
            <i className="dot covered" />
            {mode === 'blind' ? 'Zona cubierta' : 'Cobertura única'}
          </span>
          {mode !== 'blind' && (
            <span>
              <i className="dot overlap" />
              Superposición
            </span>
          )}
          <span>
            <i className="dot blind" />
            Punto ciego
          </span>
        </>
      )}
      <span>
        <i className="wall-key" />
        Pared
      </span>
    </div>
  )
}
