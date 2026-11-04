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
export function exportReport(project, result) {
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
