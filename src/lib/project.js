import { clamp } from './geometry.js'
export const COLORS = ['#27786b', '#d18a3f', '#5773b8', '#9e68aa', '#358b9b', '#b56857']
export const MAX_CAMERAS = 16,
  MAX_WALLS = 32
export const PROJECT_ICONS = ['folder', 'home', 'camera', 'grid', 'target', 'layers']
export const PROJECT_COLORS = ['#315b91', '#27786b', '#6d5799', '#a36b3d', '#526579', '#964e57']
export const uid = () => crypto.randomUUID()
export const clone = (value) => structuredClone(value)
const camera = (id, x, y, angle, fov, range, index) => ({
  id,
  name: `Cámara ${id.slice(1).padStart(2, '0')}`,
  x,
  y,
  angle,
  fov,
  range,
  color: COLORS[index % COLORS.length],
})
export const SCENARIOS = [
  {
    id: 'office',
    label: 'Oficina abierta',
    description: '16 × 12 m · 3 cámaras · 2 paredes',
    project: {
      name: 'Oficina principal',
      space: { width: 16, height: 12, cellSize: 0.25 },
      cameras: [
        camera('c1', 1, 11, 325, 90, 11, 0),
        camera('c2', 15, 11, 220, 90, 10, 1),
        camera('c3', 8, 1, 90, 100, 9, 2),
      ],
      walls: [
        { id: 'w1', a: { x: 5.5, y: 4 }, b: { x: 5.5, y: 8 } },
        { id: 'w2', a: { x: 10.5, y: 4 }, b: { x: 13, y: 4 } },
      ],
    },
  },
  {
    id: 'demo',
    label: 'Demostración académica',
    description: '10 × 8 m · 1 cámara · sin obstáculos',
    project: {
      name: 'Demostración 10 × 8',
      space: { width: 10, height: 8, cellSize: 0.25 },
      cameras: [camera('c1', 0, 0, 45, 90, 6, 0)],
      walls: [],
    },
  },
  {
    id: 'warehouse',
    label: 'Bodega con divisiones',
    description: '20 × 14 m · 4 cámaras · 3 paredes',
    project: {
      name: 'Bodega y pasillos',
      space: { width: 20, height: 14, cellSize: 0.25 },
      cameras: [
        camera('c1', 1, 13, 315, 95, 14, 0),
        camera('c2', 19, 13, 225, 95, 14, 1),
        camera('c3', 1, 1, 45, 95, 13, 2),
        camera('c4', 19, 1, 135, 95, 13, 3),
      ],
      walls: [
        { id: 'w1', a: { x: 7, y: 3 }, b: { x: 7, y: 11 } },
        { id: 'w2', a: { x: 13, y: 3 }, b: { x: 13, y: 11 } },
        { id: 'w3', a: { x: 7, y: 7 }, b: { x: 10, y: 7 } },
      ],
    },
  },
  {
    id: 'empty',
    label: 'Espacio vacío',
    description: '10 × 8 m · sin cámaras ni paredes',
    project: {
      name: 'Nuevo proyecto',
      space: { width: 10, height: 8, cellSize: 0.25 },
      cameras: [],
      walls: [],
    },
  },
]
export function resizeProject(project, changes) {
  const space = { ...project.space, ...changes }
  const fit = (point) => ({
    ...point,
    x: clamp(point.x, 0, space.width),
    y: clamp(point.y, 0, space.height),
  })
  return {
    ...project,
    space,
    cameras: project.cameras.map(fit),
    walls: project.walls
      .map((wall) => ({ ...wall, a: fit(wall.a), b: fit(wall.b) }))
      .filter((wall) => Math.hypot(wall.a.x - wall.b.x, wall.a.y - wall.b.y) > 0.01),
  }
}
/** Strict validation at the file/storage boundary. Never trust imported geometry. */
export function validateProject(value) {
  const fail = () => {
    throw new Error(
      'Archivo inválido: revisa dimensiones, cámaras y paredes. Se admiten hasta 16 cámaras y 32 paredes.',
    )
  }
  const number = (n, min, max) =>
    typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
  if (!value || typeof value !== 'object') return fail()
  const { space, cameras, walls } = value
  if (
    !space ||
    !number(space.width, 2, 50) ||
    !number(space.height, 2, 50) ||
    ![0.25, 0.5, 1].includes(space.cellSize)
  )
    return fail()
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 80) return fail()
  if (
    !Array.isArray(cameras) ||
    cameras.length > MAX_CAMERAS ||
    !Array.isArray(walls) ||
    walls.length > MAX_WALLS
  )
    return fail()
  const point = (p) => p && number(p.x, 0, space.width) && number(p.y, 0, space.height)
  const validId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 100
  if (
    new Set([...cameras, ...walls].map((item) => item?.id)).size !==
    cameras.length + walls.length
  )
    return fail()
  for (const c of cameras)
    if (
      !c ||
      !validId(c.id) ||
      !point(c) ||
      !number(c.angle, 0, 360) ||
      !number(c.fov, 1, 170) ||
      !number(c.range, 0.5, 70) ||
      typeof c.name !== 'string' ||
      !c.name.trim() ||
      c.name.length > 60 ||
      !/^#[0-9a-f]{6}$/i.test(c.color)
    )
      return fail()
  for (const w of walls)
    if (
      !w ||
      !validId(w.id) ||
      !point(w.a) ||
      !point(w.b) ||
      Math.hypot(w.a.x - w.b.x, w.a.y - w.b.y) < 0.01
    )
      return fail()
  return {
    name: value.name,
    ...(value.id === undefined ? {} : { id: validId(value.id) ? value.id : fail() }),
    ...(value.icon === undefined
      ? {}
      : { icon: PROJECT_ICONS.includes(value.icon) ? value.icon : fail() }),
    ...(value.color === undefined
      ? {}
      : { color: /^#[0-9a-f]{6}$/i.test(value.color) ? value.color : fail() }),
    space: { width: space.width, height: space.height, cellSize: space.cellSize },
    cameras: cameras.map(({ id, name, x, y, angle, fov, range, color }) => ({
      id,
      name,
      x,
      y,
      angle,
      fov,
      range,
      color,
    })),
    walls: walls.map(({ id, a, b }) => ({ id, a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } })),
  }
}
