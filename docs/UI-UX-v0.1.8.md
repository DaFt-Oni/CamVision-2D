# CamVision · Cierre de revisión UI/UX

Fecha: 16/11/2026. Versión local: 0.1.8. La web pública se actualizará después de subir estos cambios a la rama conectada con Vercel. Este documento registra lo implementado; no certifica accesibilidad ni sustituye pruebas con usuarios y dispositivos físicos.

| Hallazgo                                          | Cambio y alcance                                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX01 · Dimensiones destructivas al escribir       | Los números se confirman con Enter o al salir. Escribir 20 ya no aplica primero 2 y recorta la geometría. Reducir deliberadamente el recinto sigue ajustando los objetos a sus límites. |
| UX02 · Nombre vacío invalida biblioteca           | Validación junto al campo; recuperación independiente de entradas sanas y reparación de nombres vacíos heredados.                                                                       |
| UX03 · Pestañas sobrescriben biblioteca           | Fusión por proyecto, Web Locks y detección de cambios incompatibles. Abrir versión externa o guardar copia. Sin Web Locks persiste una ventana de carrera entre escrituras simultáneas. |
| UX04 · Cámara matemática cambia al inspeccionar P | Selección de cámara independiente del punto inspeccionado.                                                                                                                              |
| UX05 · Inspector móvil lejano                     | Panel inferior desplegable desde el plano, con cierre y controles táctiles.                                                                                                             |
| UX06 · Cabecera ocupa demasiado                   | Modo compacto inicial e indicadores desplegables. Se conserva la escala visual manual y el encuadre vertical del usuario.                                                               |
| UX07 · Medición no se guarda                      | Estado de triangulación y punto incluidos en proyecto local, recuperación, JSON y deshacer/rehacer.                                                                                     |
| UX08 · Producción no coincide con revisión        | Versión y fecha visibles; paquete y lockfile 0.1.8. **Pendiente: publicación mediante git push y verificación del despliegue.**                                                         |
| UX09 · Sin deshacer/rehacer                       | Historial de 60 cambios, agrupación de arrastres y atajos que respetan los campos de texto.                                                                                             |
| UX10 · Guardado ambiguo                           | Diferenciación entre guardado explícito y recuperación, cambios pendientes, salida limpia directa y salida con guardar/descartar cuando corresponde.                                    |
| UX11 · Rueda atrapa página                        | Rueda normal desplaza; Ctrl/Cmd+rueda y pellizco controlan zoom.                                                                                                                        |
| UX12 · Corrección silenciosa de límites           | Mensajes de rango y formato junto al campo; Escape restablece.                                                                                                                          |
| UX13 · Texto pequeño y contraste                  | Ayudas y unidades más legibles, colores secundarios oscurecidos. Comprobación de muestras de texto HTML; no es auditoría WCAG completa.                                                 |
| UX14 · Objetivos táctiles pequeños                | Controles principales de al menos 44 px en vista táctil y mayor zona de selección de paredes.                                                                                           |
| UX15 · Uso por teclado incompleto                 | Diálogo para crear paredes por coordenadas, foco visible y Escape para cancelar herramientas.                                                                                           |
| UX16 · Desbordamiento a 320 px                    | Eliminado ancho mínimo global y ajustadas barras/paneles.                                                                                                                               |
| UX17 · Matemáticas largas sin orientación         | Índice fijo de secciones con cámara y punto actuales; cálculos completos conservados.                                                                                                   |
| UX18 · Superposición parece sumable               | Se explica que es parte de la superficie cubierta, no una tercera superficie excluyente.                                                                                                |
| UX19 · Inicio y lienzo vacío ambiguos             | Se distingue vista previa de último proyecto y se muestra acción para añadir la primera cámara.                                                                                         |
| UX20 · Sin historial de navegador                 | Inicio/simulador usan historial; salir con cambios mantiene el diálogo propio.                                                                                                          |
| UX21 · Cálculos bloquean edición                  | Worker de cobertura, indicador de actualización y solicitudes obsoletas ignoradas; cambios de metadatos no recalculan la matriz.                                                        |
| UX22 · Biblioteca difícil de reconocer            | Miniaturas, búsqueda, duplicación y estado de guardado/recuperación.                                                                                                                    |
| UX23 · Sin exportación visual                     | Descarga PNG o SVG del encuadre actual, con nombre, dimensiones y métricas.                                                                                                             |

## Comprobaciones

Se probaron edición de dimensiones sin pérdida, números inválidos, nombres vacíos, selección matemática estable, deshacer/rehacer, paredes por teclado, mediciones tras guardar y recargar, exportaciones PNG/SVG/JSON, salida limpia e historial, búsqueda/duplicación y edición entre pestañas con conflictos resueltos mediante copia.

Se revisó el diseño a 1920, 1440, 1366, 1024, 768, 390, 360 y 320 px. En 390, 320 y 768 px se probaron edición desde el inspector y pellizco con eventos táctiles emulados. Las pruebas se ejecutaron en contextos aislados de Edge; no se modificó el almacenamiento del perfil personal del usuario. Los recorridos terminaron sin errores de consola de la aplicación.

Las pruebas unitarias cubren recuperación, combinación de bibliotecas, conflictos, medición persistente, historial y claves de cálculo. Ejecutar `npm test`, `npm run lint` y `npm run build` antes de publicar. La salida de las pruebas y las capturas de trabajo se conservan en `tmp/ui-ux-fixes/`, que está excluida del repositorio.

La instantánea anterior a estas correcciones se conserva en `tmp/ui-ux-fixes/antes-de-la-revision.zip`. No contiene el montaje de video ni reemplaza una copia de seguridad externa.
