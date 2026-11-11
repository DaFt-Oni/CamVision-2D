import { useEffect, useRef } from 'react'
import { NumberField } from './Controls.jsx'
import { navigateTabs } from '../lib/accessibility.js'
import Icon from './Icon.jsx'
import { MAX_CAMERAS, MAX_WALLS } from '../lib/project.js'
import { directionVector } from '../lib/geometry.js'
import { format } from '../lib/format.js'
import { TriangulationControls } from './Triangulation.jsx'

/** Fixed-size inspector: selecting an object never changes the plan's dimensions. */
export default function Parameters({
  project,
  result,
  selected,
  tab,
  onTab,
  onSelect,
  onSpace,
  onCamera,
  onWall,
  onDelete,
  onAddCamera,
  onTool,
  frameSettings,
  frameScale,
  onFrameSettings,
  triangulationSettings,
  triangulation,
  onTriangulation,
  onExplainTriangulation,
  probe,
  onProbe,
}) {
  const contentRef = useRef(null)
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [selected, tab])
  const camera = project.cameras.find((item) => item.id === selected)
  const wall = project.walls.find((item) => item.id === selected)
  const vector = camera && directionVector(camera.angle)
  const select = (id) => {
    onSelect(id)
    onTool('select')
  }
  return (
    <aside className="parameters inspector" aria-label="Inspector del simulador">
      <div className="inspector-heading">
        <Icon name="panel" size={18} />
        <h2>Parámetros</h2>
        <span>
          {tab === 'space'
            ? 'RECINTO'
            : tab === 'cameras'
              ? `${project.cameras.length} CÁMARAS`
              : tab === 'triangulation'
                ? 'TRIANGULACIÓN'
                : `${project.walls.length} PAREDES`}
        </span>
      </div>
      <div className="inspector-tabs" role="tablist" aria-label="Parámetros del plano">
        {[
          ['space', 'grid', 'Espacio'],
          ['cameras', 'camera', 'Cámaras'],
          ['walls', 'wall', 'Paredes'],
          ['triangulation', 'target', 'Medición'],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            id={`inspector-tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            onKeyDown={(event) =>
              navigateTabs(event, ['space', 'cameras', 'walls', 'triangulation'], tab, onTab)
            }
            aria-controls="inspector-content"
            onClick={() => onTab(id)}
          >
            <Icon name={icon} size={15} />
            {label}
          </button>
        ))}
      </div>
      <div
        ref={contentRef}
        className="inspector-content"
        id="inspector-content"
        role="tabpanel"
        aria-labelledby={`inspector-tab-${tab}`}
      >
        {tab === 'triangulation' && (
          <TriangulationControls
            project={project}
            settings={triangulationSettings}
            data={triangulation}
            probe={probe}
            onProbe={onProbe}
            onChange={onTriangulation}
            onExplain={onExplainTriangulation}
          />
        )}
        {tab === 'space' && (
          <div className="inspector-section">
            <div className="inspector-section-title">
              <h3>Dimensiones del recinto</h3>
              <span>Metros</span>
            </div>
            <div className="field-grid">
              <NumberField
                label="Ancho · X"
                value={project.space.width}
                min={2}
                max={50}
                unit="m"
                onChange={(width) => onSpace({ width })}
              />
              <NumberField
                label="Largo · Y"
                value={project.space.height}
                min={2}
                max={50}
                unit="m"
                onChange={(height) => onSpace({ height })}
              />
            </div>
            <div className="frame-size-controls">
              <div className="inspector-section-title">
                <h3>Tamaño del cuadro</h3>
                <span>{frameScale} %</span>
              </div>
              <NumberField
                label="Escala visual del cuadro"
                value={frameSettings.scale}
                min={60}
                max={100}
                step={1}
                unit="%"
                slider
                onChange={(scale) => onFrameSettings({ scale })}
              />
              <p>
                Tamaño del área de dibujo. Usa los controles del plano para navegar dentro de ella.
              </p>
              <button className="frame-original" onClick={() => onFrameSettings({ scale: 100 })}>
                <Icon name="reset" size={13} />
                Restablecer escala · 100 %
              </button>
            </div>
            <label className="select-field">
              <span>Resolución de la matriz</span>
              <select
                value={project.space.cellSize}
                onChange={(e) => onSpace({ cellSize: Number(e.target.value) })}
              >
                <option value="0.25">0,25 m · Alta precisión</option>
                <option value="0.5">0,50 m · Equilibrada</option>
                <option value="1">1,00 m · Vista rápida</option>
              </select>
            </label>
            <dl className="inspector-facts">
              <div>
                <dt>Superficie total</dt>
                <dd>{format(result.totalArea, 2)} m²</dd>
              </div>
              <div>
                <dt>Matriz</dt>
                <dd>
                  {result.rows} × {result.columns}
                </dd>
              </div>
              <div>
                <dt>Total de celdas</dt>
                <dd>{result.totalCells.toLocaleString('es-CL')}</dd>
              </div>
            </dl>
            <div className="inspector-hint">
              <Icon name="info" size={16} />
              <p>
                Origen en la esquina inferior izquierda. X crece hacia la derecha e Y hacia arriba.
                Cada cuadrado grande representa 1 m.
              </p>
            </div>
          </div>
        )}
        {tab === 'cameras' && (
          <div className="inspector-section">
            <div className="inspector-section-title">
              <h3>Cámaras instaladas</h3>
              <button
                className="small-action"
                disabled={project.cameras.length >= MAX_CAMERAS}
                onClick={onAddCamera}
              >
                <Icon name="plus" size={14} />
                Añadir cámara
              </button>
            </div>
            <label className="select-field object-picker">
              <span className="object-picker-label">
                {camera && <i style={{ background: camera.color }} />}Cámara que estás editando
              </span>
              <select value={camera?.id || ''} onChange={(event) => select(event.target.value)}>
                <option value="" disabled>
                  {project.cameras.length ? 'Selecciona una cámara' : 'No hay cámaras instaladas'}
                </option>
                {project.cameras.map((item, index) => (
                  <option key={item.id} value={item.id}>
                    {String(index + 1).padStart(2, '0')} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            {camera ? (
              <div className="selected-properties">
                <fieldset className="parameter-group">
                  <legend>Ubicación en el recinto</legend>
                  <div className="field-grid">
                    <NumberField
                      label="Posición X"
                      value={camera.x}
                      min={0}
                      max={project.space.width}
                      unit="m"
                      onChange={(x) => onCamera(camera.id, { x })}
                    />
                    <NumberField
                      label="Posición Y"
                      value={camera.y}
                      min={0}
                      max={project.space.height}
                      unit="m"
                      onChange={(y) => onCamera(camera.id, { y })}
                    />
                  </div>
                </fieldset>
                <fieldset className="parameter-group">
                  <legend>Campo de visión</legend>
                  <p className="field-help">θ dirección · α apertura · d alcance</p>
                  <NumberField
                    label="Orientación · θ"
                    value={camera.angle}
                    min={0}
                    max={360}
                    step={1}
                    unit="°"
                    slider
                    onChange={(angle) => onCamera(camera.id, { angle })}
                  />
                  <div className="slider-labels">
                    <span>0° Este</span>
                    <span>90° Norte</span>
                    <span>360°</span>
                  </div>
                  <NumberField
                    label="Apertura · α"
                    value={camera.fov}
                    min={1}
                    max={170}
                    step={1}
                    unit="°"
                    slider
                    onChange={(fov) => onCamera(camera.id, { fov })}
                  />
                  <NumberField
                    label="Alcance · d"
                    value={camera.range}
                    min={0.5}
                    max={70}
                    step={0.5}
                    unit="m"
                    slider
                    onChange={(range) => onCamera(camera.id, { range })}
                  />
                </fieldset>
                <div className="vector-preview">
                  <Icon name="cross" size={15} />
                  <span>
                    u = ({format(vector.x, 3)}; {format(vector.y, 3)})
                  </span>
                </div>
                <details className="object-options">
                  <summary>Nombre y opciones</summary>
                  <label className="select-field">
                    <span>Nombre</span>
                    <input
                      value={camera.name}
                      maxLength={60}
                      onChange={(e) => onCamera(camera.id, { name: e.target.value || 'Cámara' })}
                    />
                  </label>
                  <button className="btn danger delete-object" onClick={onDelete}>
                    <Icon name="trash" size={16} />
                    Eliminar cámara seleccionada
                  </button>
                </details>
              </div>
            ) : (
              <div className="inspector-empty">
                <Icon name="camera" size={30} />
                <p>
                  {project.cameras.length
                    ? 'Selecciona una cámara del plano o de la lista.'
                    : 'Añade una cámara con el botón superior o colócala en el plano.'}
                </p>
              </div>
            )}
          </div>
        )}
        {tab === 'walls' && (
          <div className="inspector-section">
            <div className="inspector-section-title">
              <h3>Obstáculos lineales</h3>
              <button
                className="small-action"
                disabled={project.walls.length >= MAX_WALLS}
                onClick={() => onTool('wall')}
              >
                <Icon name="plus" size={14} />
                Dibujar
              </button>
            </div>
            <label className="select-field object-picker">
              <span>Pared que estás editando</span>
              <select value={wall?.id || ''} onChange={(event) => select(event.target.value)}>
                <option value="" disabled>
                  {project.walls.length ? 'Selecciona una pared' : 'No hay paredes'}
                </option>
                {project.walls.map((item, index) => (
                  <option key={item.id} value={item.id}>
                    Pared {String(index + 1).padStart(2, '0')} ·{' '}
                    {format(Math.hypot(item.b.x - item.a.x, item.b.y - item.a.y), 2)} m
                  </option>
                ))}
              </select>
            </label>
            {wall ? (
              <div className="selected-properties">
                <div className="selected-object-title">
                  <span>Extremos de la pared</span>
                  <button
                    className="icon-button danger"
                    aria-label="Eliminar pared seleccionada"
                    onClick={onDelete}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                {['a', 'b'].map((end) => (
                  <div className="field-grid" key={end}>
                    <NumberField
                      label={`${end.toUpperCase()} · X`}
                      value={wall[end].x}
                      min={0}
                      max={project.space.width}
                      unit="m"
                      onChange={(x) => onWall(wall.id, end, { ...wall[end], x })}
                    />
                    <NumberField
                      label={`${end.toUpperCase()} · Y`}
                      value={wall[end].y}
                      min={0}
                      max={project.space.height}
                      unit="m"
                      onChange={(y) => onWall(wall.id, end, { ...wall[end], y })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="inspector-hint">
                <Icon name="info" size={16} />
                <p>
                  Activa Dibujar y haz clic en dos puntos del plano. Las paredes bloquean la línea
                  de visión. Pulsa Esc para cancelar.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="inspector-footer">
        <span>Modelo geométrico 2D</span>
        <span>
          {project.cameras.length} / {MAX_CAMERAS} cámaras
        </span>
      </div>
    </aside>
  )
}
