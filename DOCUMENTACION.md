# Himnario Asamblea Cristiana — Documentación del Proyecto (v2)

**Asamblea Cristiana · 1° de Mayo 3623, Santa Fe, Argentina**
**Última actualización:** Junio 2026

---

## Qué es este proyecto

Aplicación web del himnario "Salmos, Himnos y Cánticos Espirituales" con los 400 himnos. En la versión 2 dejó de ser un archivo HTML único y pasó a ser un **proyecto estructurado publicable en GitHub Pages como PWA instalable**, pensado para compartir con la congregación mediante un enlace.

**Entregable:** carpeta del proyecto (`himnario_github.zip`) lista para subir a un repositorio de GitHub.

---

## Estado actual (v2)

### Datos
- ✅ 400 himnos extraídos, verificados uno por uno contra la numeración 1–400
- ✅ Correcciones del PDF aplicadas: 126 (numerado 136), 235 (numerado 236), formatos sin espacio, **y dos nuevas detectadas en v2**: himnos 49 y 54 con formato `N - TÍTULO` sin punto
- ✅ Himno 361 **completo** (la separación del 362 recuperó su verso 4 — la duda de la v1 quedó resuelta; la línea "y do el gozo es eterna" es un error tipográfico del PDF original, fiel a la fuente)
- ✅ Índice temático transcripto de las páginas 118–119 del PDF: 33 categorías que cubren los 400 himnos

### Funcionalidades
- ✅ Búsqueda por número, título y letra completa (con coincidencia resaltada y sin distinguir tildes)
- ✅ Índice temático navegable (pestaña "Temas")
- ✅ Favoritos (estrella en cada himno, pestaña propia)
- ✅ Historial de los últimos 10 himnos (pestaña "Recientes")
- ✅ Modo presentación: pantalla completa, estrofa por estrofa, navegable con flechas del teclado (para proyectar en el culto)
- ✅ Modo oscuro (botón ◐, recuerda la elección y respeta la preferencia del sistema)
- ✅ Control de tamaño de letra A− / A+ (persistente)
- ✅ Coros destacados visualmente
- ✅ Navegación anterior/siguiente entre himnos, enlaces directos con `#numero` (ej.: `…/himnario/#85`)
- ✅ PWA: instalable en el celular con ícono propio, funciona 100% sin internet (tipografías autoalojadas, service worker)
- ✅ Sección "Boletines" construida, a la espera de los PDFs

### Pendiente
- [ ] **Boletines**: cargar los PDFs en `boletines/` y listarlos en `datos/boletines.js` (la búsqueda en Drive no los encontró — posiblemente la cuenta conectada no es donde están)
- [ ] Publicar en GitHub Pages (instrucciones paso a paso en el `README.md` del proyecto)
- [ ] Acordes y referencias bíblicas por himno (tarea manual, idea de la v1 que sigue vigente)

---

## Estructura del proyecto

```
├── index.html              Página principal
├── css/estilos.css         Estilos (paleta bordó/dorado/crema, temas claro y oscuro)
├── js/app.js               Toda la lógica, comentada en español
├── datos/himnos.js         Los 400 himnos — editar acá las correcciones de letra
├── datos/temas.js          Índice temático
├── datos/boletines.js      Listado de boletines (vacío por ahora)
├── fuentes/                Playfair Display y Crimson Pro autoalojadas (112 KB)
├── iconos/                 Íconos de la PWA (estilo tapa de himnario)
├── boletines/              Carpeta para los PDFs de boletines
├── manifest.webmanifest    Configuración de instalación
├── sw.js                   Service worker — ¡subir VERSION en cada publicación!
└── herramientas/extraer.py Regenera himnos.js desde el PDF original
```

Formato de cada himno en `datos/himnos.js`:
```json
{ "n": 7, "t": "PADRE, A TUS PIES ME POSTRO", "l": "1. - Padre...", "f": "Padre, a tus pies me postro," }
```

---

## Decisiones técnicas de la v2

- **GitHub Pages + PWA** en lugar de archivo único: enlace compartible, instalable con ícono, actualizaciones automáticas para toda la congregación. El requisito offline se cumple con el service worker (estrategia "red primero con respaldo en caché").
- **Tipografías autoalojadas** (descargadas de los paquetes oficiales de Fontsource): se eliminó la única dependencia de internet que tenía la v1 (Google Fonts).
- **Datos en archivos `.js`** (no `.json`): funcionan tanto servidos por HTTPS como abriendo `index.html` directo desde el disco, sin problemas de CORS.
- **Sin frameworks ni dependencias**: HTML + CSS + JS puro, igual que la v1.

---

## Cómo retomar el proyecto con Claude

Adjuntar este archivo al inicio de la conversación y describir la mejora. Según la tarea, adjuntar también:
- **Corregir himnos o regenerar datos** → el PDF original `Himnario_Asamblea_Cristiana.pdf`
- **Modificar diseño o funcionalidades** → el zip del proyecto o los archivos puntuales (`js/app.js`, `css/estilos.css`)
- **Cargar boletines** → los PDFs de los boletines

Recordatorio clave para cualquier cambio publicado: **cambiar `VERSION` en `sw.js`**, si no los celulares siguen mostrando la versión vieja.
