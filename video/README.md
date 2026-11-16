# Preparación del video de CamVision

Hay un audio por cada bloque **Texto del expositor** del guion de una sola voz. El montaje se preparará a partir de esos audios, las diapositivas y los clips reales de la aplicación. Todavía no se ha generado un video ni se han fijado las transiciones o el reparto de visuales: faltan los materiales y las instrucciones finales del equipo.

## Materiales y orden

1. Copiar `proyecto.example.json` como `proyecto.json` en esta carpeta.
2. Indicar en cada sección el archivo de audio y sus imágenes o clips. Se admiten rutas relativas a este JSON y rutas absolutas; los nombres originales pueden conservarse.
3. Usar los diez bloques del guion como punto de partida. Una sección puede tener varios visuales, por ejemplo una diapositiva y una captura de uso real.
4. Esperar la indicación final sobre qué mostrar y cuándo antes de montar el video.

Los audios y visuales pueden guardarse en `video/material/`. Esa carpeta y `proyecto.json` no se suben al repositorio. No es necesario instalar dependencias de video para trabajar en la web.

## Comprobación previa

Desde la raíz del repositorio, con Python 3 disponible:

```powershell
python tools/video/prepare_video.py video/proyecto.json
```

Esto comprueba la configuración y enumera los archivos que faltan. No transforma ni reproduce los archivos.

Cuando estén descargados todos los audios, el siguiente comando puede crear un plan de tiempos basado en su duración real. Requiere `ffprobe` disponible en PATH o su ruta mediante `--ffprobe`:

```powershell
python tools/video/prepare_video.py video/proyecto.json --plan output/video/plan-tiempos.json
```

El plan avisa si los audios por sí solos superan 600 segundos. No añade aún pausas o transiciones: el video final debe reservarles margen y ensayarse por debajo de 10 minutos. No recorta ni acelera voces automáticamente. Para evitar sobrescrituras accidentales, el plan debe tener un nombre de archivo nuevo.

## Antes del montaje final

El equipo indicará el orden de diapositivas y clips, los momentos del audio a los que corresponden, si deben aparecer cámaras de los integrantes y las transiciones que desea. Con eso se podrá generar una secuencia por sección, unirlas y comprobar la sincronización. La exposición y los cinco minutos de defensa se mantienen separados.
