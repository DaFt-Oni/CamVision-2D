# Verificación v0.1.4

- Escala tipográfica: títulos matemáticos de 18 px, fórmulas de 13 px y resultados de 16 px; inspector con campos de 36 px. Se mantienen etiquetas explícitas y navegación con teclado.
- Las pestañas de resultados tienen `overflow: visible` y foco interior. En escritorio su altura visible y desplazable fue 46 px; en móvil, 63 px en las tres pestañas. Sin desbordamiento vertical.
- Inicio: la entrada al simulador abre un modal con escenario en blanco, guardados locales y ejemplos. Comprobado en 1440 × 1000 y 390 × 800.
- Se creó un recinto en blanco, se modificó a 14 × 8 m y se canceló la salida. La edición se conservó.
- Al volver al menú se guardó como Plano de laboratorio, con icono Cámara y color verde. Una recarga recuperó nombre, icono, color y dimensiones en los locales.
- Se editó una cámara a X = 1,5 m sin finalizar el proyecto. Una apertura independiente mostró Borrador automático y recuperó X = 1,5 m desde los locales. Se restauró después el escenario original.
- Reabrir y guardar mantuvo dos entradas para los dos proyectos, sin crear copias por preguardado.
- Una pestaña en el menú recibió el cambio de nombre desde otra sesión y no escribió una copia antigua al cerrarse. Las sesiones activas conservan sus propios cambios.
- El formulario de salida y el modal de inicio caben en móvil sin ensanchar el documento: ancho visible y desplazable de 375 px.
- El aviso de salida de la pestaña usa el mecanismo nativo del navegador. No admite un formulario personalizado; el preguardado se realiza antes, tras cada edición, y no depende de que un cierre forzado dispare eventos.
- La copia v0.1.0 conserva su SHA-256 original: `607c7cca8aa536b5981ae40a46bde669ddf2792504c568e68295f2b7ee34b9cd`.

Capturas: `v0.1.4-inicio.jpg`, `v0.1.4-guardar.jpg`, `v0.1.4-estilo-compacto.jpg`.
