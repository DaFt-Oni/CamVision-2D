import { degrees, inspectPoint, intersectionParameter, radians } from './geometry.js'

// A mathematical triangle can be arbitrarily thin; measurements cannot. Reject
// angles below 0.01° to avoid numerically unstable, effectively parallel rays.
export const MIN_TRIANGLE_ANGLE = 0.01
const MIN_BASE = 1e-6
const pointDistance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)
const finitePoint = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y)

export function initialTriangulation(project) {
  return {
    enabled: false,
    aId: project.cameras[0]?.id || '',
    bId: project.cameras[1]?.id || '',
    mode: 'point',
    target: 'probe',
    angleA: '53.1301',
    angleB: '53.1301',
    side: 'left',
  }
}

/** ASA triangle. φ₁ is at A, φ₂ at B; AP is opposite φ₂. Degrees and metres. */
export function solveTriangle(base, phi1, phi2) {
  if (!Number.isFinite(base) || base < MIN_BASE)
    throw new RangeError('La base AB debe ser finita y medir al menos 0,000001 m.')
  if (![phi1, phi2].every(Number.isFinite))
    throw new RangeError('Introduce ambos ángulos interiores como números válidos.')
  const gamma = 180 - phi1 - phi2
  if ([phi1, phi2, gamma].some((angle) => angle < MIN_TRIANGLE_ANGLE - 1e-10))
    throw new RangeError(
      'φ₁, φ₂ y γ deben medir al menos 0,01°. La suma φ₁ + φ₂ debe ser menor que 180°: evita triángulos planos o casi degenerados.',
    )
  const ap = (base * Math.sin(radians(phi2))) / Math.sin(radians(gamma))
  const bp = (base * Math.sin(radians(phi1))) / Math.sin(radians(gamma))
  // Equivalent to AP² + BP² − 2 AP BP cos γ, using the half-angle identity
  // to avoid subtracting nearly equal squares in a narrow triangle.
  const scale = Math.max(ap, bp)
  const cosineBase =
    scale *
    Math.hypot(
      ap / scale - bp / scale,
      2 * Math.sqrt((ap / scale) * (bp / scale)) * Math.sin(radians(gamma / 2)),
    )
  const cosineError = Math.abs(cosineBase - base)
  const relativeError = cosineError / base
  if (![ap, bp, cosineBase, relativeError].every(Number.isFinite))
    throw new RangeError('Los valores producen un resultado fuera del rango numérico admitido.')
  return {
    base,
    phi1,
    phi2,
    gamma,
    ap,
    bp,
    cosineBase,
    cosineError,
    relativeError,
    consistent: relativeError <= 1e-8,
    narrow: Math.min(phi1, phi2, gamma) < 1,
  }
}

export function triangulateAngles(a, b, phi1, phi2, side = 'left') {
  if (!finitePoint(a) || !finitePoint(b))
    throw new RangeError('Las posiciones de las cámaras deben tener coordenadas finitas.')
  if (!['left', 'right'].includes(side)) throw new RangeError('Elige un lado de la base AB.')
  const result = solveTriangle(pointDistance(a, b), phi1, phi2)
  const ux = (b.x - a.x) / result.base
  const uy = (b.y - a.y) / result.base
  const along = result.ap * Math.cos(radians(phi1))
  const height = result.ap * Math.sin(radians(phi1)) * (side === 'left' ? 1 : -1)
  const point = { x: a.x + along * ux - height * uy, y: a.y + along * uy + height * ux }
  if (!finitePoint(point)) throw new RangeError('No se puede representar el punto con estos datos.')
  return { ...result, a, b, point, side }
}

/** Angles between vectors via atan2, including obtuse and rotated triangles. */
export function triangulatePoint(a, b, point) {
  if (!finitePoint(a) || !finitePoint(b) || !finitePoint(point))
    throw new RangeError('A, B y P deben tener coordenadas finitas.')
  const base = pointDistance(a, b)
  if (base < MIN_BASE)
    throw new RangeError('Las dos cámaras coinciden: separa A y B para definir la base.')
  if (pointDistance(a, point) < MIN_BASE || pointDistance(b, point) < MIN_BASE)
    throw new RangeError(
      'P debe estar separado de ambas cámaras para definir los ángulos interiores.',
    )
  const interior = (vertex, first, second) => {
    const d1 = pointDistance(vertex, first),
      d2 = pointDistance(vertex, second)
    const u = { x: (first.x - vertex.x) / d1, y: (first.y - vertex.y) / d1 }
    const v = { x: (second.x - vertex.x) / d2, y: (second.y - vertex.y) / d2 }
    return degrees(Math.atan2(Math.abs(u.x * v.y - u.y * v.x), u.x * v.x + u.y * v.y))
  }
  const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
  const result = triangulateAngles(
    a,
    b,
    interior(a, b, point),
    interior(b, a, point),
    cross >= 0 ? 'left' : 'right',
  )
  return {
    ...result,
    referencePoint: point,
    reconstructionError: pointDistance(point, result.point),
    directAP: pointDistance(a, point),
    directBP: pointDistance(b, point),
  }
}

export function triangulationTargets(project) {
  return project.walls.flatMap((wall, index) =>
    ['a', 'b'].map((end) => ({
      value: `wall:${wall.id}:${end}`,
      label: `Pared ${String(index + 1).padStart(2, '0')} · extremo ${end.toUpperCase()}`,
      point: wall[end],
    })),
  )
}

/** For measuring a visible wall corner, contact exactly at P is allowed.
 * Only walls encountered before P obscure the reference point. Coverage keeps
 * its existing stricter segment-contact semantics. */
export function inspectMeasurementSight(camera, point, walls) {
  const inspection = inspectPoint(camera, point, [])
  const blocked = walls.some((wall) => {
    const t = intersectionParameter(camera, point, wall.a, wall.b)
    return t !== null && t < 1 - 1e-8
  })
  return { ...inspection, blocked, visible: inspection.inRange && inspection.inAngle && !blocked }
}

export function evaluateTriangulation(project, settings, probe) {
  const a =
    project.cameras.find((camera) => camera.id === settings.aId) ||
    (!settings.aId ? project.cameras[0] : undefined)
  const b =
    project.cameras.find((camera) => camera.id === settings.bId) ||
    (!settings.bId ? project.cameras.find((camera) => camera.id !== a?.id) : undefined)
  const selection = { a, b }
  try {
    if (!a || !b) throw new RangeError('Elige dos cámaras instaladas para medir el mismo punto P.')
    if (a.id === b.id) throw new RangeError('A y B deben ser cámaras distintas.')
    let result
    if (settings.mode === 'point') {
      const point =
        settings.target === 'probe'
          ? probe || { x: project.space.width / 2, y: project.space.height / 2 }
          : triangulationTargets(project).find((target) => target.value === settings.target)?.point
      if (!point)
        throw new RangeError('El extremo de pared ya no existe. Elige otro punto de referencia.')
      result = triangulatePoint(a, b, point)
    } else if (settings.mode === 'angles') {
      const parse = (value) =>
        typeof value === 'string' && value.trim()
          ? Number(value.replace(',', '.'))
          : typeof value === 'number'
            ? value
            : NaN
      result = triangulateAngles(
        a,
        b,
        parse(settings.angleA),
        parse(settings.angleB),
        settings.side,
      )
    } else throw new RangeError('Elige cómo definir el punto de triangulación.')
    const { point } = result
    return {
      ...result,
      valid: true,
      insideRoom:
        point.x >= -1e-8 &&
        point.y >= -1e-8 &&
        point.x <= project.space.width + 1e-8 &&
        point.y <= project.space.height + 1e-8,
      sightA: inspectMeasurementSight(a, point, project.walls),
      sightB: inspectMeasurementSight(b, point, project.walls),
    }
  } catch (error) {
    return { ...selection, valid: false, error: error.message }
  }
}
