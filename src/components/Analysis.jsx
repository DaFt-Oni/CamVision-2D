import { format } from '../lib/format.js'
import Icon from './Icon.jsx'
import { SectionHeading } from './Controls.jsx'

export function Metrics({ result }) {
  const cards = [
    [
      'eye',
      'Cobertura total',
      result.coverage,
      '%',
      `${format(result.coveredArea)} m² de superficie vigilada`,
      'green',
    ],
    [
      'target',
      'Puntos ciegos',
      result.blind,
      '%',
      `${format(result.blindArea)} m² sin cobertura`,
      'orange',
    ],
    [
      'layers',
      'Superposición',
      result.overlap,
      '%',
      `${format(result.overlapArea)} m² con múltiples cámaras`,
      'blue',
    ],
    [
      'camera',
      'Cámaras instaladas',
      result.cameraCount,
      '',
      `${format(result.totalArea, 0)} m² de superficie total`,
      'neutral',
    ],
  ]
  return (
    <div className="metrics">
      {cards.map(([icon, label, value, unit, note, color]) => (
        <article className={`metric ${color}`} key={label}>
          <div className="metric-label">
            <span>{label}</span>
            <Icon name={icon} size={19} />
          </div>
          <div className="metric-value">
            {format(value, unit ? 1 : 0)}
            <span>{unit}</span>
          </div>
          <div className="metric-note">
            <i />
            {note}
          </div>
        </article>
      ))}
    </div>
  )
}
export function Distribution({ result, compact = false }) {
  const exclusive = result.coverage - result.overlap
  const groups = [
    ['Cobertura única', exclusive, result.exclusiveArea, 'covered'],
    ['Superposición', result.overlap, result.overlapArea, 'overlap'],
    ['Sin cobertura', result.blind, result.blindArea, 'blind'],
  ]
  return (
    <section className={`panel distribution ${compact ? 'compact' : ''}`}>
      <SectionHeading eyebrow="DISTRIBUCIÓN DE SUPERFICIES" title="Distribución de cobertura" />
      <div className="distribution-content">
        <div
          className="donut"
          style={{
            background: `conic-gradient(#087f6b 0% ${exclusive}%, #7656b8 ${exclusive}% ${result.coverage}%, #e7b08b ${result.coverage}% 100%)`,
          }}
          role="img"
          aria-label={`Cobertura única ${format(exclusive)}%, superposición ${format(result.overlap)}%, sin cobertura ${format(result.blind)}%`}
        >
          <div>
            <strong>
              {format(result.coverage)}
              <small>%</small>
            </strong>
            <span>cobertura total</span>
          </div>
        </div>
        <div className="distribution-list">
          {groups.map(([label, value, area, color]) => (
            <div key={label}>
              <span>
                <i className={`dot ${color}`} />
                {label}
              </span>
              <strong>
                {format(value)} %<small>{format(area)} m²</small>
              </strong>
            </div>
          ))}
        </div>
      </div>
      <p className="caption">
        La superposición forma parte de la cobertura total. Cada zona se cuenta una sola vez.
      </p>
    </section>
  )
}
export function CameraBreakdown({ project, result }) {
  return (
    <section className="panel breakdown">
      <SectionHeading eyebrow="CONTRIBUCIÓN INDIVIDUAL" title="Rendimiento de las cámaras" />
      <div className="camera-bars">
        {project.cameras.map((c, i) => (
          <div className="camera-bar" key={c.id}>
            <div>
              <span>
                <i className="dot" style={{ background: c.color }} />
                {c.name}
              </span>
              <strong>{format(result.perCamera[i].area)} m²</strong>
            </div>
            <div className="bar-track">
              <i
                style={{
                  width: `${(result.perCamera[i].area / result.totalArea) * 100}%`,
                  background: c.color,
                }}
              />
            </div>
            <p>
              {format(result.perCamera[i].exclusiveArea)} m² exclusivos ·{' '}
              {format((result.perCamera[i].area / result.totalArea) * 100)} % del espacio
            </p>
          </div>
        ))}
        {!project.cameras.length && (
          <p className="empty-text">Agrega una cámara para analizar su contribución.</p>
        )}
      </div>
      <p className="caption">
        El aporte individual puede incluir áreas compartidas con otras cámaras.
      </p>
    </section>
  )
}
export default function Analysis({ project, result }) {
  return (
    <>
      <div className="analysis-grid">
        <Distribution result={result} />
        <CameraBreakdown project={project} result={result} />
      </div>
      <section className="panel">
        <SectionHeading eyebrow="MATRIZ Y SUPERFICIES" title="Resumen de la discretización" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Clasificación</th>
                <th>Condición</th>
                <th>Celdas</th>
                <th>Superficie</th>
                <th>Del espacio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Superficie vigilada</td>
                <td>
                  <code>Mᵢⱼ ≥ 1</code>
                </td>
                <td>{result.coveredCells}</td>
                <td>{format(result.coveredArea, 2)} m²</td>
                <td>{format(result.coverage, 2)} %</td>
              </tr>
              <tr>
                <td>Puntos ciegos</td>
                <td>
                  <code>Mᵢⱼ = 0</code>
                </td>
                <td>{result.blindCells}</td>
                <td>{format(result.blindArea, 2)} m²</td>
                <td>{format(result.blind, 2)} %</td>
              </tr>
              <tr>
                <td>Superposición</td>
                <td>
                  <code>Mᵢⱼ ≥ 2</code>
                </td>
                <td>{result.overlapCells}</td>
                <td>{format(result.overlapArea, 2)} m²</td>
                <td>{format(result.overlap, 2)} %</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="note">
          <Icon name="info" size={18} />
          <p>
            Matriz de {result.rows} × {result.columns} ({result.totalCells.toLocaleString('es-CL')}{' '}
            celdas). Celda nominal: {format(project.space.cellSize, 2)} m. Se prueba el centro de
            cada celda y se pondera por su área real. Los resultados son aproximaciones
            discretizadas.
          </p>
        </div>
      </section>
    </>
  )
}
