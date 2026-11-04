# Revisión de fuentes y requisitos ABPro para CamVision

Revisión realizada el 3 de noviembre de 2026 sobre el Word original completado por el equipo.

## Resultado de la verificación bibliográfica

No había referencias a Wikipedia en el informe. OpenStax es un libro de texto, no una wiki. MDN es documentación técnica; Mozilla documentó que su antigua plataforma wiki fue reemplazada en 2020. Para evitar cualquier ambigüedad con la prohibición del profesor, sus dos referencias se sustituyeron por la especificación oficial de ECMAScript.

También se corrigió la diversidad de las fuentes: dos capítulos de un mismo libro no constituyen dos obras independientes, y dos páginas de MDN tampoco son dos proveedores distintos. La bibliografía revisada contiene cuatro fuentes externas diferentes, consultadas directamente, además de la documentación interna del proyecto.

| Fuente externa                                                                   | Tipo y procedencia                                                                  | Uso concreto en el informe                                                                                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Abramson, J. (2021). Algebra and Trigonometry 2e. OpenStax. Secciones 7.1 y 7.3. | Libro de texto publicado por OpenStax, parte de Rice University.                    | Grados y radianes, seno y coseno, circunferencia unitaria y dirección de la cámara.                                                                           |
| Ecma International. (2026). ECMA-262, 17.ª edición.                              | Norma oficial del lenguaje ECMAScript, publicada por el organismo de normalización. | Definición de Math.atan2 y Math.hypot empleadas en el código.                                                                                                 |
| MIT OpenCourseWare. (2010). Session 5 Area and Determinants in 2D.               | Material docente universitario del curso 18.02SC.                                   | Interpretación del determinante escalar 2D utilizado al resolver intersecciones; distinto de la matriz espacial M.                                            |
| Axis Communications. (2025, mayo). AXIS Q1659 Network Camera, Choose lens.       | Manual técnico publicado por el fabricante.                                         | Relación entre requisitos de vigilancia y campo visual; sustento técnico de la problemática. No implica que CamVision modele o haya probado este dispositivo. |

Enlaces verificados:

- [OpenStax 7.1 Angles](https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-1-angles).
- [OpenStax 7.3 Unit Circle](https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-3-unit-circle).
- [ECMAScript 2026, Math.atan2](https://262.ecma-international.org/17.0/#sec-math.atan2) y [Math.hypot](https://262.ecma-international.org/17.0/#sec-math.hypot).
- [MIT OpenCourseWare, vectores y matrices](https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/1.-vectors-and-matrices/), con acceso a la sesión 5 de áreas y determinantes 2D.
- [Manual de Axis Q1659](https://help.axis.com/en-us/axis-q1659), apartado Choose lens.
- [Información editorial de OpenStax](https://openstax.org/books/algebra-and-trigonometry-2e/pages/index), donde constan autor, editorial y fecha de publicación.
- [Explicación de Mozilla sobre el reemplazo de la plataforma wiki](https://hacks.mozilla.org/2020/10/mdn-web-docs-evolves-lowdown-on-the-upcoming-new-platform/), consultada para verificar la naturaleza de MDN; no se añadió como fundamento matemático del informe.

Las referencias al código, pruebas y formularios se mantienen como documentación del propio trabajo. No sustituyen las cuatro fuentes externas. No se utilizaron resultados resumidos por Google ni wikis como fundamento de las referencias nuevas.

## Qué aportan los dos PDF

**Indicaciones y Pautas de evaluación ABPro O2024** contiene las instrucciones de cada entrega y la rúbrica. Es el documento más relevante para revisar los requisitos. Sus páginas 2, 4 y 6 explican el orden de los contenidos, por eso el informe de ejemplo utiliza esa estructura.

**Presentación ABPro para estudiantes** explica el propósito del aprendizaje por proyectos, los roles del equipo y el trabajo por etapas. Repite los entregables principales y añade ejemplos visuales del impacto en la malla curricular. La diapositiva 6 es una imagen con los roles y no aparece en la extracción de texto del PDF; también fue revisada visualmente.

La estructura del Word está alineada con ese recorrido. No hace falta copiar el proyecto del estanque ni introducir cálculo diferencial por aparecer en el ejemplo: la pauta distingue las nociones según asignatura y admite otras nociones justificadas. CamVision debe explicar la relación entre su problema, trigonometría, vectores y matriz de cobertura.

## Requisitos que conviene atender

| Punto                                | Evidencia en los recursos                                                                               | Situación y acción para CamVision                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuentes admisibles                   | Pauta, págs. 4 y 5. Al menos cuatro fuentes; excluye wikis y respuestas de Google.                      | La revisión deja cuatro fuentes externas diferentes, con citas en las secciones II y VIII y referencias en XIII.                                                                                                                                                                                     |
| Preguntas que guíen la investigación | Pauta, págs. 2 y 10. Deben relacionarse con la especialidad y poder resolverse en el tiempo disponible. | Las cuatro preguntas actuales explican propósito y planificación. Conviene complementarlas con preguntas técnicas que puedan responderse mediante experimentos del simulador. Propuestas más abajo.                                                                                                  |
| Información contrastada              | Pauta, págs. 11 y 12. Se valora contrastar la información y obtener fuentes por otras vías.             | La cantidad de referencias no basta: explicar qué aporta cada una y cómo se relaciona con las preguntas. La redacción del nivel destacado incluye «cuatro fuentes por información»; conviene confirmar con el docente cómo aplica ese criterio.                                                      |
| Fuentes adicionales a las habituales | Pauta, pág. 12. Valora expertos, comunidad y empresas además de fuentes usuales.                        | Consultar un manual empresarial no equivale a realizar una entrevista o validación con una empresa. Si se solicita una consulta a un docente o experto, debe existir evidencia real, como señala la pág. 5. No se inventó ninguna consulta.                                                          |
| Bitácora                             | Pauta, pág. 5; rúbrica, pág. 11; presentación, diap. 15.                                                | Registrar al menos dos actividades por semana con fechas distintas. El criterio destacado pide además al menos seis acciones del grupo con fechas diferentes. Son dos condiciones que deben considerarse juntas. Las siete filas actuales pueden requerir ampliación según las semanas documentadas. |
| Roles y responsabilidades            | Presentación, diap. 6; rúbrica, pág. 11.                                                                | Los roles y aportes deben respaldarse con actividades reales. Puede servir para organizar la bitácora, sin convertir el cronograma propuesto en un historial ficticio.                                                                                                                               |
| Retroalimentación y revisión         | Pauta, pág. 6; rúbrica, pág. 12.                                                                        | Conservar evidencias de observaciones reales del profesor y explicar cómo se atendieron o por qué se decidió no incorporarlas. Los cambios de interfaz por sí solos no prueban retroalimentación docente.                                                                                            |
| Entrega audiovisual y producto       | Pauta, págs. 6 y 13; presentación, diap. 17.                                                            | Indican PPT o equivalente convertido a vídeo, de 10 a 15 minutos, con participación de todos, enlace al vídeo, producto y evaluaciones. El Word y la app son base y producto, pero no sustituyen el vídeo si sigue vigente esta modalidad.                                                           |
| Impacto en asignaturas TFL           | Pauta, pág. 6; presentación, diap. 17 y ejemplos de diap. 20 y 22.                                      | La sección XII actual explica el aporte de Funciones y Matrices. Los ejemplos relacionan matemáticas con otras asignaturas de la carrera. Falta confirmar qué asignaturas reales de la malla de Informática deben nombrarse y explicar su vínculo con CamVision.                                     |
| Portada de la presentación           | Pauta, pág. 2; presentación, diap. 11.                                                                  | La diapositiva 1 debe incluir carrera, además de proyecto, integrantes, profesor y asignatura. Revisarlo al preparar la presentación.                                                                                                                                                                |
| Tamaño del grupo                     | Pauta, págs. 2 y 9. Indica tres a cuatro integrantes.                                                   | El equipo actual tiene dos personas. Al tratarse de una pauta general de 2024, confirmar que la conformación actual esté autorizada; no modificar el equipo basándose únicamente en este PDF.                                                                                                        |
| Ponderación                          | Pauta, pág. 9; presentación, diap. 7.                                                                   | El 90 % corresponde a la rúbrica del proyecto y presentación; el 10 %, a autoevaluación y coevaluación. Verificar si el profesor conserva esta ponderación en 2026.                                                                                                                                  |

## Preguntas técnicas propuestas

Son sugerencias para complementar las preguntas existentes. No se reemplazaron en el Word durante esta verificación.

1. ¿Cómo cambia la superficie cubierta al modificar por separado la orientación, la apertura y el alcance, manteniendo fijo el recinto?
2. ¿Cómo influyen la posición y la longitud de las paredes en los puntos ciegos de una distribución de cámaras?
3. ¿Qué cambios de ubicación u orientación reducen los puntos ciegos manteniendo la misma cantidad de cámaras y los mismos obstáculos?
4. ¿Cómo afecta el tamaño de las celdas a la estimación de cobertura frente a un caso de área continua conocida?

La cuarta pregunta ya tiene un ejemplo reproducible en el informe: el cuarto de círculo y las resoluciones de 1, 0,5 y 0,25 m. Para las demás, conviene registrar condiciones iniciales, cambio aplicado y resultado, conservando archivos JSON y CSV como evidencia. No se necesita agregar otro módulo a la app para realizar esos experimentos.

## Cómo usar los recursos

El PDF de ejemplo sirve para entender el orden y el tipo de contenido. La pauta sirve para comprobar los requisitos y la evaluación; la presentación de ABPro ayuda a entender el proceso, los roles y el impacto curricular. Las indicaciones actuales del profesor deben resolver las diferencias entre estos recursos de 2024 y la entrega de 2026.

El guion breve de unos seis minutos propuesto anteriormente puede servir para ensayar la demostración del simulador. No debe confundirse con la duración de la entrega final: si se aplica esta pauta, el vídeo completo debe durar de diez a quince minutos e incluir las tres etapas, resultados y participación del equipo.

## Alcance de los cambios en el original

Se actualizaron ocho párrafos de fuentes: la contextualización técnica de la sección II, los tres párrafos de la sección VIII y las cuatro referencias externas de XIII. Se verificó que las once tablas, incluidos el cronograma y las evaluaciones completadas, permanecieran idénticas. La bitácora no fue completada ni modificada.

La copia de seguridad del usuario permanece intacta. El informe mantiene diecisiete páginas y los mismos números del índice. Las únicas diferencias visuales están en las páginas 3, 7 y 14, donde se actualizaron las fuentes. Las recomendaciones sobre preguntas, TFL, vídeo y requisitos por confirmar quedan en esta revisión, sin introducir hechos o asignaturas no confirmados en el informe.
