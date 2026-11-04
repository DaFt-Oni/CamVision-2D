# CamVision

Nombre actual del proyecto. Los JSON de OptiVision y los guardados locales anteriores siguen siendo compatibles. Las exportaciones nuevas usan CamVision.

Simulador de cobertura geométrica de videovigilancia 2D. Proyecto académico de **Funciones y Matrices · Ingeniería en Informática · INACAP**.

La aplicación funciona en el navegador, sin cuentas, backend, fuentes remotas ni servicios externos. Utiliza React, Vite, JavaScript, CSS y SVG. Las métricas se recalculan a partir de las cámaras y paredes actuales; los escenarios contienen parámetros de entrada, nunca resultados prefijados.

## Instalación y ejecución

Requisito: **Node.js 22.12+ o 24 LTS**, con npm. Desde la carpeta del proyecto React:

```powershell
cd D:\Proyectos\Estudios\OptiVision\OptiVision
npm ci
npm run dev
```

Abre la dirección `Local` que indique Vite, normalmente `http://localhost:5173`. La instalación inicial necesita acceso al registro npm; una vez instaladas las dependencias, el uso local no requiere Internet. Si el puerto está ocupado, Vite muestra otro disponible.

```powershell
npm test         # Pruebas del motor, validación y persistencia
npm run lint     # Revisión estática
npm run build    # Genera dist/
npm run preview  # Sirve la versión compilada, normalmente en el puerto 4173
```

`dist/` se sirve con un servidor HTTP estático; no se abre directamente mediante `file://`. Para detener un servidor iniciado desde la terminal, usa Ctrl+C.

## Versiones y vuelta al diseño anterior

La copia de referencia **v0.1.0** está en `../versiones/OptiVision-v0.1.0.zip`, junto a `RESTAURAR-v0.1.0.md`. Se creó y verificó antes de modificar el control de tamaño. Contiene fuentes, lockfile, pruebas, documentación y la compilación existente; omite node_modules. El manifiesto del ZIP permite comprobar los archivos por SHA-256.

Esta revisión de trabajo es **v0.1.6**. Para comparar ambas sin reemplazar archivos, extrae la copia en otra carpeta, ejecuta npm ci y sirve la referencia con `npm run dev -- --port 5174`. El proyecto actual conserva su carpeta y su puerto habituales.

### Tamaño del cuadro

En **Parámetros → Espacio → Escala visual del cuadro** puedes escoger manualmente entre 60 % y 100 %. El área de dibujo tiene un formato vertical y comparte marco con el inspector. No hay ajuste automático a la altura de pantalla ni desplazamiento automático al abrir el editor. En escritorio la escala modifica ancho y alto proporcionalmente; en móvil se conserva el ancho disponible para los controles y se modifica la altura.

La escala se guarda en este navegador y solo cambia la presentación. Los metros del recinto, las cámaras, la matriz y los porcentajes conservan sus valores. **Restablecer escala · 100 %** devuelve el marco vertical a su tamaño base; la copia v0.1.0 conserva el diseño anterior completo.

La barra de navegación está separada de las herramientas de edición y de las vistas Cobertura/Matriz/Puntos ciegos. **Seleccionar** permite elegir objetos o arrastrar el fondo para desplazar la vista; la rueda acerca o aleja alrededor del puntero y también puedes usar + y −. Los botones de giro cambian la orientación en pasos de 90°, y los de volteo reflejan horizontal o verticalmente. **Ajustar plano** centra el recinto manteniendo su orientación; **Restablecer vista** recupera posición, zoom y orientación originales. Las etiquetas permanecen legibles y las coordenadas de selección siguen perteneciendo al recinto original.

## Navegación y espacio de trabajo

La aplicación abre en un **menú principal tipo Metro**. La entrada al Simulador abre un modal para crear un escenario en blanco, cargar proyectos locales o elegir un ejemplo. Debajo están Archivos del proyecto (configuraciones e importación) y Escenarios de ejemplo. Análisis y Matemáticas se consultan dentro del simulador, sin tarjetas secundarias en el menú.

El espacio de trabajo no tiene barra lateral de navegación. La cabecera reúne el regreso al menú y el nombre del proyecto. Los indicadores son compactos y el marco del plano adapta su altura a las proporciones del recinto, sin reducirlo a una franja horizontal. La selección de objetos no cambia sus dimensiones. El plano y Parámetros comparten un único marco, con herramientas comunes. En escritorio, el panel queda pegado al lienzo y ambos comienzan a la misma altura. El inspector tiene pestañas **Espacio**, **Cámaras** y **Paredes**, con desplazamiento interno: seleccionar un objeto no agranda el plano ni el inspector. Al seleccionar en el plano se muestran los parámetros del objeto y se vuelve al inicio del panel.

Debajo del plano están las pestañas **Resumen**, **Análisis** y **Matemáticas**. El plano permanece montado al cambiar de herramienta, conservando su vista y zoom. Resumen combina distribución de superficies, lectura del análisis y cálculos de la cámara elegida. La matriz se muestra exclusivamente mediante **Vista Matriz** sobre el mismo recinto: misma escala, paredes, cámaras y coordenadas. No se recorta ni se representa una submatriz aislada.

En pantallas pequeñas el inspector se ubica debajo del plano. **Proyectos locales**, **Guardar** y **Exportar** permanecen accesibles desde la cabecera del simulador; **Escenarios** se encuentra junto a las pestañas de resultados. Volver al menú no pierde la configuración actual.

La selección y el foco de teclado de las cámaras se dibujan dentro del SVG con tamaños controlados; se desactiva el contorno automático del navegador en los grupos transformados, que podía aparecer como un círculo de tamaño excesivo.

## Una demostración de cinco minutos

1. En **Simulador → Escenarios**, carga **Demostración académica**: espacio 10 × 8 m y cámara en (0, 0), orientación 45°, apertura 90° y alcance 6 m.
2. Observa el cuarto de círculo. El área continua de referencia es π·6²/4 ≈ 28,274 m² (35,343 % del espacio). La matriz ofrece una aproximación, no ese valor precargado.
3. Selecciona **Matemáticas** debajo del plano para revisar conversión a radianes, vector unitario, extremo de alcance y ancho trigonométrico. Activa **Vista Matriz** en la barra del plano para ver las celdas sobre el recinto.
4. En el mismo plano, añade otra cámara con el botón de Parámetros o con la herramienta Cámara. Prueba (10, 8), orientación 225°, apertura 90° y alcance 6 m. Observa los resultados inmediatos.
5. Añade una pared con dos clics y cambia la vista del plano a **Matriz** o **Puntos ciegos** para ver la sombra.
6. En Matemáticas, elige la cámara con el selector destacado. Cada paso muestra fórmula, sustitución, resultado e interpretación. El extremo teórico se distingue del eje visible recortado por paredes y bordes.
7. Introduce un punto X/Y y comprueba alcance, apertura y línea de visión. La conclusión exige que se cumplan las tres condiciones.
8. Usa **Exportar → Informe de resultados** para descargar parámetros, métricas, fórmulas y limitaciones.

También se incluyen escenarios de oficina, bodega y espacio vacío. Los archivos de `examples/` se pueden importar desde el menú Exportar.

## Uso del editor

- **Escala**: cada unidad cartesiana representa un metro. Los cuadrados grandes de la cuadrícula miden 1 × 1 m, independientemente de la resolución de cálculo. El SVG conserva las proporciones entre X e Y.
- **Coordenadas**: origen inferior izquierdo, X hacia la derecha, Y hacia arriba. 0° apunta al este, 90° al norte, 180° al oeste y 270° al sur.
- **Cámaras**: selecciona un dispositivo en la lista o el plano. Arrastra para moverlo (pasos de 0,05 m), usa campos numéricos o sliders para configurar orientación, apertura y alcance.
- **Teclado**: enfoca una cámara con Tab; Enter la selecciona y las flechas la desplazan 0,25 m. Supr/Retroceso elimina el objeto enfocado en el plano. Esc cancela el dibujo de pared después de enfocar el plano.
- **Paredes**: elige Pared y haz clic en ambos extremos. Selecciónalas para editar sus coordenadas o eliminarlas. Son segmentos sin espesor; también representan divisiones u obstáculos lineales.
- **Punto de prueba**: haz clic en el espacio con Seleccionar; revisa en Matemáticas la distancia, dirección, diferencia angular y bloqueo. También puedes seleccionar el centro de cualquier celda desde la matriz.
- **Límites**: espacios de 2–50 m por lado, hasta 16 cámaras y 32 paredes, alcance de 0,5–70 m y apertura de 1–170°. Los campos aceptan coma o punto decimal. Se aplican valores numéricos válidos al escribir y se corrigen límites al salir del campo.
- **Cambio de dimensiones**: las cámaras se ajustan al nuevo rectángulo. Los extremos de las paredes se ajustan y los segmentos que quedan sin longitud se eliminan.
- **Zoom y encuadre**: + y − permiten entre 50 % y 400 %. Seleccionar permite arrastrar el fondo para desplazar el encuadre sin mover cámaras; Ajustar plano vuelve a mostrar el recinto completo. X e Y conservan la misma escala. Los ejes tienen tipografía de 12 px y los iconos mantienen su tamaño al ampliar. La regla de metros se calcula a partir de la escala real de pantalla.
- **Vista Matriz**: cambia entre Cobertura, Matriz y Puntos ciegos desde la barra del plano. Matriz representa las mismas celdas usadas por el cálculo, con filas creciendo desde abajo. Acerca para leer los conteos y selecciona una celda para consultar su valor.

## Modelo matemático

### Trigonometría y vectores

Para una cámara C=(x₀,y₀), orientación θ, apertura α y alcance d:

```text
θ_rad = θ_grados · π / 180
u = (cos θ, sen θ)                     vector unitario, ||u|| = 1
P = C + d·u                           extremo teórico del eje
A = 2·d·tan(α/2)                      ancho a distancia AXIAL d
r = sqrt((x-x₀)² + (y-y₀)²)            distancia a un punto
β = atan2(y-y₀, x-x₀)                 dirección del punto
Δ = diferencia angular mínima(β, θ)    normalizada entre -180° y 180°
```

Un punto se considera visible si `r ≤ d`, `|Δ| ≤ α/2` y ninguna pared intersecta el segmento cámara–punto. Los límites de alcance y apertura están incluidos. La comprobación utiliza una tolerancia numérica de 10⁻⁸.

**Interpretación del ancho A**: corresponde a un plano perpendicular al eje a distancia axial d. No es la cuerda del sector circular de radio d. El campo visible utiliza distancia radial, por lo que el ancho teórico y el extremo del eje se muestran como desarrollos matemáticos, no como área visible garantizada.

### Obstáculos

El motor utiliza productos cruzados para resolver la intersección de dos segmentos:

```text
C + t(P-C) = A + u(B-A)
```

Hay bloqueo con `0 < t ≤ 1` y `0 ≤ u ≤ 1`. Se contemplan segmentos paralelos, superposición colineal y contacto con extremos. Una pared que solo toca el origen de la cámara no bloquea, lo que permite situarla sobre paredes. Los segmentos no tienen espesor y no se descuentan del área del espacio.

### Matriz y superficie

El espacio se divide en `ceil(largo/resolución)` filas y `ceil(ancho/resolución)` columnas. Cada celda almacena cuántas cámaras pueden ver su centro:

- **0**: punto ciego.
- **1**: cobertura única.
- **≥2**: superposición.

```text
S = ancho · largo
a_ij = ancho_real_celda · alto_real_celda
S_cubierta = Σ a_ij · [M_ij ≥ 1]
S_superpuesta = Σ a_ij · [M_ij ≥ 2]
S_ciega = S - S_cubierta
Cobertura (%) = 100 · S_cubierta / S
```

Las celdas parciales del borde usan su superficie real. Con celdas completas de igual tamaño, la fórmula equivale al cociente entre cantidad de celdas cubiertas y cantidad total. La superposición es un subconjunto de la cobertura total; nunca se suma dos veces una zona en la unión.

Las resoluciones disponibles son 0,25, 0,50 y 1 m, con un máximo de 40.000 celdas. Los porcentajes son aproximaciones por puntos medios y pueden variar al cambiar de resolución. El contorno gráfico se calcula por rayos cada grado y rayos adicionales alrededor de extremos de paredes. Las métricas proceden de la matriz, no del área del polígono SVG.

La vista Matriz dibuja todas las celdas sobre el recinto, incluyendo sus dimensiones parciales en los bordes. Sus números aparecen cuando cada celda tiene espacio suficiente en pantalla; con más zoom se leen más valores sin cambiar la resolución ni los datos. Seleccionar una celda muestra fila, columna, centro físico y conteo. El CSV contiene todas las celdas. La primera fila interna/CSV corresponde al borde inferior (Y creciente).

## Parámetros y lectura de cálculos

El inspector ofrece campos compactos de 36 px y controles de teclado, etiquetas completas y selector de cámara visible durante el desplazamiento. Posición, orientación, apertura y alcance se muestran primero. **Nombre y opciones** reúne el nombre y la eliminación. Las paredes se eligen con un selector para mantener accesibles sus extremos, incluso cuando hay muchas. Las pestañas admiten flechas, Inicio/Fin y Tab; los campos numéricos aceptan coma o punto y las flechas ajustan el valor según su paso.

Matemáticas identifica en el título la cámara activa y mantiene un selector destacado. El desarrollo distingue los parámetros de entrada, la conversión a radianes, el vector unitario, el extremo teórico y el ancho a distancia axial. El eje visible se obtiene con el mismo recorte geométrico que el plano. La prueba de puntos y la integración de superficies muestran las sustituciones y sus resultados dinámicos. Los porcentajes finales pertenecen a todas las cámaras del recinto.

## Inicio y salida de proyectos

El modal **Abrir simulador** permite crear un escenario en blanco, cargar guardados o borradores y abrir un ejemplo. Cada nuevo proyecto recibe una identidad independiente y un nombre por defecto con fecha y hora. Los proyectos locales conservan su identidad al reabrirse; guardar de nuevo actualiza la entrada existente.

Al volver al menú o cambiar de proyecto desde el editor aparece **Guardar antes de salir**. Permite confirmar nombre, icono y color, o seguir editando. Guardar solo abandona el editor cuando el almacenamiento local tuvo éxito.

Cada edición se preguarda con sus parámetros actuales; antes del primer guardado explícito aparece como **Borrador automático**. Se escribe también al ocultarse la página y en `pagehide` cuando el navegador dispara esos eventos. Cerrar o recargar la pestaña no muestra confirmaciones nativas: se conserva el preguardado y una escritura de salida sin bloquear la navegación. El navegador no permite un modal personalizado al cerrar la pestaña. Un cierre forzado puede omitir los eventos de salida, por eso la recuperación depende del último preguardado completado, no de un guardado al cerrar.

## Avisos y confirmaciones

Los mensajes de éxito, información, advertencia y error usan toasts propios con cierre manual y pausa al pasar el cursor o enfocarlos con el teclado. Se muestran también sobre los modales abiertos. Los errores del nombre del proyecto aparecen junto al campo, sin la validación emergente del navegador.

Eliminar una cámara, pared o proyecto local requiere una confirmación propia. Cancelar, Escape y cerrar el modal no eliminan datos. El proyecto que está abierto se protege de la eliminación en la biblioteca; primero hay que volver al menú. Guardado, importación, exportación y fallos de almacenamiento comparten el mismo sistema de mensajes. No se usan `window.alert`, `window.confirm` ni `window.prompt`.

## Guardado e intercambio

- **Guardado automático**: conserva el proyecto en `localStorage` tras cada edición confirmada.
- **Guardar**: abre un formulario para definir nombre, icono y color, y actualiza una entrada por proyecto en Proyectos locales. Se pueden recuperar y eliminar individualmente desde la biblioteca.
- **JSON**: exporta el proyecto; permite reabrirlo en otro navegador. La importación valida todo antes de modificar el espacio de trabajo; admite archivos de hasta 2 MB, versión 1.
- **TXT**: informe con espacio, cámaras, paredes, resultados, fórmulas y limitaciones.
- **CSV**: fila, columna, coordenadas del centro, área y conteo de cámaras para cada celda.

El almacenamiento es exclusivo de este navegador y origen (incluyendo puerto). Borrar sus datos elimina las copias locales; exporta JSON para conservar archivos independientes. Si el navegador bloquea el almacenamiento o se agota la cuota, la interfaz lo informa y permite seguir exportando.

## Organización del código

```text
src/
  App.jsx                    Estado, navegación, guardado e importación
  App.css                    Estilos del menú, análisis y diálogos
  Workbench.css              Simulador compacto, inspector y foco SVG
  Editor.css                 Marco común, lienzo y parámetros alineados
  index.css                  Estilos base
  components/
    Home.jsx                 Menú Metro con el simulador como acción principal
    ProjectManager.jsx       Apertura, biblioteca, nombre, icono y color
    SimulatorOverview.jsx    Resumen de análisis y cálculos
    Plan.jsx                 SVG, encuadre, dibujo y vista matriz del recinto
    Parameters.jsx           Dimensiones, cámaras y paredes
    Analysis.jsx             Indicadores, distribución y aporte individual
    Mathematics.jsx          Desarrollo de fórmulas, prueba de puntos y matriz
    Feedback.jsx             Toasts y confirmación de eliminación
    Controls.jsx             Controles reutilizables
    Icon.jsx                 Iconos SVG locales
  hooks/
    useElementSize.js        Medición del área de dibujo
    useDrawingFrame.js       Tamaño manual del cuadro vertical
    useProjectWorkspace.js   Preguardado y eventos de salida
    useToast.js              Estado y variantes de avisos propios
  lib/
    geometry.js              Trigonometría, vectores e intersecciones
    viewport.js              Escala física, encuadre y celdas visibles
    frameSize.js             Tamaño visual manual y preferencias
    coverage.js              Matriz y superficies
    project.js               Escenarios, límites, validación y ajuste del espacio
    workspace.js             Identidad, borradores y guardado por proyecto
    storage.js               Persistencia versionada
    export.js                JSON, CSV e informe TXT
    format.js                Formato numérico en español de Chile
examples/                    Escenarios JSON importables
tests/                       Pruebas con node:test, sin servicio externo
```

Las funciones geométricas y de cobertura son puras y no dependen de React, DOM o almacenamiento. Esto permite probarlas, reutilizarlas o sustituir la interfaz sin alterar el modelo.

## Alcance académico

Modelo geométrico 2D sin altura, iluminación, obstáculos volumétricos, sensores, resolución de video ni reconocimiento de personas. No garantiza seguridad ni sustituye un diseño profesional. El propósito es demostrar cómo trigonometría, vectores y matrices producen resultados reproducibles al editar una distribución.
