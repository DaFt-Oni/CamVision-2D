/** Cartesian metres: 0° east, 90° north. */
export const EPSILON = 1e-8
export const radians = (degrees) => (degrees * Math.PI) / 180
export const degrees = (angle) => (angle * 180) / Math.PI
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const normalizeAngle = (angle) => ((angle % 360) + 360) % 360
export const angleDifference = (a, b) => ((((a - b + 540) % 360) + 360) % 360) - 180
export const directionVector = (angle) => ({
  x: Math.cos(radians(angle)),
  y: Math.sin(radians(angle)),
})
export const fieldWidth = (distance, aperture) => 2 * distance * Math.tan(radians(aperture / 2))
const cross = (a, b) => a.x * b.y - a.y * b.x
const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y })

/** Returns t in a+t(b-a). Includes collinear overlap. A wall touching only
 * the origin does not block a camera mounted on that wall. */
export function intersectionParameter(a, b, c, d) {
  const r = subtract(b, a),
    s = subtract(d, c),
    q = subtract(c, a)
  const denominator = cross(r, s)
  if (Math.abs(denominator) < EPSILON) {
    if (Math.abs(cross(q, r)) > EPSILON) return null
    const lengthSquared = r.x ** 2 + r.y ** 2
    if (lengthSquared < EPSILON) return null
    const t0 = (q.x * r.x + q.y * r.y) / lengthSquared
    const end = subtract(d, a)
    const t1 = (end.x * r.x + end.y * r.y) / lengthSquared
    const start = Math.max(0, Math.min(t0, t1)),
      finish = Math.min(1, Math.max(t0, t1))
    if (finish <= EPSILON || start > finish + EPSILON) return null
    return Math.max(EPSILON, start)
  }
  const t = cross(q, s) / denominator,
    u = cross(q, r) / denominator
  return t > EPSILON && t <= 1 + EPSILON && u >= -EPSILON && u <= 1 + EPSILON
    ? Math.min(1, t)
    : null
}
export function isBlocked(source, target, walls) {
  return walls.some((wall) => intersectionParameter(source, target, wall.a, wall.b) !== null)
}
export function inspectPoint(camera, point, walls = []) {
  const dx = point.x - camera.x,
    dy = point.y - camera.y
  const distance = Math.hypot(dx, dy)
  const bearing = normalizeAngle(degrees(Math.atan2(dy, dx)))
  const difference = distance < EPSILON ? 0 : Math.abs(angleDifference(bearing, camera.angle))
  const inRange = distance <= camera.range + EPSILON
  const inAngle = difference <= camera.fov / 2 + EPSILON
  const blocked = distance > EPSILON && isBlocked(camera, point, walls)
  return {
    dx,
    dy,
    distance,
    bearing,
    difference,
    inRange,
    inAngle,
    blocked,
    visible: inRange && inAngle && !blocked,
  }
}
/** Sector clipped by ray intersections, sampled every degree plus wall endpoints.
 * Numerical metrics use inspectPoint, independent of polygon approximation. */
export function visibilityPolygon(camera, space, walls) {
  const corners = [
    { x: 0, y: 0 },
    { x: space.width, y: 0 },
    { x: space.width, y: space.height },
    { x: 0, y: space.height },
  ]
  const segments = [...walls, ...corners.map((a, i) => ({ a, b: corners[(i + 1) % 4] }))]
  const half = camera.fov / 2,
    offsets = [-half, half]
  for (let i = -half; i < half; i += 1) offsets.push(i)
  for (const { a, b } of segments)
    for (const point of [a, b]) {
      const offset = angleDifference(
        degrees(Math.atan2(point.y - camera.y, point.x - camera.x)),
        camera.angle,
      )
      for (const delta of [-0.0001, 0, 0.0001])
        if (Math.abs(offset + delta) < half) offsets.push(offset + delta)
    }
  return [
    camera,
    ...offsets
      .sort((a, b) => a - b)
      .map((offset) => rayEndpoint(camera, camera.angle + offset, space, walls)),
  ]
}

/** Clip a direction ray to range, room boundaries and all walls. */
export function rayEndpoint(camera, angle, space, walls) {
  const vector = directionVector(angle)
  // Slab clipping treats a ray along the room boundary as a valid boundary ray,
  // rather than mistaking the boundary for a collinear opaque wall.
  let distance = camera.range
  if (vector.x > EPSILON) distance = Math.min(distance, (space.width - camera.x) / vector.x)
  if (vector.x < -EPSILON) distance = Math.min(distance, -camera.x / vector.x)
  if (vector.y > EPSILON) distance = Math.min(distance, (space.height - camera.y) / vector.y)
  if (vector.y < -EPSILON) distance = Math.min(distance, -camera.y / vector.y)
  const target = { x: camera.x + vector.x * distance, y: camera.y + vector.y * distance }
  let t = 1
  for (const wall of walls) {
    const hit = intersectionParameter(camera, target, wall.a, wall.b)
    if (hit !== null) t = Math.min(t, hit)
  }
  return {
    x: clamp(camera.x + vector.x * distance * t, 0, space.width),
    y: clamp(camera.y + vector.y * distance * t, 0, space.height),
  }
}
