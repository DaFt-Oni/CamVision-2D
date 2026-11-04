import { useId, useState } from 'react'
export function NumberField({ value, min, max, step = 0.1, onChange, label, unit, slider }) {
  const id = useId()
  const [draft, setDraft] = useState(''),
    [editing, setEditing] = useState(false)
  const commit = () => {
    const parsed = Number(draft.replace(',', '.'))
    const next =
      draft.trim() && Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : value
    onChange(Math.round(next * 1000) / 1000)
    setEditing(false)
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
          value={editing ? draft : value}
          onFocus={() => {
            setDraft(String(value))
            setEditing(true)
          }}
          onChange={(event) => {
            const text = event.target.value
            setDraft(text)
            const n = Number(text.replace(',', '.'))
            if (text.trim() && Number.isFinite(n) && n >= min && n <= max) onChange(n)
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault()
              const next =
                Math.round(
                  Math.max(min, Math.min(max, value + (event.key === 'ArrowUp' ? step : -step))) *
                    1000,
                ) / 1000
              setDraft(String(next))
              onChange(next)
            }
          }}
        />
        <span>{unit}</span>
      </div>
      {slider && (
        <input
          className="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${label}, deslizador`}
          onChange={(event) => onChange(Number(event.target.value))}
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
  if (mode === 'sectors')
    return (
      <div className="legend">
        <span>
          <i className="sector-key" />
          Campos de visión por cámara
        </span>
        <span>Conteos y superposición en la vista Matriz</span>
        <span>
          <i className="wall-key" />
          Pared
        </span>
      </div>
    )
  if (mode === 'blind')
    return (
      <div className="legend">
        <span>
          <i className="dot covered" />
          Zona cubierta
        </span>
        <span>
          <i className="dot blind" />
          Punto ciego
        </span>
        <span>
          <i className="wall-key" />
          Pared
        </span>
      </div>
    )
  return (
    <div className="legend">
      <span>
        <i className="dot covered" />
        Cobertura única
      </span>
      <span>
        <i className="dot overlap" />
        Superposición
      </span>
      <span>
        <i className="dot blind" />
        Punto ciego
      </span>
      <span>
        <i className="wall-key" />
        Pared
      </span>
    </div>
  )
}
