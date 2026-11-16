export function normalizeMeasurement(value, cameras, walls, space) {
  const cameraId = (id, index) => (cameras.some((c) => c.id === id) ? id : cameras[index]?.id || '')
  const target =
    value?.target === 'probe' ||
    walls.some((w) => ['a', 'b'].some((end) => value?.target === `wall:${w.id}:${end}`))
      ? value.target
      : 'probe'
  const point = value?.probe
  return {
    enabled: value?.enabled === true,
    aId: cameraId(value?.aId, 0),
    bId: cameraId(value?.bId, 1),
    mode: value?.mode === 'angles' ? 'angles' : 'point',
    target,
    angleA: String(value?.angleA ?? '53.1301').slice(0, 32),
    angleB: String(value?.angleB ?? '53.1301').slice(0, 32),
    side: value?.side === 'right' ? 'right' : 'left',
    probe:
      point && Number.isFinite(point.x) && Number.isFinite(point.y)
        ? {
            x: Math.max(0, Math.min(space.width, point.x)),
            y: Math.max(0, Math.min(space.height, point.y)),
          }
        : null,
  }
}
