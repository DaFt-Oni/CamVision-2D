import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import Icon from './components/Icon.jsx'
import Plan from './components/Plan.jsx'
import Parameters from './components/Parameters.jsx'
import Analysis, { Metrics } from './components/Analysis.jsx'
import Mathematics from './components/Mathematics.jsx'
import { navigateTabs } from './lib/accessibility.js'
import useCoverage from './hooks/useCoverage.js'
import { NameInput, NumberField } from './components/Controls.jsx'
import { evaluateTriangulation, initialTriangulation } from './lib/triangulation.js'
import {
  COLORS,
  MAX_CAMERAS,
  MAX_WALLS,
  SCENARIOS,
  resizeProject,
  uid,
  validateProject,
} from './lib/project.js'
import useProjectWorkspace from './hooks/useProjectWorkspace.js'
import useToast from './hooks/useToast.js'
import { Toast, ConfirmAction } from './components/Feedback.jsx'
import {
  ProjectLauncher,
  SaveProjectForm,
  ExitProjectPrompt,
  LocalProjects,
  ProjectBadge,
} from './components/ProjectManager.jsx'
import { exportMatrix, exportProject, exportReport, exportPlanImage } from './lib/export.js'
import Home from './components/Home.jsx'
import SimulatorOverview from './components/SimulatorOverview.jsx'
import useDrawingFrame from './hooks/useDrawingFrame.js'
import { loadFrameSettings, saveFrameSettings } from './lib/frameSize.js'
import './App.css'
import './Workbench.css'
import './ProjectManager.css'
import './Editor.css'
import './Feedback.css'
import './Triangulation.css'
import './Refinements.css'

function App() {
  const workspace = useProjectWorkspace()
  const { toast, showToast, dismissToast } = useToast()
  const { project, setProject, library, setLibrary, storageError } = workspace
  const hasSavedProject = library.some((entry) => entry.id === project.id && !entry.draft)
  const triangulationSettings = useMemo(
    () => ({ ...initialTriangulation(project), ...project.measurement }),
    [project],
  )
  const [mathCameraId, setMathCameraId] = useState(project.cameras[0]?.id || '')
  const [frameSettings, setFrameSettings] = useState(loadFrameSettings)
  const [pendingAction, setPendingAction] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [planLayer, setPlanLayer] = useState('sectors')
  const [inspectorTab, setInspectorTab] = useState('cameras')
  const [page, setPage] = useState(() =>
      location.hash === '#simulator' && library.some((e) => e.id === project.id)
        ? 'simulator'
        : 'home',
    ),
    [selected, setSelected] = useState(() => project.cameras[0]?.id || null)
  const [wallStart, setWallStart] = useState(null)
  const probe = project.measurement?.probe || null
  const setProbe = (point) =>
    setProject(
      (p) => ({
        ...p,
        measurement: {
          ...initialTriangulation(p),
          ...p.measurement,
          probe: typeof point === 'function' ? point(p.measurement?.probe || null) : point,
        },
      }),
      { group: 'probe' },
    )
  const [tool, setTool] = useState('select')
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem('camvision.compact') !== 'false'
    } catch {
      return true
    }
  })
  const [mobilePanel, setMobilePanel] = useState(false)
  const [wallCoordinates, setWallCoordinates] = useState({ ax: 1, ay: 1, bx: 4, by: 1 })
  const [modal, setModal] = useState(null),
    [menu, setMenu] = useState(null)
  const fileRef = useRef(null),
    dialogRef = useRef(null)
  const { result, calculating } = useCoverage(project)
  const triangulation = useMemo(
    () => evaluateTriangulation(project, triangulationSettings, probe),
    [project, triangulationSettings, probe],
  )
  const updateTriangulation = (changes) =>
    setProject(
      (p) => ({ ...p, measurement: { ...initialTriangulation(p), ...p.measurement, ...changes } }),
      { group: 'measurement' },
    )
  const changeInspectorTab = (tab) => {
    setInspectorTab(tab)
    if (tab === 'triangulation') {
      updateTriangulation({ enabled: true })
      setTool('select')
      setWallStart(null)
    }
  }
  const configureTriangulation = () => {
    changeInspectorTab('triangulation')
    document.querySelector('.plan-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const explainTriangulation = () => {
    setActiveTab('math')
    requestAnimationFrame(() =>
      document
        .getElementById('triangulation-math')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }
  const camera = project.cameras.find((c) => c.id === selected)
  const mathCamera =
    project.cameras.find((c) => c.id === mathCameraId) || camera || project.cameras[0]
  const { ref: drawingLayoutRef, frame } = useDrawingFrame(
    project.space,
    frameSettings,
    page === 'simulator',
  )
  useEffect(() => {
    saveFrameSettings(frameSettings)
  }, [frameSettings])
  useEffect(() => {
    if (storageError)
      showToast(
        'No se pudo preguardar el proyecto. Exporta un archivo JSON para conservar los cambios.',
        { type: 'error', title: 'Almacenamiento no disponible' },
      )
  }, [storageError, showToast])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])
  useEffect(() => {
    if (modal) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [modal])
  useEffect(() => {
    if (!menu) return
    const close = (event) => {
      if (!event.target.closest('.dropdown-root')) setMenu(null)
    }
    const escape = (event) => {
      if (event.key === 'Escape') setMenu(null)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [menu])
  const changeTool = (next) => {
    setWallStart(null)
    setTool(next)
  }
  const beginProject = (next, options = {}) => {
    workspace.begin(next, options)
    setPage('simulator')
    setActiveTab('overview')
    setSelected(next.cameras[0]?.id || null)
    setInspectorTab(next.cameras.length ? 'cameras' : 'space')
    setMathCameraId(next.cameras[0]?.id || '')
    setMobilePanel(false)
    changeTool('select')
    setMenu(null)
    setModal(null)
    setPendingAction(null)
    if (location.hash !== '#simulator') history.pushState(null, '', '#simulator')
    requestAnimationFrame(() =>
      document.getElementById('editor-title')?.focus({ preventScroll: true }),
    )
  }
  const cancelConfirmation = () => {
    setModal(confirmation?.returnTo || null)
    setConfirmation(null)
  }
  const closeModal = () => {
    if (modal === 'confirm-delete') {
      cancelConfirmation()
      return
    }
    setModal(null)
    setPendingAction(null)
  }
  const goHome = () => {
    setPage('home')
    closeModal()
    setMobilePanel(false)
    if (location.hash !== '#home') history.pushState(null, '', '#home')
  }
  const requestExit = (action) => {
    setPendingAction(action)
    if (hasSavedProject && !workspace.dirty && !workspace.conflict) {
      workspace
        .save({}, true)
        .then((saved) => {
          if (action.type === 'open')
            beginProject(
              action.project.id === project.id && !action.options?.fresh ? saved : action.project,
              action.options,
            )
          else goHome()
        })
        .catch((error) => showToast(error.message, { type: 'error' }))
    } else setModal(hasSavedProject ? 'confirm-exit' : 'save-exit')
  }
  const openProject = (next, options = {}) => {
    if (page === 'simulator') {
      requestExit({ type: 'open', project: next, options })
    } else beginProject(next, options)
  }
  const navigate = (next) => {
    setMenu(null)
    if (next === 'home') {
      if (page === 'simulator') {
        requestExit({ type: 'home' })
      }
      return
    }
    if (page === 'home') setModal('launcher')
    else setActiveTab(['analysis', 'math'].includes(next) ? next : 'overview')
  }
  const completeExit = (resolvedProject) => {
    if (pendingAction?.type === 'open') {
      const next =
        pendingAction.project.id === project.id && !pendingAction.options?.fresh
          ? resolvedProject
          : pendingAction.project
      beginProject(next, pendingAction.options)
    } else {
      goHome()
    }
  }
  const confirmIdentity = async (identity) => {
    if (
      document.querySelector('main [aria-invalid="true"], .workspace-project [aria-invalid="true"]')
    )
      return 'Hay campos sin confirmar. Vuelve a Seguir editando y corrige los datos marcados antes de guardar.'
    try {
      const leaving = modal === 'save-exit' || modal === 'confirm-exit'
      const saved = await workspace.save(identity, leaving)
      if (leaving) completeExit(saved)
      else closeModal()
      showToast('Proyecto guardado en este navegador.', { title: 'Proyecto guardado' })
    } catch (error) {
      return workspace.conflict || error.name === 'WorkspaceConflict'
        ? error.message
        : 'No se pudo guardar en este navegador. Sigue editando y exporta el proyecto JSON para conservarlo.'
    }
  }
  const onHistory = useEffectEvent(() => {
    if (location.hash === '#simulator' && page === 'home') {
      const entry = library.find((e) => e.id === project.id)
      if (entry) beginProject(entry.project)
      else navigate('simulator')
    } else if ((location.hash === '#home' || !location.hash) && page === 'simulator')
      navigate('home')
  })
  const onKeyboard = useEffectEvent((event) => {
    if (page !== 'simulator' || modal) return
    const input = event.target.closest('input,textarea,select,[contenteditable="true"]')
    if (
      !input &&
      (event.ctrlKey || event.metaKey) &&
      ['z', 'y'].includes(event.key.toLowerCase())
    ) {
      event.preventDefault()
      if (event.key.toLowerCase() === 'y' || event.shiftKey) workspace.redo()
      else workspace.undo()
    }
    if (!input && event.key === 'Escape') {
      setWallStart(null)
      setTool('select')
      setMobilePanel(false)
    }
  })
  useEffect(() => {
    window.addEventListener('popstate', onHistory)
    document.addEventListener('keydown', onKeyboard)
    return () => {
      window.removeEventListener('popstate', onHistory)
      document.removeEventListener('keydown', onKeyboard)
    }
  }, [])
  const discardAndExit = async () => {
    try {
      const restored = await workspace.discard()
      completeExit(restored)
      showToast(
        hasSavedProject
          ? 'Se conserva la última versión guardada del proyecto.'
          : 'Se descartó el proyecto sin guardar.',
        { title: 'Salida sin guardar' },
      )
    } catch {
      return 'No se pudo descartar el preguardado en este navegador. Inténtalo de nuevo; el proyecto sigue abierto.'
    }
  }
  const selectObject = (id) => {
    setSelected(id)
    if (project.cameras.some((camera) => camera.id === id)) {
      setInspectorTab('cameras')
      setMathCameraId(id)
    }
    if (project.walls.some((wall) => wall.id === id)) setInspectorTab('walls')
  }
  const updateCamera = (id, changes, options = {}) =>
    setProject(
      (p) => ({
        ...p,
        cameras: p.cameras.map((c) => (c.id === id ? { ...c, ...changes } : c)),
      }),
      { group: options.group || `camera:${id}` },
    )
  const addCamera = (position = { x: project.space.width / 2, y: project.space.height / 2 }) => {
    if (project.cameras.length >= MAX_CAMERAS)
      return showToast('Se admite un máximo de 16 cámaras.', {
        type: 'warning',
        title: 'Límite de cámaras',
      })
    const id = uid()
    let index = project.cameras.length + 1
    while (project.cameras.some((c) => c.name === `Cámara ${String(index).padStart(2, '0')}`))
      index++
    const c = {
      id,
      name: `Cámara ${String(index).padStart(2, '0')}`,
      ...position,
      angle: 90,
      fov: 90,
      range: 6,
      color: COLORS[project.cameras.length % COLORS.length],
    }
    setProject((p) => ({ ...p, cameras: [...p.cameras, c] }))
    setSelected(id)
    setInspectorTab('cameras')
    changeTool('select')
  }
  const addWall = (a, b) => {
    if (project.walls.length >= MAX_WALLS)
      return showToast('Se admite un máximo de 32 paredes.', {
        type: 'warning',
        title: 'Límite de paredes',
      })
    const id = uid()
    setProject((p) => ({ ...p, walls: [...p.walls, { id, a, b }] }))
    setSelected(id)
    setInspectorTab('walls')
  }
  const updateWall = (id, end, point) =>
    setProject((p) => ({
      ...p,
      walls: p.walls.map((w) => {
        if (
          w.id !== id ||
          Math.hypot(
            point.x - w[end === 'a' ? 'b' : 'a'].x,
            point.y - w[end === 'a' ? 'b' : 'a'].y,
          ) < 0.01
        )
          return w
        return { ...w, [end]: point }
      }),
    }))
  const deleteSelected = (targetId) => {
    const id = typeof targetId === 'string' ? targetId : selected
    const camera = project.cameras.find((item) => item.id === id)
    const wallIndex = project.walls.findIndex((item) => item.id === id)
    if (!camera && wallIndex < 0) return
    dismissToast()
    setConfirmation({
      id,
      kind: camera ? 'camera' : 'wall',
      name: camera?.name || `Pared ${String(wallIndex + 1).padStart(2, '0')}`,
      returnTo: null,
    })
    setModal('confirm-delete')
  }
  const requestProjectDeletion = (id) => {
    const entry = library.find((item) => item.id === id)
    if (!entry) return
    if (page === 'simulator' && id === project.id) {
      showToast(
        'Este proyecto está abierto. Vuelve al menú principal para eliminarlo de los locales.',
        { type: 'warning', title: 'Proyecto en uso' },
      )
      return
    }
    dismissToast()
    setConfirmation({ id, kind: 'project', name: entry.project.name, returnTo: 'library' })
    setModal('confirm-delete')
  }
  const confirmDeletion = async () => {
    if (!confirmation) return
    if (confirmation.kind === 'project') {
      if (
        !(await setLibrary((previous) => previous.filter((entry) => entry.id !== confirmation.id)))
      ) {
        showToast('No se pudo eliminar el proyecto del almacenamiento local.', { type: 'error' })
        return
      }
    } else {
      setProject((previous) => ({
        ...previous,
        cameras: previous.cameras.filter((item) => item.id !== confirmation.id),
        walls: previous.walls.filter((item) => item.id !== confirmation.id),
      }))
      if (selected === confirmation.id) setSelected(null)
    }
    showToast(
      `«${confirmation.name}» se eliminó ${confirmation.kind === 'project' ? 'de los proyectos locales' : 'del plano'}.`,
      { title: 'Eliminación completada' },
    )
    cancelConfirmation()
  }
  const saveLocal = async () => {
    setPendingAction(null)
    if (hasSavedProject) {
      const error = await confirmIdentity({})
      if (error) showToast(error, { type: 'error', title: 'No se pudo guardar' })
    } else setModal('save-project')
  }
  const importFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('El archivo supera el límite de 2 MB.')
      const data = JSON.parse(await file.text())
      if (!data || !['camvision', 'optivision'].includes(data.format) || data.version !== 1)
        throw new Error('Selecciona un proyecto JSON exportado por CamVision (versión 1).')
      const imported = validateProject(data.project)
      openProject(imported, { fresh: true })
    } catch (error) {
      showToast(
        error instanceof SyntaxError
          ? 'El archivo no contiene JSON válido.'
          : error instanceof DOMException
            ? 'No se pudo leer el archivo. Selecciónalo de nuevo o usa otra copia.'
            : error.message,
        { type: 'error', title: 'No se pudo importar el proyecto' },
      )
    }
  }
  const exportAction = async (type) => {
    setMenu(null)
    try {
      if (type === 'json') exportProject(project)
      if (type === 'txt')
        exportReport(project, result, triangulationSettings.enabled ? triangulation : null)
      if (type === 'csv') exportMatrix(project, result)
      if (type === 'png' || type === 'svg') {
        if (calculating)
          throw new Error('Espera a que termine el cálculo antes de exportar el plano.')
        await exportPlanImage(document.querySelector('.floor-plan'), project, result, type)
      }
      showToast('Archivo exportado. Revisa tus descargas.', { title: 'Exportación completada' })
    } catch {
      showToast('No se pudo generar el archivo. Vuelve a intentarlo.', {
        type: 'error',
        title: 'Error al exportar',
      })
    }
  }

  return (
    <div
      className={`app-shell ${page === 'home' ? 'is-home' : 'workbench'} ${compact ? 'compact-workspace' : ''} ${mobilePanel ? 'parameters-open' : ''}`}
      data-section={page}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          const target = document.getElementById(page === 'home' ? 'main-content' : 'editor-title')
          target?.focus({ preventScroll: true })
          target?.scrollIntoView({ block: 'start' })
        }}
      >
        Saltar al contenido
      </a>
      <div className="main-shell">
        <header className="topbar">
          <a
            className="home-brand"
            href="#home"
            aria-label="CamVision, menú principal"
            onClick={(event) => {
              event.preventDefault()
              navigate('home')
            }}
          >
            <span className="brand-mark">
              <Icon name="eye" size={25} />
            </span>
            <span>
              Cam<strong>Vision</strong>
              <small>SIMULACIÓN DE COBERTURA 2D</small>
            </span>
          </a>
          {page !== 'home' && (
            <div className="workspace-project">
              <button
                className="home-return"
                onClick={() => navigate('home')}
                aria-label="Menú principal"
              >
                <Icon name="home" size={15} />
                <span>Menú principal</span>
              </button>
              <span className="workspace-separator" />
              <label>
                <span className="sr-only">Nombre del proyecto</span>
                <ProjectBadge project={project} size={14} />
                <NameInput
                  aria-label="Nombre del proyecto"
                  value={project.name}
                  maxLength={80}
                  onChange={(name) =>
                    setProject((previous) => ({
                      ...previous,
                      name,
                    }))
                  }
                />
              </label>
            </div>
          )}
          <div className="topbar-actions">
            <span className={`save-status ${storageError ? 'error' : ''}`}>
              <i />
              {workspace.conflict
                ? 'Conflicto entre pestañas'
                : storageError
                  ? 'Guardado no disponible'
                  : !workspace.active
                    ? library.length
                      ? 'En este navegador'
                      : 'Ejemplo de vista previa'
                    : workspace.saving
                      ? 'Preguardando…'
                      : workspace.dirty
                        ? 'Cambios pendientes · recuperación activa'
                        : 'Guardado confirmado'}
            </span>
            <span className="local-badge">
              <i />
              LOCAL
            </span>
            <button
              className="avatar"
              title="Guía del simulador"
              aria-label="Guía del simulador"
              onClick={() => setModal('guide')}
            >
              <Icon name="book" size={17} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {page === 'home' ? (
            <Home
              project={project}
              result={result}
              libraryCount={library.length}
              onNavigate={navigate}
              onLibrary={() => setModal('library')}
              onImport={() => fileRef.current.click()}
              onScenario={(scenario) => {
                openProject(scenario.project, { fresh: true })
              }}
              onGuide={() => setModal('guide')}
            />
          ) : (
            <>
              {workspace.recovered && (
                <p className="workspace-notice" role="status">
                  Se recuperaron datos del navegador. Revisa el proyecto y exporta una copia JSON.
                </p>
              )}
              {workspace.conflict && (
                <div className="workspace-notice conflict" role="alert">
                  <p>
                    Este proyecto cambió en otra pestaña. Tus cambios siguen abiertos y el
                    preguardado está detenido para no sobrescribirlos.
                  </p>
                  <button
                    className="btn"
                    onClick={() =>
                      workspace
                        .resolveConflict(false)
                        .catch((e) => showToast(e.message, { type: 'error' }))
                    }
                  >
                    Abrir versión de la otra pestaña
                  </button>
                  <button
                    className="btn primary"
                    onClick={() =>
                      workspace
                        .resolveConflict(true)
                        .catch((e) => showToast(e.message, { type: 'error' }))
                    }
                  >
                    Conservar mis cambios en una copia
                  </button>
                </div>
              )}
              <div className="workbench-heading">
                <div>
                  <h1 id="editor-title" tabIndex={-1}>
                    Simulador de cobertura
                  </h1>
                  <span>Plano, configuración y resultados en un mismo espacio</span>
                </div>
                <div className="page-actions">
                  <button
                    className="btn"
                    aria-pressed={compact}
                    onClick={() => {
                      setCompact(!compact)
                      try {
                        localStorage.setItem('camvision.compact', String(!compact))
                      } catch {
                        /* Optional preference. */
                      }
                    }}
                  >
                    {compact ? 'Mostrar indicadores' : 'Vista compacta'}
                  </button>
                  <button
                    className="btn"
                    disabled={!workspace.past?.length}
                    onClick={workspace.undo}
                    title="Deshacer · Ctrl+Z"
                  >
                    Deshacer
                  </button>
                  <button
                    className="btn"
                    disabled={!workspace.future?.length}
                    onClick={workspace.redo}
                    title="Rehacer · Ctrl+Mayús+Z"
                  >
                    Rehacer
                  </button>
                  <button className="btn" onClick={() => setModal('library')}>
                    <Icon name="folder" size={15} />
                    <span>Proyectos locales</span>
                  </button>
                  <button className="btn" onClick={saveLocal}>
                    <Icon name="save" size={15} />
                    Guardar
                  </button>
                  {hasSavedProject && (
                    <button className="btn" onClick={() => setModal('project-properties')}>
                      Propiedades
                    </button>
                  )}
                  <div className="dropdown-root">
                    <button
                      className="btn primary"
                      aria-expanded={menu === 'export'}
                      onClick={() => setMenu(menu === 'export' ? null : 'export')}
                    >
                      <Icon name="download" size={15} />
                      Exportar
                      <Icon name="down" size={12} />
                    </button>
                    {menu === 'export' && (
                      <div className="dropdown export-menu">
                        <button onClick={() => exportAction('png')}>
                          <Icon name="download" size={16} />
                          <span>
                            Imagen del plano<small>Vista actual con escala y resultados</small>
                          </span>
                          <b>PNG</b>
                        </button>
                        <button onClick={() => exportAction('svg')}>
                          <Icon name="download" size={16} />
                          <span>
                            Plano vectorial<small>Imagen ampliable para informes</small>
                          </span>
                          <b>SVG</b>
                        </button>
                        <button onClick={() => exportAction('txt')}>
                          <Icon name="book" size={16} />
                          <span>
                            Informe de resultados<small>Fórmulas, parámetros y resultados</small>
                          </span>
                          <b>TXT</b>
                        </button>
                        <button onClick={() => exportAction('json')}>
                          <Icon name="save" size={16} />
                          <span>
                            Proyecto completo<small>Espacio, cámaras y paredes</small>
                          </span>
                          <b>JSON</b>
                        </button>
                        <button onClick={() => exportAction('csv')}>
                          <Icon name="grid" size={16} />
                          <span>
                            Matriz de cobertura<small>Todas las celdas y coordenadas</small>
                          </span>
                          <b>CSV</b>
                        </button>
                        <div className="dropdown-divider" />
                        <button
                          onClick={() => {
                            fileRef.current.click()
                            setMenu(null)
                          }}
                        >
                          <Icon name="upload" size={16} />
                          <span>Importar proyecto JSON</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="compact-metrics" role="status">
                {calculating
                  ? 'Actualizando estimación…'
                  : `Cobertura ${result.coverage.toFixed(1)} % · Zona ciega ${result.blind.toFixed(1)} % · ${project.cameras.length} cámaras`}
              </p>
              <div className="expanded-metrics">
                <Metrics result={result} />
              </div>
              <p className="overlap-help">
                La superposición está incluida en la cobertura; los porcentajes de esas dos tarjetas
                no se suman.
              </p>
              {!project.cameras.length && (
                <div className="workspace-notice">
                  <span>Comienza definiendo el recinto y añadiendo tu primera cámara.</span>
                  <button className="btn primary" onClick={() => addCamera()}>
                    Añadir primera cámara
                  </button>
                </div>
              )}
              <div
                className="drawing-layout"
                ref={drawingLayoutRef}
                style={{
                  '--drawing-width': `${frame.drawingWidth}px`,
                  '--drawing-height': `${frame.drawingHeight}px`,
                  '--drawing-grid-width': `${frame.gridWidth}px`,
                }}
              >
                <div className="simulator-grid">
                  <Plan
                    key={project.id}
                    project={project}
                    result={result}
                    selected={selected}
                    onSelect={selectObject}
                    onMove={updateCamera}
                    onAddCamera={addCamera}
                    wallStart={wallStart}
                    onWallStart={setWallStart}
                    onAddWall={addWall}
                    onDelete={deleteSelected}
                    probe={probe}
                    onProbe={setProbe}
                    tool={tool}
                    onTool={changeTool}
                    layer={planLayer}
                    onLayer={setPlanLayer}
                    triangulation={triangulationSettings.enabled ? triangulation : null}
                    measurementPick={
                      inspectorTab === 'triangulation' &&
                      triangulationSettings.mode === 'point' &&
                      triangulationSettings.target === 'probe'
                    }
                    calculating={calculating}
                    onParameters={() => {
                      setMobilePanel(!mobilePanel)
                      if (!mobilePanel)
                        document
                          .querySelector('.floor-plan')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    inspector={
                      <Parameters
                        project={project}
                        result={result}
                        selected={selected}
                        tab={inspectorTab}
                        onTab={changeInspectorTab}
                        triangulationSettings={triangulationSettings}
                        triangulation={triangulation}
                        onTriangulation={updateTriangulation}
                        onExplainTriangulation={explainTriangulation}
                        probe={probe}
                        onProbe={setProbe}
                        frameSettings={frameSettings}
                        frameScale={frame.effectiveScale}
                        onFrameSettings={setFrameSettings}
                        onSelect={selectObject}
                        onSpace={(changes) => {
                          setProject((previous) => resizeProject(previous, changes))
                          setWallStart(null)
                          setProbe(null)
                        }}
                        onCamera={updateCamera}
                        onWall={updateWall}
                        onDelete={deleteSelected}
                        onAddCamera={() => addCamera()}
                        onAddWallByCoordinates={() => {
                          setWallCoordinates({
                            ax: 1,
                            ay: 1,
                            bx: Math.min(4, project.space.width),
                            by: 1,
                          })
                          setModal('wall-coordinates')
                        }}
                        onClose={() => setMobilePanel(false)}
                        onTool={changeTool}
                      />
                    }
                  />
                </div>
              </div>
              <section
                className="results-dock"
                aria-label="Resultados del simulador"
                aria-busy={calculating}
              >
                <div className="results-dock-bar">
                  <div
                    className="results-tabs"
                    role="tablist"
                    aria-label="Resultados y herramientas"
                  >
                    {[
                      ['overview', 'grid', 'Resumen'],
                      ['analysis', 'chart', 'Análisis'],
                      ['math', 'math', 'Matemáticas'],
                    ].map(([id, icon, label]) => (
                      <button
                        id={`results-tab-${id}`}
                        key={id}
                        role="tab"
                        aria-selected={activeTab === id}
                        tabIndex={activeTab === id ? 0 : -1}
                        onKeyDown={(event) =>
                          navigateTabs(
                            event,
                            ['overview', 'analysis', 'math'],
                            activeTab,
                            setActiveTab,
                          )
                        }
                        aria-controls="results-content"
                        onClick={() => setActiveTab(id)}
                      >
                        <Icon name={icon} size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="dropdown-root">
                    <button
                      className="scenario-button"
                      aria-expanded={menu === 'scenarios'}
                      onClick={() => setMenu(menu === 'scenarios' ? null : 'scenarios')}
                    >
                      <Icon name="folder" size={14} />
                      <span>Escenarios</span>
                      <Icon name="down" size={12} />
                    </button>
                    {menu === 'scenarios' && (
                      <div className="dropdown scenario-menu">
                        {SCENARIOS.map((scenario) => (
                          <button
                            key={scenario.id}
                            onClick={() => {
                              openProject(scenario.project, { fresh: true })
                              setMenu(null)
                            }}
                          >
                            <span>
                              {scenario.label}
                              <small>{scenario.description}</small>
                            </span>
                            <Icon name="chevron" size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  id="results-content"
                  role="tabpanel"
                  aria-labelledby={`results-tab-${activeTab}`}
                >
                  {activeTab === 'overview' && (
                    <SimulatorOverview
                      result={result}
                      camera={mathCamera}
                      project={project}
                      onCamera={selectObject}
                      onTab={setActiveTab}
                    />
                  )}
                  {activeTab === 'analysis' && <Analysis project={project} result={result} />}
                  {activeTab === 'math' && (
                    <Mathematics
                      project={project}
                      result={result}
                      camera={mathCamera}
                      onCamera={selectObject}
                      probe={probe}
                      onProbe={setProbe}
                      triangulation={triangulation}
                      onConfigureTriangulation={configureTriangulation}
                      onShowMatrix={() => {
                        setPlanLayer('matrix')
                        document
                          .querySelector('.plan-panel')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                    />
                  )}
                </div>
              </section>
              <footer>
                <span>
                  <span className="tiny-dot" />
                  CamVision · Modelo geométrico 2D
                </span>
                <span>Funciones y Matrices · INACAP</span>
              </footer>
            </>
          )}
        </main>
      </div>
      <input
        type="file"
        ref={fileRef}
        className="sr-only"
        accept=".json,application/json"
        aria-label="Importar archivo de proyecto"
        onChange={importFile}
      />
      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault()
          closeModal()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal()
        }}
        aria-labelledby="dialog-title"
        aria-describedby={modal === 'confirm-delete' ? 'confirmation-description' : undefined}
      >
        <div className="dialog-inner">
          <div className="dialog-header">
            <div>
              <span className="eyebrow">CAMVISION / LOCAL</span>
              <h2 id="dialog-title">
                {modal === 'library'
                  ? 'Proyectos locales'
                  : modal === 'wall-coordinates'
                    ? 'Crear pared por coordenadas'
                    : modal === 'launcher'
                      ? 'Abrir simulador'
                      : modal === 'save-exit'
                        ? '¿Guardar este proyecto?'
                        : modal === 'confirm-exit'
                          ? 'Salir del proyecto'
                          : modal === 'project-properties'
                            ? 'Propiedades del proyecto'
                            : modal === 'confirm-delete'
                              ? `Eliminar ${confirmation?.kind === 'project' ? 'proyecto' : confirmation?.kind === 'camera' ? 'cámara' : 'pared'}`
                              : modal === 'save-project'
                                ? 'Guardar proyecto'
                                : 'Guía del simulador'}
              </h2>
            </div>
            <button className="icon-button" aria-label="Cerrar diálogo" onClick={closeModal}>
              <Icon name="close" />
            </button>
          </div>
          {modal === 'wall-coordinates' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                const invalid = event.currentTarget.querySelector('[aria-invalid="true"]')
                if (invalid) {
                  invalid.focus()
                  return
                }
                const { ax, ay, bx, by } = wallCoordinates
                if (Math.hypot(ax - bx, ay - by) < 0.1)
                  return showToast('La pared debe medir al menos 0,10 m.', { type: 'warning' })
                addWall({ x: ax, y: ay }, { x: bx, y: by })
                closeModal()
                setMobilePanel(true)
              }}
            >
              <p className="dialog-description">
                Introduce los extremos A y B en metros. Confirma cada campo con Enter o Tab.
              </p>
              <div className="field-grid">
                {[
                  ['ax', 'A · X', project.space.width],
                  ['ay', 'A · Y', project.space.height],
                  ['bx', 'B · X', project.space.width],
                  ['by', 'B · Y', project.space.height],
                ].map(([key, label, max]) => (
                  <NumberField
                    key={key}
                    label={label}
                    value={wallCoordinates[key]}
                    min={0}
                    max={max}
                    unit="m"
                    onChange={(value) => setWallCoordinates((p) => ({ ...p, [key]: value }))}
                  />
                ))}
              </div>
              <div className="project-form-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn primary" type="submit">
                  Crear pared
                </button>
              </div>
            </form>
          ) : modal === 'confirm-delete' && confirmation ? (
            <ConfirmAction
              confirmation={confirmation}
              onCancel={cancelConfirmation}
              onConfirm={confirmDeletion}
            />
          ) : modal === 'launcher' ? (
            <ProjectLauncher
              library={library}
              project={project}
              onOpen={openProject}
              onImport={() => fileRef.current.click()}
            />
          ) : modal === 'confirm-exit' ? (
            <ExitProjectPrompt
              project={project}
              onSave={() => confirmIdentity({})}
              onDiscard={discardAndExit}
              onCancel={closeModal}
            />
          ) : ['save-project', 'save-exit', 'project-properties'].includes(modal) ? (
            <SaveProjectForm
              key={`${modal}-${project.id}`}
              project={project}
              leaving={modal === 'save-exit'}
              editingProperties={modal === 'project-properties'}
              onSave={confirmIdentity}
              onDiscard={discardAndExit}
              onCancel={closeModal}
            />
          ) : modal === 'library' ? (
            <>
              <p className="dialog-description">
                Proyectos guardados y borradores automáticos de este navegador.
              </p>
              <LocalProjects
                library={library}
                onOpen={openProject}
                onDelete={requestProjectDeletion}
              />
              <button className="btn" onClick={() => fileRef.current.click()}>
                <Icon name="upload" size={16} />
                Importar proyecto JSON
              </button>
            </>
          ) : (
            <>
              <div className="guide-steps">
                <div>
                  <b>01</b>
                  <span>
                    <strong>Define el espacio</strong>
                    <p>
                      Ingresa ancho y largo (2–50 m). El origen está abajo a la izquierda. La
                      cuadrícula representa 1 m.
                    </p>
                  </span>
                </div>
                <div>
                  <b>02</b>
                  <span>
                    <strong>Instala y orienta las cámaras</strong>
                    <p>
                      Usa la herramienta Cámara o el botón +. Arrastra sobre el plano o usa las
                      flechas con la cámara enfocada. Ajusta θ, α y alcance desde el panel.
                    </p>
                  </span>
                </div>
                <div>
                  <b>03</b>
                  <span>
                    <strong>Prueba los puntos ciegos</strong>
                    <p>
                      Con Pared, selecciona dos extremos. Cambia la capa del plano a Matriz o Puntos
                      ciegos. Esc cancela el dibujo; Supr elimina el objeto enfocado.
                    </p>
                  </span>
                </div>
                <div>
                  <b>04</b>
                  <span>
                    <strong>Comprueba los cálculos</strong>
                    <p>
                      Carga el escenario 10 × 8 m. Selecciona una cámara en Matemáticas, revisa sus
                      cálculos y prueba un punto para comprobar alcance, ángulo y paredes. Exporta
                      el informe.
                    </p>
                  </span>
                </div>
                <div>
                  <b>05</b>
                  <span>
                    <strong>Triangula un punto entre dos cámaras</strong>
                    <p>
                      En Parámetros → Medición, elige A y B y un punto del plano, un extremo de
                      pared o dos ángulos interiores. Matemáticas muestra las leyes de senos y
                      cosenos. El ejemplo Triangulación 6–5–5 incluye una base de 6 m y una esquina
                      a 5 m de ambas cámaras.
                    </p>
                  </span>
                </div>
              </div>
              <div className="note">
                <Icon name="info" />
                <p>
                  Modelo académico geométrico 2D. Las paredes son segmentos sin espesor y los
                  resultados se estiman por centros de celda. No simula altura, iluminación ni
                  calidad de video.
                </p>
              </div>
              <button
                className="btn primary"
                onClick={() => {
                  openProject(SCENARIOS[1].project, { fresh: true })
                }}
              >
                Cargar demostración 10 × 8<Icon name="chevron" size={16} />
              </button>
            </>
          )}
        </div>
        {toast && modal && <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />}
      </dialog>
      {toast && !modal && <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />}
    </div>
  )
}
export default App
