import { useId } from 'react'
import { NumberField, SectionHeading } from './Controls.jsx'
import Calculation from './Calculation.jsx'
import { format } from '../lib/format.js'
import { triangulationTargets } from '../lib/triangulation.js'
import { uprightTransform } from '../lib/viewport.js'

const pair = (p) => `(${format(p.x, 3)}; ${format(p.y, 3)})`

function Sight({ label, sight }) {
  const reasons = [
    !sight.inRange && 'fuera de alcance',
    !sight.inAngle && 'fuera de apertura',
    sight.blocked && 'pared antes de P',
  ].filter(Boolean)
  return (
    <p>
      <strong>{label}:</strong> {sight.visible ? 'puede observar P' : reasons.join(', ')}.
    </p>
  )
}

export function TriangulationControls({
  project,
  settings,
  data,
  probe,
  onChange,
  onProbe,
  onExplain,
}) {
  const errorId = useId()
  const point = probe || { x: project.space.width / 2, y: project.space.height / 2 }
  const chooseMode = (mode) =>
    onChange({
      mode,
      ...(mode === 'angles' && data.valid
        ? {
            angleA: String(Number(data.phi1.toFixed(6))),
            angleB: String(Number(data.phi2.toFixed(6))),
            side: data.side,
          }
        : {}),
    })
  return (
    <div className="inspector-section triangulation-controls">
      <div className="inspector-section-title">
        <h3>Triangulación de dos cámaras</h3>
      </div>
      <p className="field-help">
        A y B observan el mismo punto P. La base AB se obtiene de sus posiciones en el plano.
      </p>
      <div className="field-grid">
        {['a', 'b'].map((key) => (
          <label className="select-field" key={key}>
            <span>Cámara {key.toUpperCase()}</span>
            <select
              aria-label={`Cámara ${key.toUpperCase()} de triangulación`}
              value={data[key]?.id || ''}
              onChange={(e) => onChange({ [`${key}Id`]: e.target.value })}
            >
              <option value="" disabled>
                Selecciona una cámara
              </option>
              {project.cameras.map((camera) => (
                <option value={camera.id} key={camera.id}>
                  {camera.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="select-field">
        <span>Datos de la medición</span>
        <select value={settings.mode} onChange={(e) => chooseMode(e.target.value)}>
          <option value="point">Punto del plano</option>
          <option value="angles">Ángulos medidos</option>
        </select>
      </label>
      {settings.mode === 'point' ? (
        <>
          <label className="select-field">
            <span>Punto P de referencia</span>
            <select value={settings.target} onChange={(e) => onChange({ target: e.target.value })}>
              <option value="probe">Punto seleccionado en el plano</option>
              {triangulationTargets(project).map((target) => (
                <option key={target.value} value={target.value}>
                  {target.label}
                </option>
              ))}
              {settings.target !== 'probe' &&
                !triangulationTargets(project).some((t) => t.value === settings.target) && (
                  <option value={settings.target}>Extremo de pared eliminado</option>
                )}
            </select>
          </label>
          {settings.target === 'probe' && (
            <div className="field-grid">
              <NumberField
                label="Referencia P · X"
                value={point.x}
                min={0}
                max={project.space.width}
                unit="m"
                onChange={(x) => onProbe({ ...point, x })}
              />
              <NumberField
                label="Referencia P · Y"
                value={point.y}
                min={0}
                max={project.space.height}
                unit="m"
                onChange={(y) => onProbe({ ...point, y })}
              />
            </div>
          )}
          <p className="field-help">
            Haz clic en el plano para elegir P. En Medición, un clic cerca del extremo de una pared
            se ajusta a su esquina.
          </p>
        </>
      ) : (
        <>
          <div className="field-grid">
            {['A', 'B'].map((key, index) => (
              <label className="select-field" key={key}>
                <span>
                  Ángulo interior φ{index === 0 ? '₁' : '₂'} en {key} (°)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={settings[`angle${key}`]}
                  aria-invalid={!data.valid}
                  aria-describedby={!data.valid ? errorId : undefined}
                  onChange={(e) => onChange({ [`angle${key}`]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="select-field">
            <span>Lado de la base A → B</span>
            <select value={settings.side} onChange={(e) => onChange({ side: e.target.value })}>
              <option value="left">P a la izquierda de A → B</option>
              <option value="right">P a la derecha de A → B</option>
            </select>
          </label>
          <p className="field-help">
            φ₁ = ∠BAP y φ₂ = ∠ABP: se miden hacia P desde la base. No son la apertura ni la
            orientación de las cámaras. Hay dos soluciones reflejadas; elige el lado de P.
          </p>
        </>
      )}
      <label className="triangulation-toggle">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        Mostrar triángulo en el plano
      </label>
      {!data.valid ? (
        <p className="triangulation-error" id={errorId} role="status">
          {data.error}
        </p>
      ) : (
        <>
          <dl className="triangulation-results">
            {[
              ['Base AB', `${format(data.base, 4)} m`],
              ['Ángulo γ en P', `${format(data.gamma, 4)}°`],
              ['Distancia AP', `${format(data.ap, 4)} m`],
              ['Distancia BP', `${format(data.bp, 4)} m`],
              ['φ₁ en A', `${format(data.phi1, 4)}°`],
              ['φ₂ en B', `${format(data.phi2, 4)}°`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="triangulation-check">
            P = {pair(data.point)} m<br />
            Ley de cosenos: {data.consistent ? 'consistente' : 'revisar datos'}.
          </p>
          {data.narrow && (
            <p className="triangulation-warning">
              Triángulo muy estrecho: pequeños cambios de ángulo pueden variar mucho las distancias.
            </p>
          )}
          {!data.insideRoom && (
            <p className="triangulation-warning">
              P queda fuera del recinto. La medición es matemática; el dibujo se recorta al plano.
            </p>
          )}
          <div className="triangulation-sight">
            <Sight label="A" sight={data.sightA} />
            <Sight label="B" sight={data.sightB} />
          </div>
        </>
      )}
      <button className="btn" onClick={onExplain}>
        Ver cálculo de senos y cosenos
      </button>
    </div>
  )
}

export function TriangulationDetails({ data, onConfigure }) {
  const f = (n) => format(n, 6)
  return (
    <section className="panel triangulation-details" id="triangulation-math">
      <SectionHeading
        eyebrow="TRIANGULACIÓN / DOS CÁMARAS"
        title="Distancia a un punto común con senos y cosenos"
      >
        <button className="btn" onClick={onConfigure}>
          Configurar junto al plano
        </button>
      </SectionHeading>
      <p className="math-intro">
        La base b = AB conecta dos cámaras. φ₁ = ∠BAP y φ₂ = ∠ABP son los ángulos interiores hacia
        un mismo punto P. Se expresan en grados, distintos de la orientación θ y apertura α de cada
        dispositivo.
      </p>
      {!data.valid ? (
        <p className="triangulation-error" role="status">
          {data.error}
        </p>
      ) : (
        <>
          <p className="triangulation-context">
            A: <strong>{data.a.name}</strong> en {pair(data.a)} m · B:{' '}
            <strong>{data.b.name}</strong> en {pair(data.b)} m · P = {pair(data.point)} m
          </p>
          <div className="calculation-grid">
            <Calculation
              number="1"
              title="Obtener el tercer ángulo"
              formula="γ = 180° − φ₁ − φ₂"
              substitution={`γ = 180° − ${f(data.phi1)}° − ${f(data.phi2)}°`}
              answer={`γ = ${f(data.gamma)}°`}
            >
              Los tres ángulos deben medir al menos 0,01°. La base debe ser mayor que cero y las
              cámaras deben estar separadas.
            </Calculation>
            <Calculation
              number="2"
              title="Ley de senos para la distancia AP"
              formula="AP = b × sen(φ₂) / sen(γ)"
              substitution={`AP = ${f(data.base)} × sen(${f(data.phi2)}°) / sen(${f(data.gamma)}°)`}
              answer={`AP = ${f(data.ap)} m`}
            >
              AP está frente al ángulo φ₂ situado en B. El cálculo convierte grados a radianes antes
              de evaluar los senos.
            </Calculation>
            <Calculation
              number="3"
              title="Ley de senos para la distancia BP"
              formula="BP = b × sen(φ₁) / sen(γ)"
              substitution={`BP = ${f(data.base)} × sen(${f(data.phi1)}°) / sen(${f(data.gamma)}°)`}
              answer={`BP = ${f(data.bp)} m`}
            >
              BP está frente al ángulo φ₁ situado en A. Los valores de pantalla se redondean; el
              cálculo conserva precisión completa.
            </Calculation>
            <Calculation
              number="4"
              title="Comprobar la base por la ley de cosenos"
              formula="bᶜ = √(AP² + BP² − 2 × AP × BP × cos γ)"
              substitution={`bᶜ = √(${f(data.ap)}² + ${f(data.bp)}² − 2 × ${f(data.ap)} × ${f(data.bp)} × cos(${f(data.gamma)}°))`}
              answer={`bᶜ = ${f(data.cosineBase)} m · |bᶜ − b| = ${data.cosineError.toExponential(2).replace('.', ',')} m`}
            >
              {data.consistent
                ? 'La base reconstruida coincide con AB dentro de una tolerancia relativa de 10⁻⁸.'
                : 'La base reconstruida no coincide con AB: revisa los datos.'}{' '}
              Esta comprobación algebraica y la visibilidad son verificaciones separadas.
            </Calculation>
          </div>
          {data.referencePoint && (
            <p className="triangulation-context">
              Comprobación con las coordenadas de P: AP = {f(data.directAP)} m y BP ={' '}
              {f(data.directBP)} m. Error de reconstrucción de P:{' '}
              {data.reconstructionError.toExponential(2).replace('.', ',')} m.
            </p>
          )}
          <div className="triangulation-sight">
            <h3>¿P puede ser observado por ambas cámaras?</h3>
            <Sight label={`${data.a.name} (A)`} sight={data.sightA} />
            <Sight label={`${data.b.name} (B)`} sight={data.sightB} />
            {!data.insideRoom && (
              <p className="triangulation-warning">P está fuera del recinto configurado.</p>
            )}
            <p>
              Se comprueban alcance, apertura y obstáculos anteriores a P. El contacto con una pared
              exactamente en P permite medir su esquina o extremo, sin cambiar el cálculo de
              cobertura.
            </p>
          </div>
        </>
      )}
      <p className="triangulation-example">
        Ejemplo: AB = 6 m y φ₁ = φ₂ = 53,1301° dan γ = 73,7398° y AP ≈ BP ≈ 5 m. Con A = (2; 2) y B
        = (8; 2), la solución a la izquierda de A → B es P ≈ (5; 6).
      </p>
    </section>
  )
}

function arc(vertex, first, second, radius) {
  const start = Math.atan2(first.y - vertex.y, first.x - vertex.x)
  const end = Math.atan2(second.y - vertex.y, second.x - vertex.x)
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start))
  const p = (angle) =>
    `${vertex.x + radius * Math.cos(angle)} ${vertex.y + radius * Math.sin(angle)}`
  return `M${p(start)} A${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${p(end)}`
}

export function TriangulationOverlay({ data, units, orientation }) {
  if (!data?.valid) return null
  const { a, b, point: p } = data
  const u = units
  const label = (at, value, dy = 0) => (
    <text
      transform={uprightTransform(at.x, at.y, orientation, true)}
      y={dy * u}
      textAnchor="middle"
      fontSize={11 * u}
      fill="#482975"
      stroke="white"
      strokeWidth={3 * u}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {value}
    </text>
  )
  const midpoint = (x, y) => ({ x: (x.x + y.x) / 2, y: (x.y + y.y) / 2 })
  return (
    <g
      className="triangulation-overlay"
      pointerEvents="none"
      clipPath="url(#room-clip)"
      role="img"
      aria-label={`Triangulación: base ${format(data.base, 3)} metros, AP ${format(data.ap, 3)}, BP ${format(data.bp, 3)}`}
    >
      <path
        d={`M${a.x} ${a.y} L${b.x} ${b.y} L${p.x} ${p.y} Z`}
        fill="#7651ad"
        fillOpacity="0.08"
        stroke="#7651ad"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={arc(a, b, p, 24 * u)}
        fill="none"
        stroke="#7651ad"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={arc(b, a, p, 24 * u)}
        fill="none"
        stroke="#7651ad"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      {label(midpoint(a, b), `AB ${format(data.base, 2)} m`, 15)}
      {label(midpoint(a, p), `AP ${format(data.ap, 2)} m`, -8)}
      {label(midpoint(b, p), `BP ${format(data.bp, 2)} m`, -8)}
      {label(a, 'A', -22)}
      {label(b, 'B', -22)}
      <circle
        cx={p.x}
        cy={p.y}
        r={5 * u}
        fill="#7651ad"
        stroke="white"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {label(p, 'P', -13)}
    </g>
  )
}
