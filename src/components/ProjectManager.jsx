import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { PROJECT_ICONS, PROJECT_COLORS, SCENARIOS } from '../lib/project.js'
import { navigateTabs } from '../lib/accessibility.js'
import { stableStringify } from '../lib/storage.js'

const iconLabels = {
  folder: 'Carpeta',
  home: 'Edificio',
  camera: 'Cámara',
  grid: 'Plano',
  target: 'Objetivo',
  layers: 'Capas',
}
const colorLabels = ['Azul', 'Verde', 'Violeta', 'Ocre', 'Gris', 'Rojo']

export function ProjectBadge({ project, size = 20 }) {
  return (
    <span
      className="project-badge"
      style={{ '--project-color': project.color || PROJECT_COLORS[0] }}
    >
      <Icon name={project.icon || 'folder'} size={size} />
    </span>
  )
}

export function LocalProjects({ library, onOpen, onDelete }) {
  const [query, setQuery] = useState('')
  const entries = library.filter((entry) =>
    entry.project.name.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')),
  )
  return (
    <div className="local-projects">
      {library.length > 0 && (
        <label className="project-search">
          Buscar proyecto
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre del proyecto"
          />
        </label>
      )}
      {library.length > 0 && !entries.length && (
        <p className="project-empty">No hay proyectos que coincidan con la búsqueda.</p>
      )}
      {!library.length && (
        <p className="project-empty">
          Todavía no hay proyectos locales. Crea uno en blanco o abre un ejemplo.
        </p>
      )}
      {entries.map((entry) => (
        <div className="local-project-row" key={entry.id}>
          <button
            className="local-project-open"
            onClick={() => onOpen(entry.project, { fresh: false })}
          >
            <ProjectBadge project={entry.project} />
            <svg
              className="project-preview"
              viewBox={`-1 -1 ${entry.project.space.width + 2} ${entry.project.space.height + 2}`}
              aria-hidden="true"
            >
              <rect
                width={entry.project.space.width}
                height={entry.project.space.height}
                fill="white"
                stroke="#7187a0"
                strokeWidth=".2"
              />
              {entry.project.walls.map((w) => (
                <line
                  key={w.id}
                  x1={w.a.x}
                  y1={entry.project.space.height - w.a.y}
                  x2={w.b.x}
                  y2={entry.project.space.height - w.b.y}
                  stroke="#435774"
                  strokeWidth=".35"
                />
              ))}
              {entry.project.cameras.map((c) => (
                <circle
                  key={c.id}
                  cx={c.x}
                  cy={entry.project.space.height - c.y}
                  r=".5"
                  fill={c.color}
                />
              ))}
            </svg>
            <span>
              <strong>{entry.project.name}</strong>
              <small>
                {entry.draft
                  ? 'Borrador automático'
                  : entry.savedProject &&
                      stableStringify(entry.savedProject) !== stableStringify(entry.project)
                    ? 'Cambios pendientes · recuperación automática'
                    : 'Guardado confirmado'}{' '}
                · {entry.project.space.width} × {entry.project.space.height} m ·{' '}
                {entry.project.cameras.length} cámaras
              </small>
              <small>Última actividad: {new Date(entry.savedAt).toLocaleString('es-CL')}</small>
            </span>
            <Icon name="chevron" size={15} />
          </button>
          <button
            className="project-copy"
            aria-label={`Duplicar proyecto ${entry.project.name}`}
            onClick={() =>
              onOpen(
                { ...entry.project, name: `${entry.project.name.slice(0, 70)} (copia)` },
                { fresh: true },
              )
            }
          >
            Duplicar
          </button>
          {onDelete && (
            <button
              className="icon-button danger"
              aria-label={`Eliminar proyecto ${entry.project.name}`}
              onClick={() => onDelete(entry.id)}
            >
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export function ProjectLauncher({ library, project, onOpen, onImport }) {
  const [section, setSection] = useState('start')
  return (
    <div className="project-launcher">
      <p className="dialog-description">Elige cómo quieres iniciar el simulador.</p>
      <div className="project-launch-tabs" role="tablist" aria-label="Origen del proyecto">
        {[
          ['start', 'Nuevo'],
          ['local', 'Guardados locales'],
          ['examples', 'Ejemplos'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`launch-tab-${id}`}
            aria-selected={section === id}
            aria-controls="launch-content"
            tabIndex={section === id ? 0 : -1}
            onKeyDown={(event) =>
              navigateTabs(event, ['start', 'local', 'examples'], section, setSection)
            }
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div id="launch-content" role="tabpanel" aria-labelledby={`launch-tab-${section}`}>
        {section === 'start' && (
          <div className="launch-options">
            <button
              className="launch-option"
              onClick={() =>
                onOpen(
                  { ...SCENARIOS.find((item) => item.id === 'empty').project, name: '' },
                  { fresh: true },
                )
              }
            >
              <Icon name="plus" size={22} />
              <span>
                <strong>Crear escenario en blanco</strong>
                <small>Recinto de 10 × 8 m, sin cámaras ni paredes.</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
            <button className="launch-option" onClick={() => setSection('local')}>
              <Icon name="folder" size={22} />
              <span>
                <strong>Cargar un proyecto local</strong>
                <small>{library.length} proyectos y borradores disponibles.</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
            <button className="launch-option" onClick={() => setSection('examples')}>
              <Icon name="grid" size={22} />
              <span>
                <strong>Usar un escenario de ejemplo</strong>
                <small>Oficina, demostración académica, bodega o triangulación.</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
            {library.some((entry) => entry.id === project.id) && (
              <button className="launch-resume" onClick={() => onOpen(project, { fresh: false })}>
                Continuar «{project.name}»<Icon name="chevron" size={15} />
              </button>
            )}
          </div>
        )}
        {section === 'local' && <LocalProjects library={library} onOpen={onOpen} />}
        {section === 'examples' && (
          <div className="launch-options">
            {SCENARIOS.filter((item) => item.id !== 'empty').map((item) => (
              <button
                className="launch-option"
                key={item.id}
                onClick={() => onOpen(item.project, { fresh: true })}
              >
                <Icon name="grid" size={20} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="launch-import">
        <button className="text-button" onClick={onImport}>
          <Icon name="upload" size={15} />
          Importar proyecto JSON
        </button>
        <span>Los cambios se preguardan en este navegador.</span>
      </div>
    </div>
  )
}

export function ExitProjectPrompt({ project, onSave, onDiscard, onCancel }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const cancelRef = useRef(null)
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])
  const run = async (action) => {
    setPending(true)
    const message = await action()
    setPending(false)
    if (message) setError(message)
  }
  return (
    <div className="project-save-form">
      <p className="dialog-description">
        ¿Guardar los cambios de «{project.name}» antes de salir? Si sales sin guardar, se recuperará
        la última versión que guardaste.
      </p>
      {error && (
        <p className="project-save-error" role="alert">
          {error}
        </p>
      )}
      <div className="project-form-actions" inert={pending} aria-busy={pending}>
        <button ref={cancelRef} className="btn" onClick={onCancel}>
          Seguir editando
        </button>
        <button className="btn" onClick={() => run(onDiscard)}>
          Salir sin guardar
        </button>
        <button className="btn primary" onClick={() => run(onSave)}>
          Guardar y salir
        </button>
      </div>
    </div>
  )
}

export function SaveProjectForm({
  project,
  leaving,
  editingProperties,
  onSave,
  onDiscard,
  onCancel,
}) {
  const nameRef = useRef(null)
  const errorId = useId()
  const [name, setName] = useState(project.name)
  const [icon, setIcon] = useState(project.icon || 'folder')
  const [color, setColor] = useState(project.color || PROJECT_COLORS[0])
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => {
    nameRef.current?.focus()
  }, [])
  return (
    <form
      className="project-save-form"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        if (!name.trim()) {
          setError('Escribe un nombre para el proyecto.')
          nameRef.current?.focus()
          return
        }
        setPending(true)
        const message = await onSave({ name: name.trim(), icon, color })
        setPending(false)
        if (message) setError(message)
      }}
    >
      <p className="dialog-description">
        {leaving
          ? 'Guarda el proyecto con un nombre, icono y color, o sal sin guardar para descartar este borrador.'
          : editingProperties
            ? 'Cambia el nombre, icono y color del proyecto. Guardar también conserva los cambios actuales del plano.'
            : 'Define cómo aparecerá el proyecto en tus guardados locales.'}
      </p>
      <label className="project-name-field">
        <span>Nombre del proyecto</span>
        <input
          ref={nameRef}
          value={name}
          maxLength={80}
          aria-required="true"
          aria-invalid={Boolean(error) && !name.trim()}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
        />
      </label>
      {error && !name.trim() && (
        <span className="project-name-error" id={errorId} role="alert">
          {error}
        </span>
      )}
      <fieldset className="identity-options">
        <legend>Icono</legend>
        <div>
          {PROJECT_ICONS.map((value) => (
            <button
              type="button"
              key={value}
              aria-label={`Icono ${iconLabels[value]}`}
              aria-pressed={icon === value}
              onClick={() => setIcon(value)}
            >
              <Icon name={value} size={20} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="identity-options">
        <legend>Color del icono</legend>
        <div>
          {PROJECT_COLORS.map((value, index) => (
            <button
              type="button"
              key={value}
              className="identity-color"
              style={{ '--swatch': value }}
              aria-label={`Color ${colorLabels[index]}`}
              aria-pressed={color === value}
              onClick={() => setColor(value)}
            >
              <i />
              {color === value && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="project-identity-preview">
        <ProjectBadge project={{ icon, color }} />
        <span>{name.trim() || 'Proyecto sin título'}</span>
        <small>Vista previa</small>
      </div>
      {error && name.trim() && (
        <p className="project-save-error" id={errorId} role="alert">
          {error}
        </p>
      )}
      <div className="project-form-actions" inert={pending} aria-busy={pending}>
        <button type="button" className="btn" onClick={onCancel}>
          {leaving ? 'Seguir editando' : 'Cancelar'}
        </button>
        {leaving && (
          <button
            type="button"
            className="btn"
            onClick={async () => {
              setPending(true)
              const message = await onDiscard()
              setPending(false)
              if (message) setError(message)
            }}
          >
            Salir sin guardar
          </button>
        )}
        <button className="btn primary" type="submit">
          <Icon name="save" size={15} />
          {leaving ? 'Guardar y salir' : editingProperties ? 'Guardar cambios' : 'Guardar proyecto'}
        </button>
      </div>
    </form>
  )
}
