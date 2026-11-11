import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './components/Icon.jsx'
import Plan from './components/Plan.jsx'
import Parameters from './components/Parameters.jsx'
import Analysis, { Metrics } from './components/Analysis.jsx'
import Mathematics from './components/Mathematics.jsx'
import { navigateTabs } from './lib/accessibility.js'
import { calculateCoverage } from './lib/coverage.js'
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
  LocalProjects,
  ProjectBadge,
} from './components/ProjectManager.jsx'
import { exportMatrix, exportProject, exportReport } from './lib/export.js'
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

function App() {
  const workspace = useProjectWorkspace()
  const { toast, showToast, dismissToast } = useToast()
  const { project, setProject, library, setLibrary, storageError } = workspace
  const [triangulationSettings, setTriangulationSettings] = useState(() =>
    initialTriangulation(project),
  )
  const [frameSettings, setFrameSettings] = useState(loadFrameSettings)
  const [pendingAction, setPendingAction] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [planLayer, setPlanLayer] = useState('sectors')
  const [inspectorTab, setInspectorTab] = useState('cameras')
  const [page, setPage] = useState('home'),
    [selected, setSelected] = useState(() => project.cameras[0]?.id || null)
  const [wallStart, setWallStart] = useState(null)
  const [probe, setProbe] = useState(null),
    [tool, setTool] = useState('select')
  const [modal, setModal] = useState(null),
    [menu, setMenu] = useState(null)
  const fileRef = useRef(null),
    dialogRef = useRef(null)
  const result = useMemo(() => calculateCoverage(project), [project])
  const triangulation = useMemo(
    () => evaluateTriangulation(project, triangulationSettings, probe),
    [project, triangulationSettings, probe],
  )
  const updateTriangulation = (changes) =>
    setTriangulationSettings((previous) => ({ ...previous, ...changes }))
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
    setProbe(null)
    setTriangulationSettings(initialTriangulation(next))
    changeTool('select')
    setMenu(null)
    setModal(null)
    setPendingAction(null)
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
  const openProject = (next, options = {}) => {
    if (page === 'simulator') {
      setPendingAction({ type: 'open', project: next, options })
      setModal('save-exit')
    } else beginProject(next, options)
  }
  const navigate = (next) => {
    setMenu(null)
    if (next === 'home') {
      if (page === 'simulator') {
        setPendingAction({ type: 'home' })
        setModal('save-exit')
      }
      return
    }
    if (page === 'home') setModal('launcher')
    else setActiveTab(['analysis', 'math'].includes(next) ? next : 'overview')
  }
  const confirmIdentity = (identity) => {
    try {
      workspace.save(identity, modal === 'save-exit')
      if (modal === 'save-exit' && pendingAction?.type === 'open') {
        const next =
          pendingAction.project.id === project.id
            ? { ...pendingAction.project, ...identity }
            : pendingAction.project
        beginProject(next, pendingAction.options)
      } else {
        if (modal === 'save-exit') setPage('home')
        closeModal()
      }
      showToast('Proyecto guardado en este navegador.', { title: 'Proyecto guardado' })
    } catch {
      return 'No se pudo guardar en este navegador. Sigue editando y exporta el proyecto JSON para conservarlo.'
    }
  }
  const selectObject = (id) => {
    setSelected(id)
    if (project.cameras.some((camera) => camera.id === id)) setInspectorTab('cameras')
    if (project.walls.some((wall) => wall.id === id)) setInspectorTab('walls')
  }
  const updateCamera = (id, changes) =>
    setProject((p) => ({
      ...p,
      cameras: p.cameras.map((c) => (c.id === id ? { ...c, ...changes } : c)),
    }))
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
  const confirmDeletion = () => {
    if (!confirmation) return
    if (confirmation.kind === 'project') {
      if (!setLibrary((previous) => previous.filter((entry) => entry.id !== confirmation.id))) {
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
  const saveLocal = () => {
    setPendingAction(null)
    setModal('save-project')
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
  const exportAction = (type) => {
    setMenu(null)
    try {
      if (type === 'json') exportProject(project)
      if (type === 'txt')
        exportReport(project, result, triangulationSettings.enabled ? triangulation : null)
      if (type === 'csv') exportMatrix(project, result)
      showToast('Archivo exportado. Revisa tus descargas.', { title: 'Exportación completada' })
    } catch {
      showToast('No se pudo generar el archivo. Vuelve a intentarlo.', {
        type: 'error',
        title: 'Error al exportar',
      })
    }
  }

  return (
    <div className={`app-shell ${page === 'home' ? 'is-home' : 'workbench'}`} data-section={page}>
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
                <input
                  value={project.name}
                  maxLength={80}
                  onChange={(event) =>
                    setProject((previous) => ({
                      ...previous,
                      name: event.target.value || 'Proyecto',
                    }))
                  }
                />
              </label>
            </div>
          )}
          <div className="topbar-actions">
            <span className={`save-status ${storageError ? 'error' : ''}`}>
              <i />
              {storageError ? 'Guardado no disponible' : 'Guardado automático'}
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
        <main id="main-content">
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
              <div className="workbench-heading">
                <div>
                  <h1>Simulador de cobertura</h1>
                  <span>Plano, configuración y resultados en un mismo espacio</span>
                </div>
                <div className="page-actions">
                  <button className="btn" onClick={() => setModal('library')}>
                    <Icon name="folder" size={15} />
                    <span>Proyectos locales</span>
                  </button>
                  <button className="btn" onClick={saveLocal}>
                    <Icon name="save" size={15} />
                    Guardar
                  </button>
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
              <Metrics result={result} />
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
                        onTool={changeTool}
                      />
                    }
                  />
                </div>
              </div>
              <section className="results-dock" aria-label="Resultados del simulador">
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
                      camera={camera}
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
                      camera={camera}
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
                  : modal === 'launcher'
                    ? 'Abrir simulador'
                    : modal === 'save-exit'
                      ? 'Guardar antes de salir'
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
          {modal === 'confirm-delete' && confirmation ? (
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
          ) : modal === 'save-project' || modal === 'save-exit' ? (
            <SaveProjectForm
              key={`${modal}-${project.id}`}
              project={project}
              leaving={modal === 'save-exit'}
              onSave={confirmIdentity}
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
