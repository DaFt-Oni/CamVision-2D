# Cambios

## v0.1.7 — Triangulación entre dos cámaras

- Medición junto al plano a partir de dos cámaras y un punto común, incluidos extremos de paredes.
- Reconstrucción de P con base AB y ángulos interiores mediante la ley de senos, con selección de la solución reflejada.
- Comprobación de la base con la ley de cosenos, distancias y ángulos dinámicos en Matemáticas.
- Validación de triángulos degenerados, sensibilidad de ángulos pequeños y comprobación separada de visibilidad.
- Ejemplo 6–5–5 e inclusión de la medición activa en el informe TXT.

## v0.1.6 — Avisos propios

- Toasts propios con variantes de éxito, información, advertencia y error, visibles también dentro de los modales.
- Cierre manual y pausa de duración al leer con cursor o teclado.
- Confirmaciones propias para eliminar cámaras, paredes y proyectos locales; Cancelar recibe el foco inicial.
- Validación de nombre junto al campo, sin globos nativos del navegador.
- Se elimina el aviso nativo de cierre/recarga y se conserva el preguardado del proyecto.
- Mensajes de error en español para lectura e importación de archivos.

## v0.1.5 — Editor integrado

- Plano y Parámetros comparten marco y barra de herramientas; lienzo y panel alineados arriba y abajo, sin hueco entre ambos en escritorio.
- Herramientas más compactas para dar prioridad al espacio de edición.
- Posición, orientación, apertura y alcance por delante de Nombre y opciones.
- Selección de cámaras y paredes vinculada al inspector; cambiar de objeto vuelve al inicio de sus controles.
- La edición de dimensiones conserva el foco, el zoom y la orientación de la vista.
- Escala visual manual y proporciones físicas conservadas; en móvil, Parámetros continúa debajo del lienzo dentro del mismo marco.

## v0.1.4 — Presentación compacta y ciclo de proyectos

- Tipografía y espaciados más sobrios en Parámetros y Matemáticas; se mantiene el desarrollo paso a paso.
- Corrección del desbordamiento vertical del foco en las pestañas de resultados.
- Modal de apertura: escenario en blanco, proyectos locales, borradores y ejemplos.
- Nombre, icono y color al guardar o salir; una entrada por proyecto, sin duplicados por preguardado.
- Guardado de cada edición y recuperación de borradores con nombre por defecto; aviso nativo al intentar cerrar el editor.
- Compatibilidad con proyectos anteriores y validación de metadatos.

## v0.1.3 — Parámetros y desarrollo matemático

- Inspector más legible, campos amplios, selector de cámara persistente y navegación por teclado.
- Seleccionar también desplaza la vista al arrastrar el fondo.
- Resumen integra lectura de análisis y cálculos actuales de la cámara elegida.
- Matemáticas identifica la cámara y ordena fórmula, sustitución, resultado e interpretación.
- Prueba de puntos con condiciones de alcance, apertura y paredes; distinción entre eje teórico y visible.
- Navegación, guardado, exportaciones y ejemplos centrados en el proyecto actual.

## v0.1.2 — Cuadro vertical y navegación

- Se elimina Modo de tamaño: la escala visual manual permanece siempre disponible.
- Marco vertical con separación entre edición, capas, navegación y Parámetros.
- Desplazamiento, zoom con rueda y botones, giros de 90° y volteos horizontal/vertical.
- Restablecer vista recupera posición, zoom y orientación; Ajustar plano conserva la orientación elegida.
- Las coordenadas, los conteos de matriz y los cálculos de cobertura permanecen independientes de la vista.
- La copia de referencia v0.1.0 se conserva intacta.

## v0.1.1 — Tamaño visual del cuadro

- Nuevo control en Parámetros → Espacio: ajuste automático a pantalla o escala manual.
- La escala manual inicial es 95 %: una reducción de solo el 5 % respecto del cuadro anterior.
- El modo automático conserva el cuadro grande y lo centra; limita su altura contando herramientas, cabecera y leyenda para que se vea completo.
- Acceso Tamaño anterior · 100 % para recuperar la presentación previa inmediatamente.
- Preferencias visuales guardadas en el navegador, separadas de los cálculos de cobertura.
- Siete pruebas nuevas de proporciones, ajuste, restauración al 100 %, límites y adaptación móvil.

## v0.1.0 — Copia de referencia aprobada

Archivo: `../versiones/OptiVision-v0.1.0.zip`.

Copia exacta previa a los cambios de tamaño, con 53 archivos originales verificados por SHA-256 y un manifiesto dentro del ZIP. Incluye la matriz sobre el plano, escala física legible, desplazamiento y el menú simplificado.

Las instrucciones para ejecutarla en otra carpeta y puerto están en `../versiones/RESTAURAR-v0.1.0.md`.
