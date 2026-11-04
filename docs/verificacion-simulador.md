# Verificación del simulador integrado

## Corrección de la selección de cámaras

Se reprodujo el círculo negro y blanco al enfocar una cámara en el SVG. El grupo SVG conservaba un contorno automático del navegador (`outline-style: auto`), cuyo grosor se amplificaba con la transformación de metros a píxeles. Se reemplazó por un indicador dibujado en el plano, con trazo que no escala. Las cámaras y paredes siguen siendo accesibles mediante teclado.

Verificación en navegador:

| Comprobación                                                | Resultado observado            |
| ----------------------------------------------------------- | ------------------------------ |
| Contorno automático sobre una cámara seleccionada           | `outline-style: none`          |
| Indicador de foco al usar teclado                           | Visible y de tamaño controlado |
| Ancho de cada marcador a 1440 × 900, zoom del plano 100 %   | Aproximadamente 38 px          |
| Altura del plano antes y después de seleccionar cámaras     | 674 px en ambos casos          |
| Altura del inspector antes y después de seleccionar cámaras | 674 px en ambos casos          |
| Ancho del plano antes y después                             | Sin cambios                    |
| Flecha derecha en la cámara 03                              | X pasa de 8 a 8,25 m           |
| Flecha izquierda posterior                                  | X vuelve a 8 m                 |

## Simulador como espacio principal

- No existe sidebar de navegación en el espacio de trabajo.
- El inspector usa pestañas Espacio, Cámaras y Paredes, con desplazamiento interno.
- Se cambió el zoom del plano a 125 %, se recorrieron las tres herramientas y se volvió a Resumen: el `viewBox` del SVG se conservó exactamente.
- Al recuperar A desde Resumen, la cámara 03 volvió a 90° y el plano permaneció visible.

## Pantalla pequeña

Con una vista de 390 × 700 px (375 px de contenido útil por la barra de desplazamiento):

- El ancho del documento coincidió con el ancho útil: sin desbordamiento horizontal.
- El plano mantuvo 450 px de altura y el inspector 390 px al seleccionar otra cámara.
- El marcador seleccionado midió aproximadamente 21 px y no mostró el contorno gigante.
- Los controles del inspector permanecen accesibles mediante su desplazamiento interno.

## Comprobaciones del proyecto

La suite existente del motor geométrico, cobertura, validación, almacenamiento y exportaciones conserva 33 pruebas. La compilación, revisión estática y formato se comprueban con los comandos documentados en README.md.

Los valores de tamaño anteriores corresponden a las vistas y al escenario Oficina principal utilizados durante esta revisión. No son tamaños fijados a las cámaras ni resultados precargados de cobertura.
