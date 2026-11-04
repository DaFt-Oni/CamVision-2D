import { directionVector, fieldWidth, radians, rayEndpoint } from './geometry.js'

/** Values used by the educational breakdown, from the same geometry as the plan. */
export function cameraMath(camera, space, walls) {
  const vector = directionVector(camera.angle)
  const theoretical = {
    x: camera.x + camera.range * vector.x,
    y: camera.y + camera.range * vector.y,
  }
  const visible = rayEndpoint(camera, camera.angle, space, walls)
  const visibleDistance = Math.hypot(visible.x - camera.x, visible.y - camera.y)
  return {
    vector,
    angleRad: radians(camera.angle),
    halfFovRad: radians(camera.fov / 2),
    theoretical,
    visible,
    visibleDistance,
    clipped: visibleDistance < camera.range - 1e-8,
    width: fieldWidth(camera.range, camera.fov),
  }
}
