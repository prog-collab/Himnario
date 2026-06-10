# Himnario Asamblea Cristiana

Aplicación web del himnario **"Salmos, Himnos y Cánticos Espirituales"** (Efesios 5:19) de la Asamblea Cristiana, 1° de Mayo 3623, Santa Fe, Argentina. Contiene los 400 himnos con búsqueda, índice temático, favoritos, historial, modo oscuro y modo presentación. Funciona sin internet una vez instalada.

## Estructura del proyecto

```
├── index.html              Página principal
├── css/estilos.css         Estilos (temas claro y oscuro)
├── js/app.js               Lógica de la aplicación
├── datos/
│   ├── himnos.js           Los 400 himnos (generado desde el PDF)
│   ├── temas.js            Índice temático (transcripto del PDF, págs. 118-119)
│   └── boletines.js        Listado de boletines (editar a mano)
├── fuentes/                Tipografías autoalojadas (funciona offline)
├── iconos/                 Íconos de la app
├── boletines/              PDFs de los boletines (agregar acá)
├── manifest.webmanifest    Configuración de la app instalable
├── sw.js                   Service worker (modo offline y actualizaciones)
└── herramientas/extraer.py Script que genera himnos.js desde el PDF original
```

## Cómo publicar en GitHub Pages (una sola vez)

1. Crear una cuenta en [github.com](https://github.com) si no se tiene.
2. Crear un repositorio nuevo, por ejemplo `himnario`. Marcarlo como **público**.
3. Subir todos los archivos de esta carpeta (botón "uploading an existing file" o con git).
4. En el repositorio: **Settings → Pages → Source: Deploy from a branch → Branch: main → / (root) → Save**.
5. En uno o dos minutos la app queda disponible en `https://TU-USUARIO.github.io/himnario/`.

Ese enlace es el que se comparte con la congregación.

## Cómo instalarla en el celular

Abrir el enlace en el navegador del celular y:
- **Android (Chrome):** menú ⋮ → "Agregar a la pantalla principal" o "Instalar app".
- **iPhone (Safari):** botón Compartir → "Agregar a inicio".

Queda como un ícono más, abre a pantalla completa y funciona sin internet.

## Cómo actualizar la app

1. Editar los archivos que correspondan.
2. **Importante:** cambiar la línea `const VERSION = 'himnario-v1';` en `sw.js` (por ejemplo a `himnario-v2`). Esto hace que los celulares descarguen la versión nueva.
3. Subir los cambios al repositorio. Listo: todos reciben la actualización al abrir la app con internet.

## Cómo agregar un boletín

1. Copiar el PDF a la carpeta `boletines/` (nombre simple, sin espacios: `boletin-1985-03.pdf`).
2. Agregar una entrada en `datos/boletines.js`:

```js
const BOLETINES = [
  {
    titulo: "Boletín de marzo de 1985",
    fecha: "Marzo 1985",
    descripcion: "Aniversario de la congregación.",
    archivo: "boletines/boletin-1985-03.pdf"
  },
];
```

3. Agregar la ruta del PDF a la lista `ARCHIVOS` de `sw.js` si se quiere que esté disponible sin internet, y subir la versión en `VERSION`.

## Cómo corregir la letra de un himno

Los himnos están en `datos/himnos.js`, ordenados por número, con este formato:

```js
{"n":7,"t":"PADRE, A TUS PIES ME POSTRO","l":"1. - Padre...","f":"Padre, a tus pies me postro,"}
```

- `n` número · `t` título · `l` letra completa (los saltos de línea son `\n`) · `f` primera línea.
- Editar el texto en `l`, subir la versión del `sw.js` y publicar.

## Regenerar los himnos desde el PDF

Si hiciera falta volver a extraer todo desde `Himnario_Asamblea_Cristiana.pdf`:

```bash
pdftotext Himnario_Asamblea_Cristiana.pdf himnario.txt
python3 herramientas/extraer.py
```

El script ya incluye las correcciones conocidas del PDF (numeración del 126 y el 235, formatos sin espacio, y el himno 362 pegado al 361).
