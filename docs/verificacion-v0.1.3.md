# Verificación v0.1.3

- `npm test`: 53 pruebas del motor geométrico, vistas, cálculo educativo, persistencia y exportaciones.
- `npm run lint`, `npm run build` y `npm run format:check`.
- Escritorio 1440 × 1000: campos del inspector de 44 px, selector persistente al desplazar el contenido y navegación con flechas entre las pestañas.
- Con Seleccionar activo, un arrastre del fondo cambió el viewBox conservando las coordenadas de las tres cámaras. Un clic posterior en Matriz mostró la celda y sus coordenadas; las flechas sobre una cámara modificaron su posición y permitieron recuperarla.
- Solo permanecen Resumen, Análisis y Matemáticas. Resumen combina distribución de superficies, lectura del análisis y cálculos de la cámara elegida.
- Al cambiar el selector de Matemáticas a Cámara 03 se actualizan título, orientación de 90°, conversión de 1,57080 rad y vector (0; 1).
- El desarrollo educativo diferencia el extremo teórico del eje y su recorte visible. Las pruebas cubren bloqueo por paredes y límites del recinto.
- Pantalla de 390 × 800: ancho del documento igual al ancho visible, selector contenido y pasos de cálculo en una sola columna.
- Escenario vacío: selector deshabilitado, instrucciones para añadir cámara y superficies de 0 % cubierto / 100 % sin cobertura, sin cálculos indefinidos.
- Consola del navegador sin errores en la revisión.
- La copia v0.1.0 conserva su SHA-256: `607c7cca8aa536b5981ae40a46bde669ddf2792504c568e68295f2b7ee34b9cd`.

Capturas: `v0.1.3-parametros.jpg`, `v0.1.3-resumen.jpg` y `v0.1.3-matematicas.jpg`.
