import { format } from '../lib/format.js'
import { inspectPoint } from '../lib/geometry.js'
import { cameraMath } from '../lib/mathematics.js'
import { NumberField, SectionHeading } from './Controls.jsx'
import { exportMatrix } from '../lib/export.js'
import Icon from './Icon.jsx'
import Calculation from './Calculation.jsx'
import { TriangulationDetails } from './Triangulation.jsx'

const pair = (point, digits = 3) => `(${format(point.x, digits)}; ${format(point.y, digits)})`
const cameraName = (camera) =>
  /^cámara\b/i.test(camera.name) ? camera.name : `Cámara ${camera.name}`

export function CameraSelector({ project, camera, onCamera, label = 'Cámara de los cálculos' }) {
  return (
    <label className="math-camera-selector">
      <Icon name="camera" size={24} />
      <span>
        <strong>{label}</strong>
        <small>Los valores cambian al elegir o editar una cámara.</small>
      </span>
      <select
        aria-label={label}
        value={camera?.id || ''}
        disabled={!project.cameras.length}
        onChange={(event) => onCamera(event.target.value)}
      >
        {!project.cameras.length && <option value="">Sin cámaras instaladas</option>}
        {project.cameras.map((item, index) => (
          <option value={item.id} key={item.id}>
            {String(index + 1).padStart(2, '0')} · {item.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function LiveMath({ project, camera, result, onCamera }) {
  const c = camera || project.cameras[0]
  const math = c && cameraMath(c, project.space, project.walls)
  return (
    <section className="panel live-math overview-calculations">
      <SectionHeading eyebrow="MATEMÁTICAS / VALORES ACTUALES" title="Del parámetro al resultado" />
      <CameraSelector project={project} camera={c} onCamera={onCamera} label="Cámara del resumen" />
      <div className="summary-calculations">
        {c ? (
          <>
            <div>
              <span>Dirección de {cameraName(c)}</span>
              <code>
                u = (cos {format(c.angle, 1)}°; sen {format(c.angle, 1)}°)
              </code>
              <strong>{pair(math.vector)}</strong>
              <p>Vector unitario que indica hacia dónde apunta la cámara.</p>
            </div>
            <div>
              <span>Eje visible en el plano</span>
              <code>
                Desde {pair(c, 2)} hasta {pair(math.visible, 2)} m
              </code>
              <strong>{format(math.visibleDistance, 2)} m de eje visible</strong>
              <p>
                {math.clipped
                  ? 'El eje termina antes del alcance configurado por una pared o el borde del recinto.'
                  : 'El eje central llega hasta el alcance configurado.'}
              </p>
            </div>
          </>
        ) : (
          <p className="empty-text">Añade una cámara para ver sus cálculos.</p>
        )}
        <div>
          <span>Cobertura de todas las cámaras</span>
          <code>
            {format(result.coveredArea, 2)} / {format(result.totalArea, 2)} × 100
          </code>
          <strong>{format(result.coverage, 2)} % del recinto</strong>
          <p>
            Superficie visible por al menos una cámara, sin contar dos veces las zonas compartidas.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function Mathematics({
  project,
  result,
  camera,
  onCamera,
  probe,
  onProbe,
  onShowMatrix,
  triangulation,
  onConfigureTriangulation,
}) {
  const c = camera || project.cameras[0]
  const point = probe || { x: project.space.width / 2, y: project.space.height / 2 }
  const inspection = c ? inspectPoint(c, point, project.walls) : null
  const math = c ? cameraMath(c, project.space, project.walls) : null
  return (
    <div className="mathematics explained-math">
      <TriangulationDetails data={triangulation} onConfigure={onConfigureTriangulation} />
      <section className="panel">
        <SectionHeading
          eyebrow="01 / TRIGONOMETRÍA Y VECTORES"
          title={`Trigonometría y vector de dirección${c ? ` de la ${cameraName(c)}` : ''}`}
        />
        <CameraSelector project={project} camera={c} onCamera={onCamera} />
        {c ? (
          <>
            <p className="math-intro">
              Estos pasos explican cómo la posición, orientación, apertura y alcance de esta cámara
              producen el campo de visión del plano. Cambia sus parámetros y observa la sustitución
              y el resultado. Los valores mostrados se redondean; el cálculo usa precisión completa.
            </p>
            <dl className="math-inputs">
              {[
                ['Posición C = (x₀; y₀)', `${pair(c, 2)} m`],
                ['Orientación θ', `${format(c.angle, 1)}°`],
                ['Apertura α', `${format(c.fov, 1)}°`],
                ['Alcance d', `${format(c.range, 2)} m`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="calculation-grid">
              <Calculation
                number="1"
                title="Convertir la orientación a radianes"
                formula="θᵣ = θ × π / 180"
                substitution={`${format(c.angle, 1)} × π / 180`}
                answer={`${format(math.angleRad, 5)} rad`}
              >
                La conversión permite evaluar seno y coseno. θ se mide desde el eje X positivo: 0°
                este y 90° norte.
              </Calculation>
              <Calculation
                number="2"
                title="Obtener el vector de dirección"
                formula="u = (cos θᵣ; sen θᵣ)"
                substitution={`u = (cos ${format(math.angleRad, 5)}; sen ${format(math.angleRad, 5)})`}
                answer={`u = ${pair(math.vector, 4)} · ‖u‖ = 1`}
              >
                La primera componente indica avance en X y la segunda en Y. El signo define el
                sentido; este vector da dirección, no distancia.
              </Calculation>
              <Calculation
                number="3"
                title="Calcular el extremo teórico del eje"
                formula="P = (x₀ + d × uₓ; y₀ + d × uᵧ)"
                substitution={`P = (${format(c.x, 2)} + ${format(c.range, 2)} × ${format(math.vector.x, 4)}; ${format(c.y, 2)} + ${format(c.range, 2)} × ${format(math.vector.y, 4)})`}
                answer={`P = ${pair(math.theoretical)} m`}
              >
                Proyecta el alcance completo en la dirección de la cámara. Este punto teórico puede
                quedar fuera del recinto o detrás de una pared.
              </Calculation>
              <Calculation
                number="4"
                title="Relacionar apertura con ancho"
                formula="A = 2 × d × tan(α / 2)"
                substitution={`A = 2 × ${format(c.range, 2)} × tan(${format(c.fov / 2, 2)}°) = 2 × ${format(c.range, 2)} × tan(${format(math.halfFovRad, 5)} rad)`}
                answer={`A = ${format(math.width)} m`}
              >
                Ancho en una recta perpendicular al eje a distancia axial d. No es la cuerda del
                sector de radio d ni garantiza superficie vigilada: el plano limita por distancia
                radial y obstáculos.
              </Calculation>
            </div>
            <div className="practical-result">
              <Icon name="eye" size={26} />
              <div>
                <h3>Así se aplica en el plano de {cameraName(c)}</h3>
                <p>
                  El eje central llega realmente hasta <strong>{pair(math.visible)} m</strong>:{' '}
                  <strong>{format(math.visibleDistance, 3)} m</strong> desde la cámara, frente a{' '}
                  {format(c.range, 2)} m de alcance configurado.
                </p>
                <p>
                  {math.clipped
                    ? 'Una pared o el límite del recinto recorta el eje antes de alcanzar el extremo teórico.'
                    : 'No hay un recorte anterior al alcance sobre el eje central.'}{' '}
                  El resto del campo se calcula en cada dirección de la apertura; la matriz
                  comprueba los centros de celda.
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="empty-text">
            Agrega una cámara en el simulador para explorar estas fórmulas.
          </p>
        )}
      </section>
      <section className="panel">
        <SectionHeading
          eyebrow="02 / VERIFICACIÓN DE UN PUNTO"
          title={c ? `¿Puede ${cameraName(c)} ver este lugar?` : 'Verificación de un punto'}
        />
        <div className="probe-inputs">
          <div className="field-grid">
            <NumberField
              label="Punto X"
              value={point.x}
              min={0}
              max={project.space.width}
              unit="m"
              onChange={(x) => onProbe({ ...point, x })}
            />
            <NumberField
              label="Punto Y"
              value={point.y}
              min={0}
              max={project.space.height}
              unit="m"
              onChange={(y) => onProbe({ ...point, y })}
            />
          </div>
          <p>
            También puedes hacer clic en el plano. El origen está abajo a la izquierda y las
            coordenadas conservan sus valores al girar la vista.
          </p>
        </div>
        {inspection ? (
          <>
            <div className="calculation-grid point-calculations">
              <Calculation
                number="1"
                title="Distancia de la cámara al punto"
                formula="r = √((x − x₀)² + (y − y₀)²)"
                substitution={`Δx = ${format(point.x, 2)} − ${format(c.x, 2)} = ${format(inspection.dx, 2)}; Δy = ${format(point.y, 2)} − ${format(c.y, 2)} = ${format(inspection.dy, 2)}; r = √((${format(inspection.dx, 2)})² + (${format(inspection.dy, 2)})²)`}
                answer={`r = ${format(inspection.distance, 3)} m`}
              >
                Para estar al alcance, la distancia debe ser menor o igual a {format(c.range, 2)} m.
              </Calculation>
              <Calculation
                number="2"
                title="Dirección y separación angular"
                formula="β = atan2(Δy, Δx); Δ = |diferencia mínima(β, θ)|"
                substitution={`β = atan2(${format(inspection.dy, 2)}, ${format(inspection.dx, 2)}); Δ = |diferencia mínima(${format(inspection.bearing, 3)}°, ${format(c.angle, 1)}°)|`}
                answer={`β = ${format(inspection.bearing, 3)}° · Δ = ${format(inspection.difference, 3)}°`}
              >
                β se expresa entre 0° y 360°; la diferencia mínima contempla el cruce del cero. Para
                entrar en la apertura, Δ debe ser menor o igual a α/2 = {format(c.fov / 2, 2)}°.
                {inspection.distance < 1e-8
                  ? ' El punto coincide con la cámara: su dirección no está definida y se toma separación cero.'
                  : ''}
              </Calculation>
            </div>
            <div className="visibility-verdict">
              <h3>Comprobación de las tres condiciones</h3>
              <ul>
                {[
                  [
                    inspection.inRange,
                    'Alcance',
                    `${format(inspection.distance, 3)} m ≤ ${format(c.range, 2)} m`,
                  ],
                  [
                    inspection.inAngle,
                    'Apertura',
                    `${format(inspection.difference, 3)}° ≤ ${format(c.fov / 2, 2)}°`,
                  ],
                  [
                    !inspection.blocked,
                    'Línea de visión',
                    inspection.blocked
                      ? 'Una pared intersecta el segmento cámara–punto.'
                      : 'Sin paredes entre la cámara y el punto.',
                  ],
                ].map(([pass, title, detail]) => (
                  <li key={title} className={pass ? 'pass' : 'fail'}>
                    <Icon name={pass ? 'check' : 'close'} size={18} />
                    <div>
                      <strong>
                        {title}: {pass ? 'cumple' : 'no cumple'}
                      </strong>
                      <span>{detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className={inspection.visible ? 'verdict-pass' : 'verdict-fail'}>
                <strong>
                  {inspection.visible
                    ? 'Punto visible desde esta cámara'
                    : 'Punto fuera de la cobertura de esta cámara'}
                </strong>
                <span>
                  {inspection.visible
                    ? 'Cumple alcance, apertura y línea de visión.'
                    : 'Basta que una condición no se cumpla para que el punto no sea visible.'}
                </span>
              </p>
            </div>
          </>
        ) : (
          <p className="empty-text">Selecciona o añade una cámara para comprobar el punto.</p>
        )}
        <details className="method-details">
          <summary>Cómo se detecta el bloqueo por paredes</summary>
          <p>
            Se comprueba la intersección entre el segmento cámara–punto y cada pared usando
            productos cruzados de vectores. Se resuelven C + t(P − C) = A + u(B − A). Si 0 &lt; t ≤
            1 y 0 ≤ u ≤ 1, existe bloqueo. También se comprueban segmentos colineales y extremos.
            Tocar únicamente el origen permite montar la cámara en una pared.
          </p>
        </details>
      </section>
      <div className="matrix-location-note">
        <Icon name="grid" size={22} />
        <div>
          <strong>La matriz se consulta en el plano</strong>
          <p>
            {result.rows} filas × {result.columns} columnas. Mᵢⱼ es la cantidad de cámaras que ven
            el centro de esa celda.
          </p>
        </div>
        <button className="btn primary" onClick={onShowMatrix}>
          Ver matriz en el plano
        </button>
        <button className="btn" onClick={() => exportMatrix(project, result)}>
          <Icon name="download" size={16} />
          CSV
        </button>
      </div>
      <section className="panel">
        <SectionHeading
          eyebrow="03 / TODAS LAS CÁMARAS"
          title="De la matriz a superficies y porcentajes"
        />
        <p className="math-intro">
          Estos cálculos corresponden al recinto completo, con todas las cámaras. Cada celda aporta
          su área real; las zonas compartidas se cuentan una sola vez en la cobertura total.
        </p>
        <div className="calculation-grid">
          <Calculation
            number="1"
            title="Superficie total del recinto"
            formula="S = ancho × largo"
            substitution={`${format(project.space.width, 2)} × ${format(project.space.height, 2)}`}
            answer={`S = ${format(result.totalArea, 3)} m²`}
          >
            Es el denominador de todos los porcentajes del espacio.
          </Calculation>
          <Calculation
            number="2"
            title="Superficie y porcentaje vigilados"
            formula="Sᶜ = Σ aᵢⱼ × [Mᵢⱼ ≥ 1]; C = Sᶜ / S × 100"
            substitution={`${result.coveredCells} celdas con M ≥ 1; C = ${format(result.coveredArea, 3)} / ${format(result.totalArea, 3)} × 100`}
            answer={`${format(result.coveredArea, 3)} m² → ${format(result.coverage, 3)} %`}
          >
            Superficie vista por al menos una cámara. aᵢⱼ es el área real de cada celda y
            [condición] vale 1 si se cumple o 0 si no.
          </Calculation>
          <Calculation
            number="3"
            title="Superficie con superposición"
            formula="Sˢ = Σ aᵢⱼ × [Mᵢⱼ ≥ 2]; O = Sˢ / S × 100"
            substitution={`${result.overlapCells} celdas con M ≥ 2; O = ${format(result.overlapArea, 3)} / ${format(result.totalArea, 3)} × 100`}
            answer={`${format(result.overlapArea, 3)} m² → ${format(result.overlap, 3)} %`}
          >
            Zonas vistas por dos o más cámaras. Forman parte de la cobertura total; no se suman de
            nuevo.
          </Calculation>
          <Calculation
            number="4"
            title="Puntos ciegos del recinto"
            formula="S⁰ = S − Sᶜ; B = S⁰ / S × 100"
            substitution={`S⁰ = ${format(result.totalArea, 3)} − ${format(result.coveredArea, 3)}; B = ${format(result.blindArea, 3)} / ${format(result.totalArea, 3)} × 100`}
            answer={`${format(result.blindArea, 3)} m² → ${format(result.blind, 3)} %`}
          >
            Superficie cuyo centro de celda no es visible por ninguna cámara: {result.blindCells}{' '}
            celdas con M = 0.
          </Calculation>
        </div>
        <div className="note">
          <Icon name="info" />
          <p>
            Resolución actual: {format(project.space.cellSize, 2)} m. La matriz tiene{' '}
            {result.totalCells.toLocaleString('es-CL')} celdas; las celdas parciales del borde se
            ponderan por su área real. Son aproximaciones por centros de celda y cambiar la
            resolución puede alterar ligeramente los resultados.
          </p>
        </div>
      </section>
    </div>
  )
}
