# Verificación v0.1.5

- Un único marco reúne cabecera, herramientas, lienzo y Parámetros. En escritorio, lienzo y panel comparten borde superior e inferior, sin separación horizontal.
- Medición en 1440 px: el lienzo y Parámetros tenían la misma coordenada superior y altura de 765,31 px; el borde derecho del lienzo coincidía con el izquierdo del panel. Panel de 300 px.
- Al seleccionar Cámara 02 desde el SVG se mostraron sus valores. Cambiar orientación de 220° a 230° modificó el polígono de cobertura sin cambiar el viewBox. Se restauró después a 220°.
- Cambiar ancho de 16 a 18 m conservó el foco en el campo y actualizó el recinto; se restauró a 16 m. La edición no desmonta el inspector.
- Seleccionar una pared abre sus extremos en Parámetros; el selector de paredes evita desplazar el formulario por una lista larga.
- Los controles de ubicación, orientación, apertura y alcance aparecen antes de Nombre y opciones. Cambiar de objeto o pestaña vuelve al inicio del contenido del inspector.
- En 390 × 800, el panel continúa debajo del lienzo dentro del mismo marco. Ancho visible y desplazable del documento: 375 px; cambio de cámara y orientación disponibles en el panel.
- Se mantienen escala visual manual, zoom, desplazamiento, giro, volteo, matriz y tipografía compacta.
- Inspiración: disposición contigua de las vistas Álgebra y Gráfica descrita en el manual oficial de GeoGebra: https://geogebra.github.io/docs/manual/en/Algebra_View/.

Captura: `v0.1.5-editor-integrado.jpg`.
