# OptiVision

## Guía de presentación y fundamentos matemáticos

Versión revisada: 0.1.6 · Fecha: 3 de noviembre de 2026

Documento elaborado a partir del código del proyecto. Describe lo implementado, explica cómo defender sus resultados y separa las mejoras propuestas de las funciones disponibles. Las fórmulas en bloques usan nombres de variables en texto para facilitar su lectura y copia.

### 1. Qué falta para presentarlo

**Mi evaluación:** la base está lista para una demostración académica. El valor del proyecto está en conectar parámetros de cámaras, geometría, obstáculos, una matriz espacial y resultados que cambian al editar. Ahora conviene cerrar y explicar bien ese recorrido.

| Prioridad              | Afinamiento propuesto                                                                                                     | Motivo                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Antes de presentar     | Elegir nombre y subtítulo; unificar título, menú e informes.                                                              | Da una identidad consistente sin cambiar el funcionamiento.                                                           |
| Antes de presentar     | Usar «simulación y evaluación de cobertura» en la presentación. Revisar el pie del menú, que todavía dice «optimización». | El usuario mejora la distribución manualmente; no existe un optimizador automático.                                   |
| Antes de presentar     | Ensayar en la pantalla o proyector real, con escala manual y vista restablecida.                                          | La legibilidad y la altura disponible importan más que agregar otra función. No requiere volver al ajuste automático. |
| Antes de presentar     | Llevar un escenario simple, otro con paredes y una copia JSON de respaldo.                                                | Permite explicar y recuperar la demostración de forma reproducible.                                                   |
| Antes de presentar     | Declarar las aproximaciones del modelo y mostrar un cálculo verificable.                                                  | Evita confundir un dibujo visual con una medición exacta del área.                                                    |
| Después, si hay tiempo | Deshacer y rehacer movimientos, eliminaciones y cambios del recinto.                                                      | Es la mejora funcional que priorizaría para experimentar con confianza. Actualmente no está implementada.             |
| Después, si hay tiempo | Asas sobre la cámara para orientación, apertura y alcance, sincronizadas con Parámetros.                                  | Acerca la edición al comportamiento de un simulador geométrico. Actualmente se editan esos valores en el inspector.   |
| Después, si hay tiempo | Exportar una lámina PNG/SVG o informe PDF desde la app.                                                                   | Facilita entregar evidencia visual. Hoy la app exporta JSON, CSV y TXT; este PDF es documentación externa.            |

**Comprobación técnica realizada para esta guía:** 62 pruebas automáticas aprobadas, revisión de ESLint sin errores y compilación de producción completada. Esto respalda los casos cubiertos por esas comprobaciones; no reemplaza el ensayo de la interfaz en el equipo de presentación.

**Cómo describir el proyecto:** «Simulador geométrico 2D para explorar cómo la ubicación, orientación, apertura, alcance y obstáculos afectan la cobertura de un conjunto de cámaras».

<!-- pagebreak -->

### 2. Nombres y recorrido para la demostración

| Nombre propuesto   | Qué comunica                                                                     |
| ------------------ | -------------------------------------------------------------------------------- |
| Cametría           | Cámara y geometría. Mi favorito para un proyecto académico con identidad propia. |
| ÁnguloCam          | Relación directa entre cámaras, orientación y apertura.                          |
| VectorCam          | Dirección de cada cámara y base matemática del simulador.                        |
| SectorCam          | Campo de visión como sector circular. Corto y técnico.                           |
| Visión Angular     | Sobrio, descriptivo y asociado a trigonometría.                                  |
| CampoCam           | Campo de visión y cobertura; fácil de recordar.                                  |
| PlanoCam           | Trabajo sobre un plano y distribución de cámaras.                                |
| GeoCámara          | Geometría aplicada a cámaras; enfoque educativo explícito.                       |
| Foco Angular       | Orientación, apertura y alcance visual.                                          |
| Visor de Cobertura | Nombre descriptivo, adecuado si se prefiere claridad a una marca.                |

**Tres opciones que elegiría:** Cametría, ÁnguloCam y VectorCam. Subtítulo común recomendado: **«Simulador geométrico de cobertura 2D»**. Son propuestas creativas; no se ha investigado su disponibilidad comercial o de dominio. Esta guía conserva el nombre actual de la aplicación.

**Guion de seis minutos:**

1. **Problema y propósito, 30 s.** Ubicar cámaras no consiste solo en sumar alcances: importan los ángulos, las paredes y la superposición.
2. **Una cámara, 60 s.** Abrir «Demostración académica». Mostrar posición, orientación, apertura y alcance. Relacionarlos con el vector y el extremo del eje en Matemáticas.
3. **Un punto, 60 s.** Comprobar P = (3; 4) m: distancia de 5 m y separación angular de aproximadamente 8,13°. Agregar la pared (2; 0)-(2; 5) y mostrar que el mismo punto queda bloqueado.
4. **La matriz, 60 s.** Restablecer el ejemplo, activar Matriz, acercarse y seleccionar una celda. Su número es cuántas cámaras ven su centro. Mostrar que la resolución cambia los datos y el zoom solo la vista.
5. **Varias cámaras, 90 s.** Abrir «Oficina abierta»: cobertura, puntos ciegos, superposición y aporte exclusivo. Mover una cámara y explicar el cambio sin prometer que cualquier movimiento mejora el resultado.
6. **Alcance y cierre, 60 s.** Explicar la aproximación por celdas, guardar y exportar JSON/CSV. Recordar que es un modelo 2D de evaluación manual.

**Preparación práctica:** conservar los ejemplos originales, ensayar los valores de esta guía y llevar los archivos JSON aparte del guardado local. Las copias locales pertenecen al navegador y al origen, incluido su puerto. El respaldo v0.1.0 ya existente debe mantenerse intacto; conviene congelar también la versión que se presente.

<!-- pagebreak -->

### 3. Modelo, variables y unidades

El recinto es el rectángulo cerrado R = [0; W] × [0; H]. El origen está abajo a la izquierda. X crece a la derecha e Y hacia arriba. Las longitudes se expresan en metros; las superficies, en metros cuadrados. El norte es la dirección positiva de Y como referencia del dibujo, sin georreferenciación.

| Símbolo / nombre | Significado                                               | Dato en el código         |
| ---------------- | --------------------------------------------------------- | ------------------------- |
| W, H             | Ancho en X y largo en Y del recinto, en m.                | space.width, space.height |
| h                | Lado nominal de una celda, en m.                          | space.cellSize            |
| N                | Número de cámaras.                                        | cameras.length            |
| Ck = (xk; yk)    | Posición de la cámara k.                                  | camera.x, camera.y        |
| theta            | Orientación: 0° este, 90° norte, 180° oeste, 270° sur.    | camera.angle              |
| alpha            | Apertura horizontal total del campo de visión, en grados. | camera.fov                |
| d                | Alcance radial máximo, en m.                              | camera.range              |
| P = (x; y)       | Punto a inspeccionar o centro de una celda.               | point, probe              |
| A, B             | Extremos de una pared opaca sin espesor.                  | wall.a, wall.b            |
| u = (ux; uy)     | Vector unitario que señala una dirección.                 | directionVector           |
| i, j             | Índices de fila y columna, desde cero en memoria.         | row, column               |
| aij              | Área real de una celda, en m².                            | width * height            |
| Vk(P)            | Indicador: 1 si k ve P; 0 en otro caso.                   | inspectPoint(...).visible |
| Mij              | Cantidad de cámaras que ven el centro de una celda.       | result.matrix[i][j]       |

**Supuestos:** cámara puntual, campo circular limitado por un ángulo y un alcance, paredes como segmentos totalmente opacos y recinto rectangular. No hay espesor de paredes que reste área del suelo. No se modelan altura, inclinación vertical, iluminación, lente real, resolución de imagen, vídeo ni reconocimiento.

**Funciones y dependencia:** los parámetros producen una función de visibilidad por cámara; sus valores producen una matriz; de la matriz se obtienen superficies y porcentajes. Las funciones son deterministas para la misma geometría y resolución.

```text
parametros + paredes -> Vk(P) -> Mij -> areas -> porcentajes
                                      |
                                      +-> resumen, analisis y CSV
```

El punto consultado puede cambiar sin modificar el proyecto. Girar, desplazar, voltear o ampliar la vista tampoco cambia los datos físicos.

<!-- pagebreak -->

### 4. Ángulos, trigonometría y vectores

**4.1 Grados y radianes.** La interfaz recibe grados. Las funciones Math.sin, Math.cos y Math.tan de JavaScript reciben radianes. Las funciones radians y degrees realizan estas conversiones:

```text
theta_rad = theta * pi / 180
theta_grados = theta_rad * 180 / pi
```

Pi representa la razón entre circunferencia y diámetro. Ejemplo: 45° = pi/4 = 0,785398... rad. Confundir ambas unidades cambia por completo el resultado trigonométrico.

**4.2 Periodicidad y diferencia angular.** normalizeAngle lleva un ángulo a [0; 360). angleDifference devuelve la diferencia con signo en [-180; 180). En las fórmulas, mod es el resto normalizado no negativo:

```text
normalizar(a) = mod(a, 360)
dif(a, b) = mod(a - b + 180, 360) - 180
delta = abs(dif(beta, theta))
```

Sirve para que 359° y 1° estén separados por 2°, en lugar de 358°. La implementación usa una doble operación de resto para manejar también valores negativos. Los 180° exactos se representan con signo negativo; su valor absoluto sigue siendo 180°.

**4.3 Vector unitario.** directionVector transforma orientación en componentes cartesianas:

```text
u = (cos(theta_rad), sin(theta_rad))
norma(u) = sqrt(ux^2 + uy^2) = 1
```

El coseno indica la componente horizontal; el seno, la vertical. Para 45°, u ≈ (0,707107; 0,707107). Multiplicar por una longitud produce un desplazamiento en metros.

**4.4 Recta paramétrica y extremo teórico.** Un rayo de dirección phi se describe con un parámetro de distancia ell:

```text
Q(ell) = C + ell * u(phi),    ell >= 0
E_teorico = C + d * u(theta),    ell = d
```

cameraMath calcula el extremo teórico del eje central. Para C = (0; 0), theta = 45° y d = 6 m, E ≈ (4,242641; 4,242641) m. Todavía no se han aplicado paredes ni bordes del recinto.

**4.5 Ancho por tangente.** fieldWidth usa dos triángulos rectángulos, cada uno con cateto adyacente d y ángulo alpha/2:

```text
ancho_axial = 2 * d * tan(alpha_rad / 2)
```

Para d = 6 m y alpha = 90°, el ancho axial es 12 m. Es la separación de los lados angulares en una recta perpendicular al eje a distancia axial d. **No es el ancho de la cuerda del sector de radio d ni su área visible.** La cuerda del arco sería 2d sin(alpha/2) ≈ 8,485281 m en este ejemplo; se incluye aquí para distinguir conceptos y no es el algoritmo de cobertura.

<!-- pagebreak -->

### 5. Distancia, dirección y función de visibilidad

**5.1 Distancia euclídea.** inspectPoint resta las coordenadas y aplica el teorema de Pitágoras mediante Math.hypot:

```text
dx = x - xk
dy = y - yk
rho = sqrt(dx^2 + dy^2)
en_alcance = (rho <= d)
```

rho es la distancia cámara-punto. No se debe confundir con d, que es un parámetro máximo configurado.

**5.2 Dirección hacia el punto.** atan2 distingue los cuatro cuadrantes y los casos verticales, a diferencia de una división dy/dx aislada:

```text
beta = normalizar(atan2(dy, dx) * 180 / pi)
delta = abs(dif(beta, theta))
en_apertura = (delta <= alpha / 2)
```

beta es el rumbo absoluto hacia P. delta es cuánto se desvía ese rumbo del eje de la cámara. Si P coincide con C, la dirección matemática no está definida; el programa fija delta = 0, no aplica bloqueo y considera visible el origen.

**5.3 Lógica e indicadores.** isBlocked comprueba si alguna pared intercepta el segmento C-P. La visibilidad exige tres condiciones simultáneas:

```text
visible = en_alcance AND en_apertura AND NOT bloqueado
Vk(P) = 1 si visible; 0 en caso contrario
```

Los límites de alcance y apertura se incluyen. En el código se usan pequeñas tolerancias numéricas, explicadas en la sección 11. inspectPoint evalúa geometría; los puntos del recinto se limitan mediante la interfaz y los centros de celda se generan dentro de él.

**Ejemplo comprobable en la app:** C = (0; 0) m, theta = 45°, alpha = 90°, d = 6 m y P = (3; 4) m.

| Cálculo                 | Resultado  | Interpretación                                                         |
| ----------------------- | ---------- | ---------------------------------------------------------------------- |
| dx, dy                  | 3 m, 4 m   | Desplazamiento desde la cámara.                                        |
| rho = sqrt(9 + 16)      | 5 m        | Cumple 5 ≤ 6.                                                          |
| beta = atan2(4, 3)      | 53,130102° | Dirección del punto desde el eje X.                                    |
| delta = abs(beta - 45°) | 8,130102°  | Cumple 8,130102 ≤ 45.                                                  |
| Sin paredes             | Vk(P) = 1  | El punto es visible.                                                   |
| Con pared (2; 0)-(2; 5) | Vk(P) = 0  | Alcance y apertura se cumplen, pero la línea de visión está bloqueada. |

Que una cámara tenga un alcance largo no garantiza ver un punto: basta fallar una de las tres condiciones.

<!-- pagebreak -->

### 6. Intersección de segmentos y recorte de rayos

**6.1 Producto cruzado 2D.** Es el determinante escalar de dos vectores del plano:

```text
cross(v, w) = vx * wy - vy * wx
```

Permite detectar paralelismo y resolver intersecciones. El producto escalar dot(v,w) = vx*wx + vy*wy se usa para proyectar extremos cuando los segmentos son colineales. Estas operaciones están dentro de intersectionParameter.

**6.2 Resolver el cruce.** Para el segmento cámara-punto y la pared, se buscan dos parámetros adimensionales t y lambda:

```text
r = P - C;  s = B - A;  q = A - C
C + t*r = A + lambda*s
D = cross(r, s)
t = cross(q, s) / D
lambda = cross(q, r) / D
```

Si D no es prácticamente cero, hay bloqueo cuando 0 < t ≤ 1 y 0 ≤ lambda ≤ 1, con las tolerancias del código. La pared toca el tramo entre la cámara y el punto. En el código lambda se llama u; aquí se cambia el nombre para no confundirlo con el vector unitario.

**Ejemplo anterior:** r = (3; 4), s = (0; 5), q = (2; 0). D = 15, t = 10/15 = 2/3 y lambda = 8/15. El cruce ocurre en (2; 8/3) m, antes de llegar a P. Por eso la pared bloquea el punto.

**6.3 Paralelismo y colinealidad.** Si D ≈ 0, se comprueba cross(q,r). Si no es cero, los segmentos son paralelos separados. Si también es prácticamente cero, son colineales: se proyectan A y B sobre r con t0 = dot(A-C,r)/dot(r,r) y t1 = dot(B-C,r)/dot(r,r), y se comprueba la superposición de [min(t0,t1); max(t0,t1)] con [0; 1]. El contacto únicamente en C se ignora para permitir cámaras montadas en paredes. El contacto en el destino o en el extremo de una pared sí bloquea. Los segmentos degenerados se descartan.

**6.4 Primer obstáculo y borde.** rayEndpoint comienza con ell = d. Para ux > 0 limita ell con (W-xk)/ux; para ux < 0, con -xk/ux. Aplica el mismo criterio en Y usando H. Las componentes próximas a cero no se dividen. Después busca la primera intersección de pared:

```text
T = C + ell * u
t_min = min(1, todos los parametros de interseccion validos)
E_visible = C + ell * t_min * u
```

En el eje de 45° del ejemplo con pared x = 2, el extremo visible es (2; 2) m y su distancia es 2 sqrt(2) ≈ 2,828427 m. **Es la longitud visible del eje central, no el área de todo el campo.** cameraMath la compara con d para indicar si el eje está recortado.

**6.5 Polígono visual.** visibilityPolygon lanza rayos en los extremos de la apertura, aproximadamente cada grado y hacia extremos de paredes y esquinas, con perturbaciones de ±0,0001°. Ordena sus direcciones y une sus extremos recortados. Es una aproximación para dibujar sombras; los porcentajes se calculan por centros de celda y no por el área de ese polígono.

<!-- pagebreak -->

### 7. Discretización del recinto y matriz espacial

**7.1 Techo, dimensiones y centros.** calculateCoverage divide el recinto en celdas de lado nominal h. Math.ceil evita perder las franjas finales cuando las dimensiones no son múltiplos de h:

```text
columnas = ceil(W / h)
filas = ceil(H / h)
ancho_j = min(h, W - j*h)
alto_i = min(h, H - i*h)
aij = ancho_j * alto_i
Pij = (j*h + ancho_j/2, i*h + alto_i/2)
```

Se usa i = 0,...,filas-1 desde abajo y j = 0,...,columnas-1 desde la izquierda. El CSV muestra i+1 y j+1, empezando en 1, pero conserva el mismo sentido físico. No hay inversión de filas en los datos.

**7.2 Matriz de conteos.** Cada cámara evalúa el mismo centro Pij:

```text
Mij = sumatoria, k=1..N, de Vk(Pij)
Mij pertenece a {0, 1, ..., N}
```

Mij = 0 significa que ninguna cámara ve el centro; 1 significa una sola; 2 o más indica superposición. La matriz completa contiene enteros, no solo valores booleanos. matrixPaths agrupa visualmente las clases 0, 1 y 2+ en rectángulos SVG contiguos; no modifica los conteos reales, que conservan la tabla y el CSV.

**7.3 Seleccionar una celda.** coverageCellAt usa floor(x/h) y floor(y/h). Un punto exactamente sobre el borde superior o derecho se asigna a la última fila o columna válida. El centro se obtiene con el ancho y alto reales de esa celda, incluyendo los bordes parciales.

**Ejemplo de celdas parciales:** W = 2,1 m, H = 2,3 m, h = 1 m. Hay 3 × 3 celdas: anchos 1, 1 y 0,1 m; altos 1, 1 y 0,3 m. La esquina superior derecha tiene área 0,03 m². La suma de las nueve áreas es 4,83 m², exactamente W*H.

Si, en una matriz didáctica, únicamente esa esquina tuviera M > 0, la cobertura sería 100*0,03/4,83 ≈ 0,621118 %. **No sería 1/9 = 11,111111 %.** Contar celdas sin ponderarlas sería incorrecto en este caso. Este ejemplo ilustra la ponderación; no es un escenario de cámaras suministrado por la app.

**Qué significa «matriz» aquí:** es una representación espacial de resultados de visibilidad. No se calcula su inversa, rango, determinante ni producto matricial. Puede ser rectangular. Los determinantes usados para intersecciones y las transformaciones de vista son conceptos distintos de esta matriz de cobertura.

<!-- pagebreak -->

### 8. Conjuntos, superficies y porcentajes

La unión de lo que ve cada cámara define la cobertura total. La intersección de coberturas produce zonas compartidas. Para sumar áreas se usa el indicador [condición], que vale 1 si la condición es verdadera y 0 si es falsa. Las sumas recorren todas las celdas.

```text
S  = W * H                         superficie total
Sc = SUM aij * [Mij >= 1]           cubierta por al menos una camara
So = SUM aij * [Mij >= 2]           superpuesta: dos o mas camaras
S0 = S - Sc                        sin cobertura
S1 = Sc - So                       cubierta por exactamente una
```

Sc, So, S0 y S1 son **estimaciones** de área a partir de centros de celda. S es el área exacta del rectángulo definido. Las paredes no se descuentan de S porque no tienen espesor en el modelo.

```text
cobertura_pct = 100 * Sc / S
ciegos_pct    = 100 * S0 / S
solape_pct    = 100 * So / S
unica_pct    = 100 * S1 / S
```

**Interpretación:** el denominador es siempre el área total del recinto. El porcentaje de superposición no es «qué proporción de la zona cubierta se superpone». Esa otra razón sería 100*So/Sc, si Sc > 0, y no es el indicador principal implementado.

**No sumar dos veces.** So ya pertenece a Sc. Cobertura y superposición no son categorías disjuntas. En cambio, las categorías de la gráfica son cobertura única, superposición y zona ciega:

```text
S1 + So + S0 = S
cobertura_pct + ciegos_pct = 100
unica_pct + solape_pct + ciegos_pct = 100
0 <= So <= Sc <= S
```

Distribution traduce esas proporciones a un gráfico circular mediante conic-gradient. El ángulo de un sector equivale a 360*(área/S), o 3,6 veces su porcentaje. El gráfico visualiza las métricas; no las calcula.

**Aporte de cada cámara.** calculateCoverage obtiene también:

```text
Ak = SUM aij * Vk(Pij)                   area vista por la camara k
Ek = SUM aij * [Vk(Pij)=1 AND Mij=1]      aporte exclusivo de k
SUM Ek = S1
SUM Ak = SUM aij * Mij
```

Ak incluye zonas compartidas; Ek mide la superficie que perdería su única cámara si se eliminara k, manteniendo la misma geometría y cuadrícula. Sumar Ak puede superar la cobertura de unión e incluso S. Dos cámaras idénticas duplican M en sus celdas visibles, pero no duplican Sc. Añadir una cámara no reduce Sc si el resto permanece fijo.

<!-- pagebreak -->

### 9. Resultados reproducibles y error de discretización

Valores calculados ejecutando las funciones de la versión 0.1.6 sobre las plantillas originales, con h = 0,25 m. No corresponden a una sesión modificada por el usuario.

| Escenario              | Matriz  | Área total | Área cubierta | Cobertura   | Área superpuesta |
| ---------------------- | ------- | ---------- | ------------- | ----------- | ---------------- |
| Oficina abierta        | 48 × 64 | 192 m²     | 127,625 m²    | 66,471354 % | 56,4375 m²       |
| Demostración académica | 32 × 40 | 80 m²      | 28,1875 m²    | 35,234375 % | 0 m²             |
| Bodega con divisiones  | 56 × 80 | 280 m²     | 223,125 m²    | 79,6875 %   | 184,25 m²        |
| Espacio vacío          | 32 × 40 | 80 m²      | 0 m²          | 0 %         | 0 m²             |

**Desglose de Oficina abierta:** S0 = 64,375 m²; S1 = 71,1875 m²; hay 2.042 celdas cubiertas y 903 superpuestas de 3.072. Al ser todas de 0,0625 m², Sc = 2.042*0,0625 = 127,625 m². La cámara 1 ve 76,75 m² y aporta 36,625 m² exclusivos; la 2, 72,625 y 22,5625 m²; la 3, 55,875 y 12 m². Sus aportes exclusivos suman S1.

Para la cámara 1 de Oficina: C = (1; 11), theta = 325°, alpha = 90°, d = 11 m. u ≈ (0,819152; -0,573576). Extremo teórico ≈ (10,010672; 4,690659) m. La pared vertical x = 5,5 recorta el eje en (5,5; 7,849066) m: distancia visible ≈ 5,493486 m. El ancho axial teórico sigue siendo 22 m; no equivale a la superficie visible recortada.

**La aproximación empleada:** se evalúa el centro de cada celda y se asigna su área completa según esa evaluación. Es una suma por puntos medios de una función indicadora. Una celda atravesada por un arco o una sombra puede quedar clasificada de modo diferente de su superficie continua real.

**Referencia analítica para validar, no para calcular cobertura en la app:** en Demostración académica, el campo es un cuarto de círculo de radio 6 m que cabe en el recinto. Sin obstáculos, el área continua es:

```text
area_sector = (alpha/360) * pi * d^2
area_referencia = (90/360) * pi * 6^2 = 9*pi
                 = 28,274333882... m2
cobertura_referencia = 100 * 9*pi / 80 = 35,342917353... %
```

| h      | Área estimada | Cobertura estimada | Diferencia de área frente a 9*pi |
| ------ | ------------- | ------------------ | -------------------------------- |
| 1 m    | 28 m²         | 35 %               | -0,274333882 m²                  |
| 0,5 m  | 28 m²         | 35 %               | -0,274333882 m²                  |
| 0,25 m | 28,1875 m²    | 35,234375 %        | -0,086833882 m²                  |

Las celdas pequeñas permiten describir mejor los bordes, con más trabajo de cálculo. La estimación no tiene que crecer siempre ni mejorar estrictamente en cada refinamiento; puede subir o bajar según dónde caigan los centros. La app no proporciona una cota certificada del error ni un porcentaje «exacto» continuo.

<!-- pagebreak -->

### 10. Transformaciones de la vista y escalas

Hay cuatro conceptos independientes: dimensiones físicas W/H, resolución h de la matriz, zoom del plano y tamaño visual del marco. Cambiar W/H o h puede cambiar los resultados; cambiar el zoom o el tamaño del marco no cambia M ni las áreas.

**10.1 Escala uniforme.** createViewport usa los mismos píxeles por metro en X e Y. Así no deforma los ángulos ni el recinto. Para una vista rotada phi, la caja envolvente tiene dimensiones:

```text
W_phi = abs(W*cos(phi)) + abs(H*sin(phi))
H_phi = abs(W*sin(phi)) + abs(H*cos(phi))
s_base = min((ancho_px - 112)/W_phi, (alto_px - 120)/H_phi)
s = s_base * z
unidades_por_pixel = 1/s
```

phi se convierte a radianes para seno y coseno. z es el zoom limitado a [0,5; 4]; s se expresa en píxeles por metro. Los márgenes de 112 y 120 píxeles reservan lugar a ejes y controles. La escala base encuadra el recinto dentro del lienzo existente; no es un modo automático de adaptar toda la página a la altura de la pantalla.

**10.2 Traslación, rotación y reflexión.** En coordenadas SVG, alrededor del centro O = (W/2; H/2), viewTransform y transformViewPoint aplican:

```text
v' = O + R(phi) * F * (v - O)
R(phi) = [[cos(phi), -sin(phi)], [sin(phi), cos(phi)]]
F = [[sx, 0], [0, sy]],    sx, sy pertenecen a {-1, 1}
v = O + F * R(-phi) * (v' - O)
```

sx y sy valen -1 cuando está activo el volteo correspondiente. La última expresión es la transformación inversa. Se usa para recuperar posiciones físicas y mostrar las celdas correctas tras girar o voltear. Estas son transformaciones geométricas de la vista; no operaciones sobre M.

SVG tiene Y hacia abajo; el grupo del mundo aplica y_svg = H-y. Una rotación positiva se ve en sentido horario en coordenadas de pantalla. La orientación física theta de las cámaras sigue midiendo en sentido antihorario desde X positivo. uprightTransform contrarresta giro y reflejos para mantener legibles las etiquetas.

**10.3 Ratón y zoom.** Plan convierte el punto de pantalla con la inversa de getScreenCTM del grupo del mundo. Esa matriz afín incluye traslaciones, escala, giro, reflejos y conversión de Y. La rueda cambia z a clamp(z*exp(-0,002*deltaY),0,5,4) y corrige el desplazamiento para conservar el punto bajo el cursor. Los botones cambian z en pasos de 0,25.

**10.4 Legibilidad.** Radios y fuentes se multiplican por 1/s para conservar su tamaño aproximado en píxeles al hacer zoom. niceStep usa logaritmo decimal y potencias de diez para escoger marcas de la familia 1, 2 y 5. visibleMatrixCells oculta números demasiado pequeños y los que quedan fuera de vista; no elimina datos de la matriz.

**10.5 Marco manual.** calculateDrawingFrame usa un factor escala/100, limitado al 60-100 %, con 95 % inicial y una proporción vertical de altura 1,06 veces el ancho de referencia. En escritorio reduce ambos lados; en móvil conserva el ancho disponible y reduce la altura. Es una preferencia visual, no una escala cartográfica ni una resolución numérica.

<!-- pagebreak -->

### 11. Precisión, límites y algoritmo completo

**11.1 Aritmética y tolerancias.** JavaScript calcula con números de punto flotante de doble precisión. Algunas operaciones decimales no son exactas. EPSILON = 10^-8 se usa para decidir si una cantidad es prácticamente cero o si un punto está en un límite. Se aplica a magnitudes de distinta naturaleza: distancias, parámetros, productos cruzados y ángulos. Por ello no representa una precisión física uniforme de 10^-8 m ni una cota del error de cobertura.

**11.2 Redondeo y saturación.** format redondea al mostrar; los cálculos geométricos conservan sus valores internos. NumberField limita los datos a sus rangos y redondea a tres decimales al confirmar. clamp(v,a,b) = max(a,min(b,v)) evita salir de un intervalo. El arrastre ajusta coordenadas con round(20*x)/20, es decir, una malla de 0,05 m; las flechas desplazan cámaras 0,25 m. La creación de una pared con el ratón exige al menos 0,1 m; la validación de archivos admite segmentos desde 0,01 m. Estos ajustes de entrada son independientes de h.

**11.3 Rangos del contrato de datos.** validateProject acepta W/H entre 2 y 50 m; h en {0,25; 0,5; 1} m; posiciones dentro del recinto; orientación entre 0° y 360°; apertura entre 1° y 170°; alcance entre 0,5 y 70 m; hasta 16 cámaras y 32 paredes. Son límites de la implementación, no una especificación universal de cámaras reales. resizeProject limita coordenadas al nuevo recinto y elimina paredes de longitud ≤ 0,01 m después del ajuste; no optimiza la distribución.

**11.4 Secuencia de cálculo.**

```text
1. Validar geometria y parametros de entrada.
2. Crear filas y columnas segun W, H y h.
3. Para cada celda: calcular dimensiones reales, area y centro.
4. Para cada camara: evaluar distancia, apertura y bloqueo al centro.
5. Guardar Mij y acumular areas globales y por camara.
6. Convertir areas a porcentajes usando S = W*H.
7. Dibujar sectores, matriz y resultados con esos datos.
```

Si hay F filas, J columnas, N cámaras y L paredes, una cota de trabajo del cálculo de cobertura es O(F*J*N*(L+1)); la matriz usa O(F*J) memoria, aparte del proyecto y los acumuladores. Reducir h a la mitad multiplica aproximadamente por cuatro el número de celdas en un recinto grande. Con 50 × 50 m y h = 0,25 m hay 40.000 celdas. No se ha medido aquí una garantía de fluidez para el máximo de objetos en todos los equipos.

**Qué no hace el motor:** no busca automáticamente posiciones óptimas, no minimiza cámaras ni costes, no aplica reconocimiento de imagen y no simula un sistema óptico 3D. Las fórmulas del sector y de la cuerda de esta guía son referencias explicativas; el motor de cobertura usa centros de celda y visibilidad.

**Qué sí permite defender:** cómo una función de visibilidad construye una matriz espacial, cómo ponderar celdas parciales, cómo evitar doble conteo y por qué mover una cámara o un obstáculo cambia las superficies.

<!-- pagebreak -->

### 12. Funciones del código: qué calculan y para qué

Los archivos indicados son rutas relativas a la raíz de la aplicación. La selección cubre el motor matemático y las operaciones geométricas auxiliares; guardar archivos, generar identificadores o abrir modales no añade una noción matemática al modelo.

| Archivo y funciones                                                 | Cálculo y uso                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| src/lib/geometry.js: radians, degrees                               | Conversión entre unidades angulares.                                                       |
| geometry.js: clamp                                                  | Proyección de un valor al intervalo permitido.                                             |
| geometry.js: normalizeAngle, angleDifference                        | Periodicidad y diferencia angular mínima.                                                  |
| geometry.js: directionVector                                        | Seno y coseno para obtener una dirección unitaria.                                         |
| geometry.js: fieldWidth                                             | Ancho teórico a distancia axial mediante tangente.                                         |
| geometry.js: cross, subtract                                        | Determinante 2D y resta vectorial; auxiliares internas.                                    |
| geometry.js: intersectionParameter                                  | Parámetro de cruce de dos segmentos; trata colinealidad.                                   |
| geometry.js: isBlocked                                              | Existencia de alguna pared en la línea de visión.                                          |
| geometry.js: inspectPoint                                           | Distancia, rumbo, separación angular y veredicto visible/no visible.                       |
| geometry.js: rayEndpoint                                            | Recorte de un rayo por alcance, rectángulo y primer obstáculo.                             |
| geometry.js: visibilityPolygon                                      | Muestreo angular para el sector visual recortado.                                          |
| src/lib/coverage.js: calculateCoverage                              | Centros, conteos M, áreas ponderadas y porcentajes.                                        |
| coverage.js: matrixPaths                                            | Unión visual de celdas contiguas por clase 0, 1 y 2+.                                      |
| src/lib/mathematics.js: cameraMath                                  | Vector, radianes, extremo teórico, eje visible y ancho axial para la explicación dinámica. |
| src/lib/viewport.js: createViewport, niceStep                       | Escala uniforme, encuadre interno, dimensiones de vista y marcas legibles.                 |
| viewport.js: coverageCellAt, visibleMatrixCells                     | Índices de celda y selección de etiquetas visibles, sin recalcular M.                      |
| viewport.js: viewTransform, transformViewPoint, uprightTransform    | Transformaciones afines, inversa y corrección de orientación de textos.                    |
| src/lib/project.js: resizeProject, validateProject                  | Límites físicos, longitudes de pared y dominio válido del modelo.                          |
| src/lib/frameSize.js: normalizeFrameSettings, calculateDrawingFrame | Saturación de escala manual y tamaño de presentación del editor.                           |
| src/lib/format.js: format                                           | Formato y redondeo visual de resultados.                                                   |
| src/components/Plan.jsx                                             | Conversión ratón-mundo, ajuste a malla, pan, zoom y pasos de edición.                      |
| src/components/Controls.jsx: NumberField                            | Lectura, límites y redondeo de entradas numéricas.                                         |
| src/components/Analysis.jsx: Distribution                           | Representación proporcional de áreas disjuntas.                                            |
| src/lib/export.js: exportMatrix, exportReport                       | Reutiliza datos y fórmulas en CSV/TXT; no calcula otra cobertura.                          |

<!-- pagebreak -->

### 13. Preguntas para la defensa y fuentes

**¿Por qué no se suman las áreas de todas las cámaras?** Porque una zona compartida aparecería varias veces. La unión se obtiene sumando una sola vez las áreas de las celdas con M ≥ 1.

**¿Por qué los porcentajes cambian al modificar la resolución?** Porque se evalúan otros centros y se clasifican celdas de distinto tamaño. Es una aproximación discreta de una región continua.

**¿La matriz se invierte o se multiplica?** No. M almacena conteos por posición. La inversa de la matriz afín de pantalla se usa para localizar el ratón, y el determinante 2D se usa para intersecciones; son operaciones distintas.

**¿El ancho por tangente determina el área vigilada?** No. Describe un corte perpendicular al eje a distancia axial d. La cobertura está limitada por distancia radial, apertura, recinto y paredes.

**¿Por qué el sector dibujado y una celda de la matriz pueden discrepar en un borde?** El sector es un polígono muestreado angularmente; la matriz clasifica el centro y asigna el área completa de la celda. Las dos representaciones tienen aproximaciones distintas.

**¿Más cámaras siempre mejoran el porcentaje?** Añadir una cámara no reduce la unión si todo lo demás queda fijo, pero podría no aumentarla. Mover una cámara existente puede mejorar o empeorar el resultado y su aporte exclusivo.

**¿Se está optimizando la distribución?** El usuario la evalúa y modifica manualmente. No hay búsqueda automática de una configuración óptima.

**¿Qué se ha comprobado?** Las 62 pruebas aprobadas incluyen ángulos, límites, colinealidad, bloqueo, cuadrícula, celdas parciales, consistencia de áreas, escenarios, transformaciones de vista y persistencia. También se ejecutaron ESLint y la compilación de producción. No se ha realizado una certificación de precisión física ni una medición exhaustiva de rendimiento.

**Fuentes primarias de esta guía:**

- [Motor geométrico](../src/lib/geometry.js): fórmulas de ángulos, visibilidad, segmentos y rayos.
- [Cobertura](../src/lib/coverage.js): construcción de matriz y métricas ponderadas.
- [Desarrollo por cámara](../src/lib/mathematics.js) y [pantalla Matemáticas](../src/components/Mathematics.jsx): relación entre parámetros, sustituciones y resultados.
- [Vista](../src/lib/viewport.js), [lienzo](../src/components/Plan.jsx) y [tamaño del marco](../src/lib/frameSize.js): transformaciones e interacción.
- [Proyecto y escenarios](../src/lib/project.js): contrato de datos y ejemplos reproducibles.
- [Análisis](../src/components/Analysis.jsx), [controles](../src/components/Controls.jsx), [formato](../src/lib/format.js) y [exportación](../src/lib/export.js): visualización y uso de los resultados.
- [Pruebas](../tests/) y [README](../README.md): comprobaciones y documentación técnica complementaria.

**Separación final de alcances:** las secciones matemáticas describen la versión revisada; las prioridades y los nombres son recomendaciones. La elaboración de esta guía no cambia el nombre ni el funcionamiento de la aplicación.
