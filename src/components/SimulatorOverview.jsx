import Icon from './Icon.jsx'
import { format } from '../lib/format.js'
import { Distribution } from './Analysis.jsx'
import { LiveMath } from './Mathematics.jsx'

export default function SimulatorOverview({ project, result, camera, onCamera, onTab }) {
  const leading = result.perCamera.reduce(
    (best, item) => (!best || item.area > best.area ? item : best),
    null,
  )
  const leadingCamera = project.cameras.find((item) => item.id === leading?.id)
  return (
    <div className="simulator-overview integrated-overview">
      <div className="overview-analysis">
        <Distribution result={result} compact />
        <section className="panel overview-findings">
          <div className="overview-card-heading">
            <h2>Lectura del análisis</h2>
            <button className="text-button" onClick={() => onTab('analysis')}>
              Ver análisis
              <Icon name="chevron" size={14} />
            </button>
          </div>
          <dl>
            <div>
              <dt>Sin cobertura</dt>
              <dd>
                {format(result.blindArea, 2)} m²{' '}
                <small>({format(result.blind, 1)} % del recinto)</small>
              </dd>
            </div>
            <div>
              <dt>Superficie con una sola cámara</dt>
              <dd>{format(result.exclusiveArea, 2)} m²</dd>
            </div>
            <div>
              <dt>Cámara con mayor área visible</dt>
              <dd>
                {leadingCamera
                  ? `${leadingCamera.name} · ${format(leading.area, 2)} m²`
                  : 'No hay cámaras instaladas'}
              </dd>
            </div>
          </dl>
          <p className="caption">
            El área individual puede incluir zonas compartidas. Análisis detalla el aporte de cada
            cámara y las superficies de la matriz.
          </p>
        </section>
      </div>
      <div className="overview-math">
        <LiveMath project={project} camera={camera} result={result} onCamera={onCamera} />
        <button className="btn overview-math-link" onClick={() => onTab('math')}>
          <Icon name="math" size={18} />
          Ver desarrollo matemático paso a paso
          <Icon name="chevron" size={15} />
        </button>
      </div>
    </div>
  )
}
