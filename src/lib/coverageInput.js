export function coverageKey(project) {
  return JSON.stringify({
    space: project.space,
    cameras: project.cameras.map(({ id, x, y, angle, fov, range }) => ({
      id,
      x,
      y,
      angle,
      fov,
      range,
    })),
    walls: project.walls,
  })
}
