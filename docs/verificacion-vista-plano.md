# Verificación de escala y vista Matriz sobre el plano

Esta revisión reemplaza el encuadre de altura fija y las matrices separadas de las versiones anteriores.

## Encuadre real

En una vista de escritorio de 1440 × 1000 px, con el escenario Oficina principal (16 × 12 m):

- El área de dibujo midió aproximadamente 1041 × 799 px.
- El recinto ocupó aproximadamente 959 × 719 px: un 92 % del ancho disponible.
- El modelo conserva una misma escala horizontal y vertical. No se estira el recinto para llenar el marco.
- Ejes: 12 px CSS. Radio del icono de cámara: 10 px CSS, independiente del zoom.
- El inspector sigue la altura del marco con desplazamiento interno. Seleccionar cámaras no modifica el tamaño del área de dibujo.

## Correspondencia de la matriz

- Resolución 0,25 m: 48 filas × 64 columnas, 3072 celdas.
- En la vista Matriz se dibujaron los 3072 valores sobre sus celdas reales del recinto.
- No existe una tabla o submatriz separada en Resumen o Matemáticas.
- Al seleccionar M[25, 32], el conteo mostrado fue 2, coincidente con el número dibujado en esa celda. Su centro físico es (7,875; 6,125) m; la tarjeta redondea las coordenadas a dos decimales.
- Cámaras y paredes permanecen sobre la misma matriz y el origen está en la esquina inferior izquierda.
- El acceso Ver matriz en el plano desde Matemáticas activa esta misma vista.

## Interacción y pantallas pequeñas

Se probó una vista de 390 px de ancho. El ancho del documento coincidió con el ancho útil: no hubo desbordamiento horizontal.

Se probó el desplazamiento del fondo con Seleccionar mediante arrastre y se verificó que el origen del viewBox cambió. Ajustar plano restableció el encuadre. El zoom permite entre 50 % y 400 %; los valores de las celdas solo se muestran cuando tienen espacio legible. Ocultar números por densidad no cambia la matriz, sus colores ni los porcentajes.

## Menú y comprobaciones

El menú contiene una entrada al simulador y, debajo, Archivos del proyecto y Escenarios de ejemplo. Se retiraron las tres tarjetas secundarias de herramientas; las funciones siguen disponibles dentro del simulador.

La suite incluye 43 pruebas: 33 previas y 10 nuevas sobre encuadre, proporciones, zoom, desplazamiento, centros de celdas, límites, celdas parciales y valores visibles. Los tamaños de esta nota son mediciones de la vista ensayada, no resultados precargados del simulador.
