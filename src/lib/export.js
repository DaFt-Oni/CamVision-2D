function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type })),
    link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function exportProject(project) {
  download(
    JSON.stringify(
      {
        format: 'camvision',
        version: 1,
        exportedAt: new Date().toISOString(),
        project,
      },
      null,
      2,
    ),
    'camvision-proyecto.json',
    'application/json',
  )
}
export async function exportPlanImage(svg, project, result, format = 'png') {
  if (!svg) throw new Error('Abre el plano antes de exportarlo.')
  const ns = 'http://www.w3.org/2000/svg'
  const copy = svg.cloneNode(true),
    bounds = svg.getBoundingClientRect()
  const width = 1600,
    height = Math.round((width * bounds.height) / bounds.width)
  copy.setAttribute('x', '0')
  copy.setAttribute('y', '70')
  copy.setAttribute('width', width)
  copy.setAttribute('height', height)
  copy.setAttribute('font-family', 'Arial, sans-serif')
  copy.querySelectorAll('.wall-focus-ring,.camera-focus-ring').forEach((e) => e.remove())
  const wrapper = document.createElementNS(ns, 'svg')
  wrapper.setAttribute('xmlns', ns)
  wrapper.setAttribute('width', width)
  wrapper.setAttribute('height', height + 140)
  wrapper.setAttribute('viewBox', `0 0 ${width} ${height + 140}`)
  const background = document.createElementNS(ns, 'rect')
  background.setAttribute('width', '100%')
  background.setAttribute('height', '100%')
  background.setAttribute('fill', '#fff')
  wrapper.append(background)
  const text = (y, content, size) => {
    const t = document.createElementNS(ns, 'text')
    t.setAttribute('x', '30')
    t.setAttribute('y', y)
    t.setAttribute('font-family', 'Arial, sans-serif')
    t.setAttribute('font-size', size)
    t.setAttribute('fill', '#172b46')
    t.textContent = content
    wrapper.append(t)
  }
  text(35, `CamVision · ${project.name} · ${project.space.width} × ${project.space.height} m`, 24)
  wrapper.append(copy)
  text(
    height + 102,
    `Cobertura ${result.coverage.toFixed(2)} % · Zona ciega ${result.blind.toFixed(2)} % · Celda ${project.space.cellSize} m`,
    19,
  )
  text(
    height + 127,
    `Vista del plano actual · Coordenadas en metros · ${new Date().toLocaleDateString('es-CL')}`,
    16,
  )
  const content = new XMLSerializer().serializeToString(wrapper)
  if (format === 'svg') {
    download(content, 'camvision-plano.svg', 'image/svg+xml')
    return
  }
  const url = URL.createObjectURL(new Blob([content], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height + 140
    canvas.getContext('2d').drawImage(image, 0, 0)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('No se pudo crear la imagen.')
    download(blob, 'camvision-plano.png', 'image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
export function exportMatrix(project, result) {
  const lines = ['fila_y_desde_abajo,columna_x,centro_x_m,centro_y_m,area_celda_m2,camaras']
  result.matrix.forEach((row, r) =>
    row.forEach((count, c) => {
      const w = Math.min(project.space.cellSize, project.space.width - c * project.space.cellSize)
      const h = Math.min(project.space.cellSize, project.space.height - r * project.space.cellSize)
      lines.push(
        `${r + 1},${c + 1},${c * project.space.cellSize + w / 2},${r * project.space.cellSize + h / 2},${w * h},${count}`,
      )
    }),
  )
  download('\ufeff' + lines.join('\n'), 'camvision-matriz.csv', 'text/csv;charset=utf-8')
}
export function describeTriangulation(data) {
  if (!data?.valid) return ''
  const n = (value) => value.toFixed(6)
  return `\nTRIANGULACIÓN ENTRE DOS CÁMARAS
A: ${data.a.name} (${n(data.a.x)}, ${n(data.a.y)}) m
B: ${data.b.name} (${n(data.b.x)}, ${n(data.b.y)}) m
P: (${n(data.point.x)}, ${n(data.point.y)}) m; lado: ${data.side === 'left' ? 'izquierda' : 'derecha'} de A hacia B
b = AB = ${n(data.base)} m; φ₁ = ${n(data.phi1)}°; φ₂ = ${n(data.phi2)}°
γ = 180° − φ₁ − φ₂ = ${n(data.gamma)}°
AP = b × sen(φ₂) / sen(γ) = ${n(data.ap)} m
BP = b × sen(φ₁) / sen(γ) = ${n(data.bp)} m
Ley de cosenos: bᶜ = √(AP² + BP² − 2 AP BP cos γ) = ${n(data.cosineBase)} m
Error |bᶜ − b| = ${data.cosineError.toExponential(3)} m; consistencia relativa ≤ 10⁻⁸: ${data.consistent ? 'sí' : 'no'}
P en el recinto: ${data.insideRoom ? 'sí' : 'no'}; observable desde A: ${data.sightA.visible ? 'sí' : 'no'}; desde B: ${data.sightB.visible ? 'sí' : 'no'}
Se admite contacto con una pared exactamente en P como referencia; un obstáculo anterior bloquea la medición.
`
}
export function exportReport(project, result, triangulation) {
  const n = (value) => value.toFixed(2)
  const metrics = (r) =>
    `Cámaras: ${r.cameraCount}\nCobertura: ${n(r.coverage)} % (${n(r.coveredArea)} m²)\nPuntos ciegos: ${n(r.blind)} % (${n(r.blindArea)} m²)\nSuperposición: ${n(r.overlap)} % (${n(r.overlapArea)} m²)`
  const report = `CAMVISION — INFORME DE COBERTURA GEOMÉTRICA 2D
Funciones y Matrices · Ingeniería en Informática · INACAP
Fecha: ${new Date().toLocaleString('es-CL')}
Proyecto: ${project.name}

ESPACIO Y PARÁMETROS
Ancho: ${project.space.width} m · Largo: ${project.space.height} m
Superficie: ${n(result.totalArea)} m²
Celda nominal: ${project.space.cellSize} m · Matriz: ${result.rows} filas × ${result.columns} columnas
Coordenadas cartesianas: origen inferior izquierdo; 0° este, 90° norte.

RESULTADOS
${metrics(result)}

CÁMARAS
${project.cameras.map((c) => `${c.name} [${c.id}]: (${c.x}, ${c.y}) m; θ=${c.angle}°; α=${c.fov}°; d=${c.range} m`).join('\n') || 'Sin cámaras.'}

PAREDES (segmentos sin espesor)
${project.walls.map((w, i) => `${i + 1}. (${w.a.x}, ${w.a.y}) → (${w.b.x}, ${w.b.y}) m`).join('\n') || 'Sin paredes.'}

${describeTriangulation(triangulation)}
MODELO MATEMÁTICO
Vector unitario u = (cos θ, sen θ). Extremo = (x₀ + d cos θ, y₀ + d sen θ).
Ancho teórico del campo a distancia axial d: A = 2d tan(α/2).
El ancho teórico corresponde al plano perpendicular al eje; no es la longitud de la cuerda del sector de radio d.
Distancia r = √((x-x₀)² + (y-y₀)²). Dirección β = atan2(y-y₀, x-x₀).
Visibilidad: r ≤ alcance, diferencia angular mínima ≤ α/2, sin intersección con paredes.
Conversión: radianes = grados × π/180. Matriz M[i,j] = número de cámaras visibles en el centro de la celda.
Cobertura = 100 × Σ(area_celda × [M>0]) / superficie total.
Superposición = 100 × Σ(area_celda × [M≥2]) / superficie total.
Las celdas del borde usan su superficie real. La unión cubierta cuenta cada celda una sola vez.
Las filas de la matriz CSV comienzan desde abajo (Y creciente).

ALCANCE Y LIMITACIONES
Aproximación discreta por centros de celda, no cálculo exacto del área continua. Cambiar la resolución puede alterar los resultados.
Las paredes bloquean segmentos, incluyendo extremos; el contacto únicamente en el origen permite montar cámaras sobre una pared.
Modelo académico 2D; no incluye iluminación, sensores, altura, video ni reconocimiento. No garantiza seguridad ni sustituye planificación profesional.
`
  download(report, 'camvision-informe.txt', 'text/plain;charset=utf-8')
}
