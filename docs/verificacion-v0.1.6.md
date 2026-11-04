# Verificación v0.1.6

- Auditoría del código: sin llamadas a `window.alert`, `window.confirm`, `window.prompt`, ni bloqueo con `event.returnValue` al cerrar o recargar.
- Toasts propios para éxito, información, advertencia y error. Se muestran tanto fuera como dentro de los modales.
- Al intentar eliminar el proyecto que estaba abierto se mostró Proyecto en uso sobre la biblioteca; las dos entradas permanecieron intactas.
- Eliminar cámara desde el teclado abrió el modal propio con foco inicial en Cancelar. Cancelar mantuvo las tres cámaras; Escape mantuvo las dos paredes.
- Se añadió una cámara temporal y se comprobó que solo se eliminara tras confirmar; se recuperaron las tres cámaras originales y su cobertura.
- Se creó y eliminó un proyecto temporal a través de la confirmación propia. La biblioteca volvió a tener los dos proyectos originales. Cancelar otra eliminación devolvió a la biblioteca abierta.
- Un nombre vacío mostró error junto al campo, foco en el input y `aria-invalid=true`; el mensaje nativo de validación estaba vacío.
- La importación de `tests/fixtures/invalid-project.json` mostró el error de validación en un toast propio en español, sin cambiar el proyecto.
- Una recarga dentro del editor llegó al menú sin diálogo nativo y conservó el proyecto preguardado.
- Pantalla 390 × 800: documento de 375 px sin desbordamiento; toast de 351,2 px con márgenes de 12 px. Confirmación contenida en pantalla y cancelación accesible.
- La duración del toast se pausa al pasar el cursor o enfocarlo; el cierre manual usa un botón accesible.

Capturas: `v0.1.6-confirmacion.jpg`, `v0.1.6-validacion.jpg`, `v0.1.6-toast.jpg`, `v0.1.6-avisos.jpg`.
