import Icon from './Icon.jsx'
import { ProjectBadge } from './ProjectManager.jsx'
import { format } from '../lib/format.js'
import { SCENARIOS } from '../lib/project.js'

export default function Home({
  project,
  result,
  libraryCount,
  onNavigate,
  onLibrary,
  onImport,
  onScenario,
  onGuide,
}) {
  return (
    <div className="home-content">
      <div className="home-heading">
        <div>
          <span className="eyebrow">CAMVISION / SISTEMA ACADÉMICO</span>
          <h1>Menú principal</h1>
          <p>Abre el simulador para editar el plano y consultar todos sus resultados.</p>
        </div>
        <span className="home-version">
          FUNCIONES Y MATRICES<span>Ingeniería en Informática · INACAP</span>
        </span>
      </div>
      <section className="project-strip" aria-label="Proyecto activo">
        <ProjectBadge project={project} size={22} />
        <div>
          <span>PROYECTO ACTIVO</span>
          <strong>{project.name}</strong>
        </div>
        <dl>
          <div>
            <dt>Espacio</dt>
            <dd>
              {format(project.space.width, 1)} × {format(project.space.height, 1)} m
            </dd>
          </div>
          <div>
            <dt>Dispositivos</dt>
            <dd>{project.cameras.length} cámaras</dd>
          </div>
          <div>
            <dt>Matriz</dt>
            <dd>
              {result.rows} × {result.columns}
            </dd>
          </div>
        </dl>
        <span className="project-strip-status">
          <i />
          Almacenamiento local
        </span>
      </section>
      <nav className="metro-grid" aria-label="Acceso al simulador">
        <button
          className="metro-tile tile-cobalt"
          onClick={() => onNavigate('simulator')}
          aria-label="Abrir Simulador"
        >
          <div className="tile-top">
            <Icon name="grid" size={30} />
            <span>ESPACIO PRINCIPAL</span>
            <Icon name="chevron" size={21} />
          </div>
          <div className="tile-content">
            <h2>Simulador de cobertura</h2>
            <p>Plano interactivo, cámaras, obstáculos y matriz sobre el mismo recinto.</p>
          </div>
          <div className="tile-bottom">
            <span>
              Elegir proyecto <Icon name="chevron" size={15} />
            </span>
            <span>
              {project.cameras.length} cámaras · {project.walls.length} paredes ·{' '}
              {format(result.coverage)} % de cobertura
            </span>
          </div>
        </button>
      </nav>
      <div className="home-tools">
        <section className="home-files">
          <div className="home-section-title">
            <h2>Archivos del proyecto</h2>
            <span>Guardado en este navegador</span>
          </div>
          <div className="file-shortcuts">
            <button onClick={onLibrary}>
              <span className="shortcut-icon">
                <Icon name="folder" size={20} />
              </span>
              <span>
                <strong>Proyectos guardados</strong>
                <small>
                  {libraryCount}{' '}
                  {libraryCount === 1 ? 'proyecto disponible' : 'proyectos disponibles'}
                </small>
              </span>
              <Icon name="chevron" size={17} />
            </button>
            <button onClick={onImport}>
              <span className="shortcut-icon">
                <Icon name="upload" size={20} />
              </span>
              <span>
                <strong>Importar proyecto</strong>
                <small>Abrir un archivo JSON de CamVision</small>
              </span>
              <Icon name="chevron" size={17} />
            </button>
          </div>
        </section>
        <section className="home-examples">
          <div className="home-section-title">
            <h2>Escenarios de ejemplo</h2>
            <button className="text-button" onClick={onGuide}>
              <Icon name="book" size={15} />
              Guía de uso
            </button>
          </div>
          <div className="scenario-shortcuts">
            {SCENARIOS.map((scenario) => (
              <button key={scenario.id} onClick={() => onScenario(scenario)}>
                <Icon name={scenario.id === 'empty' ? 'plus' : 'grid'} size={17} />
                <span>
                  <strong>{scenario.label}</strong>
                  <small>{scenario.description}</small>
                </span>
                <Icon name="chevron" size={14} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <footer className="home-footer">
        <span>CamVision · Simulación y evaluación de cobertura de videovigilancia</span>
        <span>Modelo geométrico 2D · Versión 0.1.7</span>
      </footer>
    </div>
  )
}
