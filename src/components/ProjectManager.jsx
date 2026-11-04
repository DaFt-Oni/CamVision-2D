import { useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { PROJECT_ICONS, PROJECT_COLORS, SCENARIOS } from '../lib/project.js'
import { navigateTabs } from '../lib/accessibility.js'

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
  return (
    <div className="local-projects">
      {!library.length && (
        <p className="project-empty">
          Todavía no hay proyectos locales. Crea uno en blanco o abre un ejemplo.
        </p>
      )}
      {library.map((entry) => (
        <div className="local-project-row" key={entry.id}>
          <button
            className="local-project-open"
            onClick={() => onOpen(entry.project, { fresh: false })}
          >
            <ProjectBadge project={entry.project} />
            <span>
              <strong>{entry.project.name}</strong>
              <small>
                {entry.draft ? 'Borrador automático' : 'Guardado'} · {entry.project.space.width} ×{' '}
                {entry.project.space.height} m · {entry.project.cameras.length} cámaras
              </small>
              <small>{new Date(entry.savedAt).toLocaleString('es-CL')}</small>
            </span>
            <Icon name="chevron" size={15} />
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
                <small>Oficina, demostración académica o bodega.</small>
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

export function SaveProjectForm({ project, leaving, onSave, onCancel }) {
  const nameRef = useRef(null)
  const errorId = useId()
  const [name, setName] = useState(project.name)
  const [icon, setIcon] = useState(project.icon || 'folder')
  const [color, setColor] = useState(project.color || PROJECT_COLORS[0])
  const [error, setError] = useState('')
  return (
    <form
      className="project-save-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!name.trim()) {
          setError('Escribe un nombre para el proyecto.')
          nameRef.current?.focus()
          return
        }
        const message = onSave({ name: name.trim(), icon, color })
        if (message) setError(message)
      }}
    >
      <p className="dialog-description">
        {leaving
          ? 'Guarda los datos del proyecto antes de salir del simulador.'
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
      <div className="project-form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          {leaving ? 'Seguir editando' : 'Cancelar'}
        </button>
        <button className="btn primary" type="submit">
          <Icon name="save" size={15} />
          {leaving ? 'Guardar y continuar' : 'Guardar proyecto'}
        </button>
      </div>
    </form>
  )
}
