import { useEffect, useMemo, useRef, useState } from 'react'
import { clamp, rayEndpoint, visibilityPolygon } from '../lib/geometry.js'
import { matrixPaths } from '../lib/coverage.js'
import {
  coverageCellAt,
  createViewport,
  niceStep,
  visibleMatrixCells,
  viewTransform,
  uprightTransform,
} from '../lib/viewport.js'
import { format } from '../lib/format.js'
import useElementSize from '../hooks/useElementSize.js'
import Icon from './Icon.jsx'
import { Legend } from './Controls.jsx'
import { TriangulationOverlay } from './Triangulation.jsx'

export default function Plan({
  project,
  result,
  selected,
  onSelect,
  onMove,
  onAddCamera,
  wallStart,
  onWallStart,
  onAddWall,
  onDelete,
  probe,
  onProbe,
  tool,
  onTool,
  layer,
  onLayer,
  inspector,
  triangulation,
  measurementPick,
}) {
  const { space, cameras, walls } = project
  const [canvasRef, size] = useElementSize()
  const worldRef = useRef(null),
    dragRef = useRef(null),
    panRef = useRef(null),
    suppressClick = useRef(false)
  const [cursor, setCursor] = useState(null),
    [grid, setGrid] = useState(true),
    [panning, setPanning] = useState(false)
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 })
  const [orientation, setOrientation] = useState({ rotation: 0, flipX: false, flipY: false })
  const view = useMemo(
    () => createViewport(space, size, zoom, pan, orientation),
    [space, size, zoom, pan, orientation],
  )
  useEffect(() => {
    const canvas = canvasRef.current
    const wheel = (event) => {
      event.preventDefault()
      const next = clamp(zoom * Math.exp(-event.deltaY * 0.002), 0.5, 4)
      const bounds = canvas.getBoundingClientRect()
      const ratio = zoom / next
      setPan({
        x:
          pan.x +
          (event.clientX - bounds.left - bounds.width / 2) * view.unitsPerPixel * (1 - ratio),
        y:
          pan.y +
          (event.clientY - bounds.top - bounds.height / 2) * view.unitsPerPixel * (1 - ratio),
      })
      setZoom(next)
    }
    canvas.addEventListener('wheel', wheel, { passive: false })
    return () => canvas.removeEventListener('wheel', wheel)
  }, [canvasRef, zoom, pan, view.unitsPerPixel])
  const rotate = (amount) => {
    setOrientation((previous) => ({
      ...previous,
      rotation: (previous.rotation + amount + 360) % 360,
    }))
    setPan({ x: 0, y: 0 })
  }
  const u = view.unitsPerPixel
  const radius = view.markerRadius
  const paths = useMemo(() => matrixPaths(result, space), [result, space])
  const polygons = useMemo(
    () => cameras.map((camera) => visibilityPolygon(camera, space, walls)),
    [cameras, space, walls],
  )
  const cellLabels = useMemo(
    () => (layer === 'matrix' ? visibleMatrixCells(space, result, view) : []),
    [layer, space, result, view],
  )
  const selectedCell = layer === 'matrix' ? coverageCellAt(space, result, probe) : null
  const tick = niceStep(45 * u)
  const ticksX = Array.from(
    { length: Math.floor(space.width / tick) + 1 },
    (_, i) => Math.round(i * tick * 1000) / 1000,
  )
  const ticksY = Array.from(
    { length: Math.floor(space.height / tick) + 1 },
    (_, i) => Math.round(i * tick * 1000) / 1000,
  )
  const scaleLength = niceStep(60 * u)
  const position = (event, snap = true) => {
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      worldRef.current.getScreenCTM().inverse(),
    )
    return {
      x: clamp(snap ? Math.round(p.x * 20) / 20 : p.x, 0, space.width),
      y: clamp(snap ? Math.round(p.y * 20) / 20 : p.y, 0, space.height),
    }
  }
  const changeTool = (next) => {
    onTool(next)
    onWallStart(null)
  }
  const fit = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }
  const backgroundClick = (event) => {
    const p = position(event, !(tool === 'select' && layer === 'matrix'))
    if (tool === 'camera') onAddCamera(p)
    else if (tool === 'wall') {
      if (wallStart) {
        if (Math.hypot(wallStart.x - p.x, wallStart.y - p.y) >= 0.1) onAddWall(wallStart, p)
        onWallStart(null)
      } else onWallStart(p)
    } else {
      const cell = layer === 'matrix' ? coverageCellAt(space, result, p) : null
      onProbe(cell ? cell.center : p)
      onSelect(null)
    }
  }
  return (
    <section
      className="panel plan-panel integrated-editor"
      aria-label="Editor del plano"
      style={{ '--room-aspect': (space.width + 1.2) / (space.height + 1.2) }}
    >
      <div className="plan-heading">
        <div>
          <span className="drawing-eyebrow">ESPACIO DE TRABAJO</span>
          <h2>
            Plano de cobertura <span className="badge">2D</span>
          </h2>
          <p>
            {project.name} <span>·</span>
            {format(space.width, Number.isInteger(space.width) ? 0 : 2)} ×{' '}
            {format(space.height, Number.isInteger(space.height) ? 0 : 2)} m
          </p>
        </div>
        <div className="plan-heading-meta">
          <span className="live">
            <i />
            Cálculo en tiempo real
          </span>
          <span>Origen (0, 0) · metros</span>
        </div>
      </div>
      <div className="plan-toolbar">
        <div className="drawing-tools" role="group" aria-label="Herramientas de dibujo">
          {[
            ['select', 'arrow', 'Seleccionar'],
            ['camera', 'camera', 'Cámara'],
            ['wall', 'wall', 'Pared'],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={`tool ${tool === id ? 'active' : ''}`}
              onClick={() => changeTool(id)}
              aria-label={label}
              title={label}
              aria-pressed={tool === id}
            >
              <Icon name={icon} size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="drawing-view-tools">
          <div className="view-switcher" role="group" aria-label="Vista del plano">
            {[
              ['sectors', 'eye', 'Cobertura'],
              ['matrix', 'grid', 'Matriz'],
              ['blind', 'target', 'Puntos ciegos'],
            ].map(([id, icon, label]) => (
              <button
                key={id}
                aria-label={`Vista ${label}`}
                aria-pressed={layer === id}
                onClick={() => onLayer(id)}
              >
                <Icon name={icon} size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button
            className={`grid-toggle ${grid ? 'toggled' : ''}`}
            onClick={() => setGrid(!grid)}
            aria-label="Mostrar cuadrícula"
            aria-pressed={grid}
            title="Cuadrícula"
          >
            <Icon name="grid" size={16} />
          </button>
        </div>
      </div>
      <div className="view-navigation" role="group" aria-label="Navegación de la vista">
        <span className="navigation-help">
          <Icon name="hand" size={16} />
          Seleccionar: arrastra el fondo para mover la vista
        </span>
        <div className="orientation-actions">
          <button
            aria-label="Girar vista a la izquierda"
            title="Girar 90° a la izquierda"
            onClick={() => rotate(-90)}
          >
            <Icon name="rotateLeft" size={17} />
          </button>
          <button
            aria-label="Girar vista a la derecha"
            title="Girar 90° a la derecha"
            onClick={() => rotate(90)}
          >
            <Icon name="rotateRight" size={17} />
          </button>
          <span className="view-angle">{orientation.rotation}°</span>
          <button
            aria-label="Voltear vista horizontalmente"
            title="Voltear horizontalmente"
            aria-pressed={orientation.flipX}
            onClick={() => setOrientation((v) => ({ ...v, flipX: !v.flipX }))}
          >
            <Icon name="flipX" size={17} />
          </button>
          <button
            aria-label="Voltear vista verticalmente"
            title="Voltear verticalmente"
            aria-pressed={orientation.flipY}
            onClick={() => setOrientation((v) => ({ ...v, flipY: !v.flipY }))}
          >
            <Icon name="flipY" size={17} />
          </button>
          <button
            aria-label="Restablecer vista"
            title="Restablecer zoom, posición y orientación"
            onClick={() => {
              fit()
              setOrientation({ rotation: 0, flipX: false, flipY: false })
            }}
          >
            <Icon name="reset" size={16} />
          </button>
        </div>
      </div>
      {layer === 'matrix' && (
        <div className="matrix-view-bar">
          <span>
            <strong>M</strong>
            {result.rows} filas × {result.columns} columnas · celda {format(space.cellSize, 2)} m
          </span>
          <span>
            {cellLabels.length
              ? 'Cada valor indica cuántas cámaras ven esa celda.'
              : 'Acerca el plano para leer los valores de cada celda.'}
          </span>
        </div>
      )}
      <div className="editor-stage">
        <div className="editor-viewport">
          <div
            ref={canvasRef}
            className={`plan-canvas tool-${tool} view-${layer} ${panning ? 'is-panning' : ''}`}
          >
            <svg
              className="floor-plan"
              tabIndex={0}
              onPointerDownCapture={() => {
                suppressClick.current = false
              }}
              onClickCapture={(event) => {
                if (suppressClick.current) {
                  event.stopPropagation()
                  suppressClick.current = false
                }
              }}
              onPointerDown={(event) => {
                event.currentTarget.focus()
                if ((tool === 'select' && event.button === 0) || event.button === 1) {
                  event.preventDefault()
                  panRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                    pan: { ...pan },
                    u,
                    moved: false,
                  }
                }
              }}
              viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
              role="group"
              aria-label="Plano interactivo: con Seleccionar, arrastra una cámara para moverla o el fondo para desplazar la vista"
              onPointerMove={(event) => {
                if (panRef.current) {
                  const start = panRef.current
                  if (
                    !start.moved &&
                    Math.hypot(event.clientX - start.x, event.clientY - start.y) < 4
                  )
                    return
                  if (!start.moved) {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    setPanning(true)
                  }
                  start.moved = true
                  setPan({
                    x: start.pan.x - (event.clientX - start.x) * start.u,
                    y: start.pan.y - (event.clientY - start.y) * start.u,
                  })
                  return
                }
                const p = position(event)
                setCursor(p)
                if (dragRef.current)
                  onMove(dragRef.current.id, {
                    x: clamp(p.x - dragRef.current.offset.x, 0, space.width),
                    y: clamp(p.y - dragRef.current.offset.y, 0, space.height),
                  })
              }}
              onPointerUp={() => {
                suppressClick.current = !!panRef.current?.moved
                setPanning(false)
                dragRef.current = null
                panRef.current = null
              }}
              onPointerCancel={() => {
                suppressClick.current = false
                setPanning(false)
                dragRef.current = null
                panRef.current = null
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  onWallStart(null)
                  onTool('select')
                }
                if (event.key === 'Delete' || event.key === 'Backspace') {
                  event.preventDefault()
                  onDelete()
                }
              }}
            >
              <defs>
                <pattern id="plan-grid" width="1" height="1" patternUnits="userSpaceOnUse">
                  <path d="M1 0H0V1" fill="none" stroke="#b7c5d5" strokeWidth={0.7 * u} />
                </pattern>
                <pattern
                  id="matrix-grid"
                  width={space.cellSize}
                  height={space.cellSize}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M${space.cellSize} 0H0V${space.cellSize}`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={0.7 * u}
                  />
                </pattern>
                <pattern
                  id="blind-hatch"
                  width={8 * u}
                  height={8 * u}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line x1="0" x2="0" y1="0" y2={8 * u} stroke="#b77b56" strokeWidth={0.8 * u} />
                </pattern>
                <clipPath id="room-clip">
                  <rect width={space.width} height={space.height} />
                </clipPath>
              </defs>
              <g className="view-transform" transform={viewTransform(space, orientation)}>
                <g ref={worldRef} transform={`translate(0 ${space.height}) scale(1 -1)`}>
                  <rect
                    className="room-surface"
                    data-testid="room-boundary"
                    width={space.width}
                    height={space.height}
                    fill="#ffffff"
                    stroke="#586b81"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    onClick={backgroundClick}
                  />
                  <g clipPath="url(#room-clip)" pointerEvents="none">
                    {layer === 'sectors' &&
                      cameras.map((camera, i) => (
                        <polygon
                          key={camera.id}
                          points={polygons[i].map((p) => `${p.x},${p.y}`).join(' ')}
                          fill={camera.color}
                          fillOpacity={selected === camera.id ? 0.25 : 0.14}
                          stroke={camera.color}
                          strokeOpacity="0.7"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    {layer === 'matrix' &&
                      paths.map((d, i) => (
                        <path key={i} d={d} fill={['#f0dccb', '#b9dfd2', '#ad97cf'][i]} />
                      ))}
                    {layer === 'blind' && (
                      <>
                        <path d={paths[0]} fill="#f3d6c0" />
                        <path d={paths[0]} fill="url(#blind-hatch)" />
                        <path d={paths[1] + paths[2]} fill="#d0e7dc" />
                      </>
                    )}
                    {grid && (
                      <rect
                        width={space.width}
                        height={space.height}
                        fill={`url(#${layer === 'matrix' ? 'matrix-grid' : 'plan-grid'})`}
                      />
                    )}
                    {layer === 'matrix' &&
                      cellLabels.map((cell) => (
                        <text
                          key={`${cell.row}-${cell.column}`}
                          className="matrix-cell-value"
                          data-row={cell.row}
                          data-column={cell.column}
                          transform={uprightTransform(cell.x, cell.y, orientation, true)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={Math.min(11, space.cellSize * view.pixelsPerMeter * 0.65) * u}
                          fill={
                            cell.count > 1 ? '#3f285d' : cell.count === 1 ? '#245b4c' : '#7c5336'
                          }
                        >
                          {cell.count}
                        </text>
                      ))}
                    {layer === 'sectors' &&
                      cameras.map((camera) => {
                        const end = rayEndpoint(camera, camera.angle, space, walls)
                        return (
                          <line
                            key={camera.id}
                            x1={camera.x}
                            y1={camera.y}
                            x2={end.x}
                            y2={end.y}
                            stroke={camera.color}
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray={`${4 * u} ${5 * u}`}
                            opacity="0.6"
                          />
                        )
                      })}
                    {selectedCell && (
                      <rect
                        className="selected-matrix-cell"
                        x={selectedCell.x}
                        y={selectedCell.y}
                        width={selectedCell.width}
                        height={selectedCell.height}
                        fill="none"
                        stroke="#173f82"
                        strokeWidth="2.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                  {walls.map((wall, i) => (
                    <g
                      key={wall.id}
                      className="wall-object"
                      onPointerDown={(event) => event.stopPropagation()}
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleccionar pared ${i + 1}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (measurementPick) {
                          const p = position(event, false)
                          const nearest = [wall.a, wall.b].sort(
                            (a, b) =>
                              Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
                          )[0]
                          onProbe(
                            Math.hypot(nearest.x - p.x, nearest.y - p.y) <= 12 * u
                              ? { ...nearest }
                              : p,
                          )
                          return
                        }
                        onSelect(wall.id)
                        changeTool('select')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelect(wall.id)
                        }
                        if (event.key === 'Delete' || event.key === 'Backspace') {
                          event.preventDefault()
                          event.stopPropagation()
                          onDelete(wall.id)
                        }
                      }}
                    >
                      <line
                        className="wall-focus-ring"
                        x1={wall.a.x}
                        y1={wall.a.y}
                        x2={wall.b.x}
                        y2={wall.b.y}
                        stroke="#2563cc"
                        strokeWidth="8"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                      <line
                        x1={wall.a.x}
                        y1={wall.a.y}
                        x2={wall.b.x}
                        y2={wall.b.y}
                        stroke="transparent"
                        strokeWidth="14"
                        vectorEffect="non-scaling-stroke"
                      />
                      <line
                        x1={wall.a.x}
                        y1={wall.a.y}
                        x2={wall.b.x}
                        y2={wall.b.y}
                        stroke={selected === wall.id ? '#c96d23' : '#33465d'}
                        strokeWidth="4"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                      />
                      {[wall.a, wall.b].map((p, j) => (
                        <circle
                          key={j}
                          cx={p.x}
                          cy={p.y}
                          r={2.5 * u}
                          fill={selected === wall.id ? '#c96d23' : '#33465d'}
                        />
                      ))}
                    </g>
                  ))}
                  <TriangulationOverlay data={triangulation} units={u} orientation={orientation} />
                  {cameras.map((camera, i) => (
                    <g
                      key={camera.id}
                      className="camera-object"
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleccionar ${camera.name}`}
                      onPointerDown={(event) => {
                        if (tool !== 'select' || event.button !== 0) return
                        event.stopPropagation()
                        onSelect(camera.id)
                        const p = position(event)
                        dragRef.current = {
                          id: camera.id,
                          offset: { x: p.x - camera.x, y: p.y - camera.y },
                        }
                        event.currentTarget.setPointerCapture(event.pointerId)
                      }}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (tool === 'select') onSelect(camera.id)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelect(camera.id)
                        }
                        if (event.key === 'Delete' || event.key === 'Backspace') {
                          event.preventDefault()
                          event.stopPropagation()
                          onDelete(camera.id)
                        }
                        const moves = {
                          ArrowLeft: [-0.25, 0],
                          ArrowRight: [0.25, 0],
                          ArrowUp: [0, 0.25],
                          ArrowDown: [0, -0.25],
                        }
                        if (moves[event.key]) {
                          event.preventDefault()
                          onMove(camera.id, {
                            x: clamp(camera.x + moves[event.key][0], 0, space.width),
                            y: clamp(camera.y + moves[event.key][1], 0, space.height),
                          })
                        }
                      }}
                    >
                      <circle
                        className="camera-focus-ring"
                        cx={camera.x}
                        cy={camera.y}
                        r={17 * u}
                        fill="none"
                        stroke="#2563cc"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                      {selected === camera.id && (
                        <circle
                          cx={camera.x}
                          cy={camera.y}
                          r={15 * u}
                          fill="white"
                          fillOpacity="0.8"
                          stroke={camera.color}
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      )}
                      <g transform={`translate(${camera.x} ${camera.y}) rotate(${camera.angle})`}>
                        <circle
                          r={radius}
                          fill={camera.color}
                          stroke="white"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d={`M${radius * 0.45} ${-radius * 0.32}L${radius * 0.95} 0L${radius * 0.45} ${radius * 0.32}Z`}
                          fill="white"
                        />
                        <rect
                          x={-radius * 0.5}
                          y={-radius * 0.35}
                          width={radius * 0.75}
                          height={radius * 0.7}
                          rx={radius * 0.12}
                          fill="white"
                        />
                      </g>
                      <g
                        transform={uprightTransform(
                          camera.x,
                          camera.y < 32 * u ? camera.y + 22 * u : camera.y - 22 * u,
                          orientation,
                          true,
                        )}
                      >
                        <rect
                          x={-15 * u}
                          y={-8 * u}
                          width={30 * u}
                          height={16 * u}
                          rx={3 * u}
                          fill="white"
                          stroke="#bdccdc"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={10 * u}
                          fill="#2d4562"
                          fontWeight="600"
                        >
                          C{String(i + 1).padStart(2, '0')}
                        </text>
                      </g>
                    </g>
                  ))}
                  {probe && (
                    <g pointerEvents="none">
                      <circle
                        cx={probe.x}
                        cy={probe.y}
                        r={5 * u}
                        fill="none"
                        stroke="#b36537"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d={`M${probe.x - 9 * u} ${probe.y}h${18 * u}M${probe.x} ${probe.y - 9 * u}v${18 * u}`}
                        stroke="#b36537"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  )}
                  {wallStart && tool === 'wall' && (
                    <g pointerEvents="none">
                      <circle cx={wallStart.x} cy={wallStart.y} r={4 * u} fill="#c57a35" />
                      {cursor && (
                        <line
                          x1={wallStart.x}
                          y1={wallStart.y}
                          x2={cursor.x}
                          y2={cursor.y}
                          stroke="#c57a35"
                          strokeWidth="3"
                          vectorEffect="non-scaling-stroke"
                          strokeDasharray={`${7 * u} ${5 * u}`}
                        />
                      )}
                    </g>
                  )}
                </g>
                {ticksX.map((x) => (
                  <text
                    key={x}
                    transform={uprightTransform(x, space.height + 21 * u, orientation)}
                    textAnchor="middle"
                    fontSize={view.fontSize}
                    fill="#526780"
                    pointerEvents="none"
                  >
                    {format(x, Number.isInteger(x) ? 0 : 1)}
                  </text>
                ))}
                {ticksY.map((y) => (
                  <text
                    key={y}
                    transform={uprightTransform(-19 * u, space.height - y, orientation)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={view.fontSize}
                    fill="#526780"
                    pointerEvents="none"
                  >
                    {format(y, Number.isInteger(y) ? 0 : 1)}
                  </text>
                ))}
                <text
                  transform={uprightTransform(
                    space.width + 15 * u,
                    space.height + 21 * u,
                    orientation,
                  )}
                  fontSize={13 * u}
                  fill="#263f5b"
                >
                  X
                </text>
                <text
                  transform={uprightTransform(-20 * u, -15 * u, orientation)}
                  fontSize={13 * u}
                  fill="#263f5b"
                >
                  Y
                </text>
              </g>
            </svg>
            <div className="drawing-corner-label">
              <Icon name={layer === 'matrix' ? 'grid' : 'cross'} size={14} />
              {layer === 'matrix' ? 'MATRIZ SOBRE EL RECINTO' : 'VISTA SUPERIOR'}
              <span>1 unidad = 1 metro</span>
            </div>
            {selectedCell && (
              <div className="matrix-probe-card">
                <button
                  className="matrix-probe-close"
                  aria-label="Cerrar información de celda"
                  onClick={() => onProbe(null)}
                >
                  <Icon name="close" size={13} />
                </button>
                <strong>
                  M[{selectedCell.row + 1}, {selectedCell.column + 1}] = {selectedCell.count}
                </strong>
                <span>
                  Centro ({format(selectedCell.center.x, 2)}; {format(selectedCell.center.y, 2)}) m
                </span>
                <span>
                  {selectedCell.count === 0
                    ? 'Sin cobertura'
                    : `${selectedCell.count} ${selectedCell.count === 1 ? 'cámara' : 'cámaras'} visibles`}
                </span>
              </div>
            )}
            <div className="drawing-scale">
              <span>{format(scaleLength, scaleLength < 1 ? 1 : 0)} m</span>
              <i style={{ width: scaleLength * view.pixelsPerMeter }} />
            </div>
            <div className="zoom-control">
              <button
                aria-label="Alejar"
                onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))}
                disabled={zoom <= 0.5}
              >
                <Icon name="minus" size={16} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                aria-label="Acercar"
                onClick={() => setZoom((v) => Math.min(4, v + 0.25))}
                disabled={zoom >= 4}
              >
                <Icon name="plus" size={16} />
              </button>
              <button aria-label="Ajustar plano" title="Ver todo el recinto" onClick={fit}>
                <Icon name="expand" size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="inspector-slot">{inspector}</div>
      </div>
      <div className="plan-status">
        <span>
          <Icon name="info" size={14} />
          {tool === 'wall'
            ? wallStart
              ? 'Selecciona el segundo extremo · Esc cancela'
              : 'Haz clic en dos puntos para dibujar una pared'
            : tool === 'camera'
              ? 'Haz clic en el recinto para instalar una cámara'
              : layer === 'matrix'
                ? 'Haz clic en una celda para consultar su conteo y coordenadas'
                : 'Seleccionar: arrastra una cámara o el fondo · Rueda para zoom'}
        </span>
        <code>
          {cursor
            ? `X ${format(cursor.x, 2)} · Y ${format(cursor.y, 2)} m`
            : 'Coordenadas en metros'}
        </code>
      </div>
      <Legend mode={layer} />
    </section>
  )
}
