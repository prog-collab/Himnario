/* ════════════════════════════════════════════════════════════
   Himnario Asamblea Cristiana — lógica de la aplicación
   Sin dependencias externas. Los datos vienen de:
     datos/himnos.js   -> HIMNOS  [{n, t, l, f}]
     datos/temas.js    -> TEMAS   [{nombre, himnos:[n...]}]
     datos/boletines.js-> BOLETINES (opcional)
   ════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ── Utilidades ── */
const $ = sel => document.querySelector(sel);
const POR_NUMERO = new Map(HIMNOS.map(h => [h.n, h]));

// Normaliza para búsqueda: minúsculas y sin tildes
const normalizar = s => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Índice de búsqueda precalculado (una sola vez)
const INDICE = HIMNOS.map(h => ({
  h,
  titulo: normalizar(h.t),
  letra: normalizar(h.l),
}));

/* ── Persistencia (favoritos, historial, preferencias) ── */
const guardar = (clave, valor) => { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {} };
const leer = (clave, defecto) => {
  try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : defecto; }
  catch (e) { return defecto; }
};
let favoritos = leer('favoritos', []);
let recientes = leer('recientes', []);
let tamLetra = leer('tamLetra', 1.18);

/* ── Modo claro / oscuro ── */
const temaGuardado = leer('tema', null);
const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
let temaActual = temaGuardado || (prefiereOscuro ? 'oscuro' : 'claro');
aplicarTema();
function aplicarTema() {
  document.documentElement.dataset.tema = temaActual;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = temaActual === 'oscuro' ? '#2b0d13' : '#4a141e';
}
$('#btn-tema').addEventListener('click', () => {
  temaActual = temaActual === 'oscuro' ? 'claro' : 'oscuro';
  guardar('tema', temaActual);
  aplicarTema();
});

/* ── Estado de navegación ── */
let vistaActual = 'todos';   // pestaña activa
let himnoAbierto = null;     // himno en pantalla, o null si estamos en lista

/* ════════════ LISTADOS ════════════ */
const contenido = $('#contenido');

function tarjetaHimno(h, extra) {
  const esFav = favoritos.includes(h.n);
  return `<button class="resultado" data-n="${h.n}">
    <span class="resultado-numero">${h.n}</span>
    <span class="resultado-textos">
      <span class="resultado-titulo">${h.t}</span>
      <span class="resultado-primera">${h.f}</span>
      ${extra || ''}
    </span>
    ${esFav ? '<span class="resultado-fav">★</span>' : ''}
  </button>`;
}

function listar(himnos, mensajeVacio) {
  if (!himnos.length) {
    contenido.innerHTML = `<p class="mensaje-vacio">${mensajeVacio}</p>`;
    return;
  }
  contenido.innerHTML = himnos.map(h => tarjetaHimno(h)).join('');
}

function mostrarTodos() { listar(HIMNOS, 'No hay himnos cargados.'); }

function mostrarFavoritos() {
  const lista = favoritos.map(n => POR_NUMERO.get(n)).filter(Boolean);
  listar(lista, 'Todavía no marcaste favoritos.\nAbrí un himno y tocá la estrella ☆.');
}

function mostrarRecientes() {
  const lista = recientes.map(n => POR_NUMERO.get(n)).filter(Boolean);
  listar(lista, 'Acá van a aparecer los últimos himnos que abriste.');
}

function mostrarTemas() {
  contenido.innerHTML = TEMAS.map((t, i) =>
    `<button class="tema" data-tema-i="${i}">
       <span>${t.nombre}</span>
       <span class="tema-cantidad">${t.himnos.length} himno${t.himnos.length !== 1 ? 's' : ''}</span>
     </button>
     <div class="tema-himnos oculto" data-tema-lista="${i}"></div>`
  ).join('');
}

/* ── Boletines: índice de texto cargado bajo demanda ── */
let BOL_TEXTO = null;        // { archivo: textoOriginal }
let BOL_TEXTO_NORM = null;   // { archivo: textoNormalizado }
let bolCargando = false;
let bolTemporizador;

function mostrarBoletines() {
  if (typeof BOLETINES === 'undefined' || !BOLETINES.length) {
    contenido.innerHTML = `<p class="mensaje-vacio">Los boletines van a estar disponibles próximamente.</p>`;
    return;
  }
  contenido.innerHTML = `
    <div class="boletin-buscador">
      <input id="campo-boletines" type="search" inputmode="search" autocomplete="off"
             placeholder="Buscar una palabra dentro de los boletines…" aria-label="Buscar dentro de los boletines">
      <p class="boletin-ayuda">Busca en el texto de los ${BOLETINES.length} documentos. La primera búsqueda descarga el índice (unos segundos, solo una vez).</p>
    </div>
    <div id="boletines-resultado"></div>`;
  const c = document.getElementById('campo-boletines');
  c.addEventListener('input', () => {
    clearTimeout(bolTemporizador);
    bolTemporizador = setTimeout(() => buscarBoletines(c.value), 200);
  });
  renderListaBoletines();
}

function renderListaBoletines() {
  const caja = document.getElementById('boletines-resultado');
  if (!caja) return;
  const grupos = [];
  const indice = {};
  for (const b of BOLETINES) {
    const g = b.grupo || '';
    if (!(g in indice)) { indice[g] = grupos.length; grupos.push({ nombre: g, items: [] }); }
    grupos[indice[g]].items.push(b);
  }
  caja.innerHTML = grupos.map(gr =>
    `${gr.nombre ? `<h2 class="boletin-grupo">${gr.nombre}</h2>` : ''}
     <div class="boletin-lista">${gr.items.map(b =>
       `<a class="boletin" href="${b.archivo}" target="_blank" rel="noopener">
          <span class="boletin-titulo">${b.titulo}</span>
          <span class="boletin-fecha">${b.fecha || ''}</span>
          ${b.descripcion ? `<p class="boletin-descripcion">${b.descripcion}</p>` : ''}
        </a>`).join('')}</div>`
  ).join('');
}

function escaparRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

async function buscarBoletines(consulta) {
  const caja = document.getElementById('boletines-resultado');
  if (!caja) return;
  const q = consulta.trim();
  if (q.length < 2) { renderListaBoletines(); return; }

  if (!BOL_TEXTO) {
    if (bolCargando) return;
    bolCargando = true;
    caja.innerHTML = `<p class="mensaje-vacio">Descargando índice de búsqueda…</p>`;
    try {
      const resp = await fetch('datos/boletines-texto.json');
      BOL_TEXTO = await resp.json();
      BOL_TEXTO_NORM = {};
      for (const k in BOL_TEXTO) BOL_TEXTO_NORM[k] = normalizar(BOL_TEXTO[k]);
    } catch (e) {
      BOL_TEXTO = null; bolCargando = false;
      caja.innerHTML = `<p class="mensaje-vacio">No se pudo cargar el índice de búsqueda.<br>Hace falta internet la primera vez.</p>`;
      return;
    }
    bolCargando = false;
    const actual = document.getElementById('campo-boletines');
    if (actual && actual.value.trim() !== q) { buscarBoletines(actual.value); return; }
  }

  const qn = normalizar(q);
  const reHi = new RegExp(escaparRegExp(q), 'gi');
  const resultados = [];
  for (const b of BOLETINES) {
    const norm = BOL_TEXTO_NORM[b.archivo];
    if (!norm) continue;
    let pos = norm.indexOf(qn);
    if (pos < 0) continue;
    let n = 0, i = pos;
    while (i >= 0) { n++; i = norm.indexOf(qn, i + qn.length); }
    const orig = BOL_TEXTO[b.archivo] || '';
    const desde = Math.max(0, pos - 40);
    const crudo = orig.substring(desde, pos + qn.length + 70).replace(/\s+/g, ' ').trim();
    const visible = crudo.replace(reHi, m => `<mark>${m}</mark>`);
    resultados.push({ b, n, snippet: visible });
  }

  if (!resultados.length) {
    caja.innerHTML = `<p class="mensaje-vacio">Ningún boletín contiene «${q}».<br>Probá con otra palabra.</p>`;
    return;
  }
  const total = resultados.reduce((s, r) => s + r.n, 0);
  let html = `<p class="boletin-resumen">${resultados.length} documento${resultados.length !== 1 ? 's' : ''} · ${total} coincidencia${total !== 1 ? 's' : ''} para «${q}»</p>`;
  html += `<div class="boletin-lista">` + resultados.map(r => {
    const meta = `${r.b.fecha ? r.b.fecha + ' · ' : ''}${r.n} coincidencia${r.n !== 1 ? 's' : ''}`;
    return `<a class="boletin" href="${r.b.archivo}" target="_blank" rel="noopener">
       <span class="boletin-titulo">${r.b.titulo}</span>
       <span class="boletin-fecha">${meta}</span>
       <span class="boletin-coincidencia">…${r.snippet}…</span>
     </a>`;
  }).join('') + `</div>`;
  caja.innerHTML = html;
}

/* ════════════ BÚSQUEDA ════════════ */
const campo = $('#campo-busqueda');

function buscar(consulta) {
  const q = normalizar(consulta.trim());
  if (!q) { renderVista(); return; }

  // ¿Es un número?
  if (/^\d{1,3}$/.test(q)) {
    const n = parseInt(q, 10);
    const exacto = POR_NUMERO.get(n);
    const empiezan = HIMNOS.filter(h => h.n !== n && String(h.n).startsWith(q));
    const lista = (exacto ? [exacto] : []).concat(empiezan);
    listar(lista, `No existe el himno ${q}. El himnario va del 1 al 400.`);
    return;
  }

  // Texto: primero coincidencias en título, después en la letra
  const enTitulo = [], enLetra = [];
  for (const e of INDICE) {
    if (e.titulo.includes(q)) enTitulo.push(e.h);
    else if (e.letra.includes(q)) enLetra.push(e);
  }

  let html = '';
  if (enTitulo.length) {
    html += `<h3 class="titulo-seccion">Por título</h3>`;
    html += enTitulo.map(h => tarjetaHimno(h)).join('');
  }
  if (enLetra.length) {
    html += `<h3 class="titulo-seccion">En la letra</h3>`;
    html += enLetra.map(e => {
      // recorte con la coincidencia resaltada
      const pos = e.letra.indexOf(q);
      const desde = Math.max(0, pos - 30);
      const crudo = e.h.l.substring(desde, pos + q.length + 40).replace(/\n/g, ' ');
      const visible = crudo.replace(new RegExp(`(${consulta.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<mark>$1</mark>');
      return tarjetaHimno(e.h, `<span class="resultado-coincidencia">…${visible}…</span>`);
    }).join('');
  }
  contenido.innerHTML = html || `<p class="mensaje-vacio">No se encontró «${consulta}».<br>Probá con otra palabra o un número del 1 al 400.</p>`;
}

let temporizador;
campo.addEventListener('input', () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => buscar(campo.value), 120);
});

/* ════════════ PESTAÑAS ════════════ */
function renderVista() {
  // El buscador de himnos no aplica en la sección Boletines (tiene el suyo propio)
  $('#campo-busqueda').classList.toggle('oculto', vistaActual === 'boletines');
  ({ todos: mostrarTodos, temas: mostrarTemas, favoritos: mostrarFavoritos,
     recientes: mostrarRecientes, boletines: mostrarBoletines }[vistaActual])();
}
document.querySelectorAll('.pestana').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.pestana').forEach(x => x.classList.remove('activa'));
    p.classList.add('activa');
    vistaActual = p.dataset.vista;
    campo.value = '';
    cerrarHimno(false);
    renderVista();
  });
});

/* ════════════ VISTA DE HIMNO ════════════ */
const vistaHimno = $('#vista-himno');

// Divide la letra en estrofas (separadas por línea vacía o por nuevo "N.-" / "CORO:")
function partirEstrofas(letra) {
  const lineas = letra.split('\n');
  const estrofas = [];
  let actual = [];
  const empieza = l => /^\s*(\d\s*\.\s*-|CORO\b)/i.test(l);
  for (const l of lineas) {
    if ((!l.trim() || empieza(l)) && actual.length && actual.some(x => x.trim())) {
      estrofas.push(actual.join('\n').trim());
      actual = l.trim() ? [l] : [];
    } else if (l.trim() || actual.length) {
      actual.push(l);
    }
  }
  if (actual.some(x => x.trim())) estrofas.push(actual.join('\n').trim());
  return estrofas;
}

function htmlEstrofa(texto) {
  const esCoro = /^CORO\b/i.test(texto);
  if (esCoro) {
    const cuerpo = texto.replace(/^CORO\s*:?\s*/i, '');
    return `<div class="estrofa estrofa-coro"><span class="coro-etiqueta">CORO</span>${cuerpo}</div>`;
  }
  const conNumero = texto.replace(/^(\d)\s*\.\s*-\s*/, '<span class="estrofa-numero">$1.</span> ');
  return `<div class="estrofa">${conNumero}</div>`;
}

function abrirHimno(n, registrar = true) {
  const h = POR_NUMERO.get(n);
  if (!h) return;
  himnoAbierto = h;
  $('#himno-numero').textContent = h.n;
  $('#himno-titulo').textContent = h.t;
  $('#himno-letra').innerHTML = partirEstrofas(h.l).map(htmlEstrofa).join('');
  $('#himno-letra').style.setProperty('--tam-letra', tamLetra + 'rem');
  actualizarBotonFavorito();
  $('#btn-anterior').disabled = h.n === 1;
  $('#btn-siguiente').disabled = h.n === 400;

  $('#buscador').classList.add('oculto');
  contenido.classList.add('oculto');
  vistaHimno.classList.remove('oculto');
  window.scrollTo(0, 0);

  if (registrar) {
    recientes = [n, ...recientes.filter(x => x !== n)].slice(0, 10);
    guardar('recientes', recientes);
    history.pushState({ himno: n }, '', '#' + n);
  }
}

function cerrarHimno(volverScroll = true) {
  himnoAbierto = null;
  vistaHimno.classList.add('oculto');
  $('#buscador').classList.remove('oculto');
  contenido.classList.remove('oculto');
  if (volverScroll) renderVista();
}

// Delegación de clics en las listas
contenido.addEventListener('click', ev => {
  const tarjeta = ev.target.closest('.resultado');
  if (tarjeta) { abrirHimno(parseInt(tarjeta.dataset.n, 10)); return; }
  const tema = ev.target.closest('.tema');
  if (tema) {
    const i = tema.dataset.temaI;
    const caja = contenido.querySelector(`[data-tema-lista="${i}"]`);
    if (caja.classList.contains('oculto')) {
      caja.innerHTML = TEMAS[i].himnos.map(n => POR_NUMERO.get(n)).filter(Boolean)
        .map(h => tarjetaHimno(h)).join('');
      caja.classList.remove('oculto');
    } else {
      caja.classList.add('oculto');
    }
  }
});

$('#btn-volver').addEventListener('click', () => history.length > 1 ? history.back() : cerrarHimno());
$('#btn-inicio').addEventListener('click', () => { cerrarHimno(); campo.value = ''; renderVista(); });
$('#btn-anterior').addEventListener('click', () => himnoAbierto && abrirHimno(himnoAbierto.n - 1));
$('#btn-siguiente').addEventListener('click', () => himnoAbierto && abrirHimno(himnoAbierto.n + 1));

// Botón "atrás" del navegador / celular
window.addEventListener('popstate', ev => {
  const st = ev.state || {};
  if (st.himno) { cerrarFiliales(); abrirHimno(st.himno, false); }
  else if (st.filiales) { abrirFiliales(false); }
  else { cerrarHimno(); cerrarFiliales(); }
});

/* ── Tamaño de letra ── */
function cambiarLetra(delta) {
  tamLetra = Math.min(2.2, Math.max(0.85, +(tamLetra + delta).toFixed(2)));
  guardar('tamLetra', tamLetra);
  $('#himno-letra').style.setProperty('--tam-letra', tamLetra + 'rem');
}
$('#btn-letra-mas').addEventListener('click', () => cambiarLetra(0.12));
$('#btn-letra-menos').addEventListener('click', () => cambiarLetra(-0.12));

/* ── Favoritos ── */
function actualizarBotonFavorito() {
  const b = $('#btn-favorito');
  const esFav = himnoAbierto && favoritos.includes(himnoAbierto.n);
  b.textContent = esFav ? '★' : '☆';
  b.classList.toggle('activo', esFav);
  b.setAttribute('aria-label', esFav ? 'Quitar de favoritos' : 'Marcar como favorito');
}
$('#btn-favorito').addEventListener('click', () => {
  if (!himnoAbierto) return;
  const n = himnoAbierto.n;
  favoritos = favoritos.includes(n) ? favoritos.filter(x => x !== n) : [...favoritos, n];
  guardar('favoritos', favoritos);
  actualizarBotonFavorito();
});

/* ════════════ MODO PRESENTACIÓN ════════════ */
const pres = $('#presentacion');
let presEstrofas = [], presIndice = 0;

function abrirPresentacion() {
  if (!himnoAbierto) return;
  presEstrofas = partirEstrofas(himnoAbierto.l);
  presIndice = 0;
  pres.classList.remove('oculto');
  document.body.style.overflow = 'hidden';
  if (pres.requestFullscreen) pres.requestFullscreen().catch(() => {});
  renderPresentacion();
}
function cerrarPresentacion() {
  pres.classList.add('oculto');
  document.body.style.overflow = '';
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
function renderPresentacion() {
  const texto = presEstrofas[presIndice] || '';
  const esCoro = /^CORO\b/i.test(texto);
  $('#pres-encabezado').textContent = `${himnoAbierto.n} · ${himnoAbierto.t}`;
  $('#pres-texto').innerHTML = esCoro
    ? `<span class="coro-etiqueta">CORO</span>` + texto.replace(/^CORO\s*:?\s*/i, '')
    : texto.replace(/^(\d)\s*\.\s*-\s*/, '');
  $('#pres-indicador').textContent = `${presIndice + 1} / ${presEstrofas.length}`;
  $('#pres-anterior').disabled = presIndice === 0;
  $('#pres-siguiente').disabled = presIndice === presEstrofas.length - 1;
}
$('#btn-presentar').addEventListener('click', abrirPresentacion);
$('#pres-cerrar').addEventListener('click', cerrarPresentacion);
$('#pres-anterior').addEventListener('click', () => { if (presIndice > 0) { presIndice--; renderPresentacion(); } });
$('#pres-siguiente').addEventListener('click', () => { if (presIndice < presEstrofas.length - 1) { presIndice++; renderPresentacion(); } });
document.addEventListener('keydown', ev => {
  if (pres.classList.contains('oculto')) return;
  if (ev.key === 'ArrowRight' || ev.key === ' ') $('#pres-siguiente').click();
  if (ev.key === 'ArrowLeft') $('#pres-anterior').click();
  if (ev.key === 'Escape') cerrarPresentacion();
});

/* ════════════ FILIALES (Asamblea Cristiana) ════════════ */
const vistaFiliales = $('#vista-filiales');
let filialesInit = false, filTemporizador;

function initFiliales() {
  if (filialesInit || typeof FILIALES === 'undefined') return;
  filialesInit = true;
  const sel = $('#fil-prov');
  const provincias = [...new Set(FILIALES.map(f => f.prov))].sort((a, b) => a.localeCompare(b, 'es'));
  sel.insertAdjacentHTML('beforeend', provincias.map(p => `<option value="${p}">${p}</option>`).join(''));
  const conRetardo = () => { clearTimeout(filTemporizador); filTemporizador = setTimeout(renderFiliales, 150); };
  sel.addEventListener('change', renderFiliales);
  $('#fil-ciudad').addEventListener('input', conRetardo);
  $('#fil-dir').addEventListener('input', conRetardo);
}

function mapaURL(f) {
  const q = [f.dir, f.ciudad, f.prov, 'Argentina'].filter(Boolean).join(', ');
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

function renderFiliales() {
  const caja = $('#fil-resultado'); if (!caja) return;
  const prov = $('#fil-prov').value;
  const qc = normalizar($('#fil-ciudad').value.trim());
  const qd = normalizar($('#fil-dir').value.trim());
  const lista = (typeof FILIALES === 'undefined' ? [] : FILIALES).filter(f =>
    (!prov || f.prov === prov) &&
    (!qc || normalizar(f.ciudad).includes(qc)) &&
    (!qd || normalizar(f.dir).includes(qd))
  );
  $('#fil-resumen').textContent = `${lista.length} filial${lista.length !== 1 ? 'es' : ''}${prov ? ' en ' + prov : ''}`;
  if (!lista.length) {
    caja.innerHTML = `<p class="mensaje-vacio">No se encontraron filiales con esos filtros.</p>`;
    return;
  }
  caja.innerHTML = lista.map(f =>
    `<a class="filial" href="${mapaURL(f)}" target="_blank" rel="noopener" title="Ver en el mapa">
       <span class="filial-nombre">${f.nombre}</span>
       <span class="filial-dir">${f.dir || 'Sin dirección'}</span>
       <span class="filial-meta">${f.ciudad ? f.ciudad + ' · ' : ''}${f.prov}</span>
     </a>`
  ).join('');
}

function abrirFiliales(registrar = true) {
  initFiliales();
  cerrarPresentacion();
  himnoAbierto = null;
  vistaHimno.classList.add('oculto');
  $('#buscador').classList.add('oculto');
  contenido.classList.add('oculto');
  vistaFiliales.classList.remove('oculto');
  window.scrollTo(0, 0);
  renderFiliales();
  if (registrar) history.pushState({ filiales: true }, '', '#filiales');
}
function cerrarFiliales() {
  vistaFiliales.classList.add('oculto');
  $('#buscador').classList.remove('oculto');
  contenido.classList.remove('oculto');
}
$('#btn-filiales').addEventListener('click', () => abrirFiliales());
$('#btn-filiales-volver').addEventListener('click', () => history.length > 1 ? history.back() : cerrarFiliales());

/* ════════════ ARRANQUE ════════════ */
// Si la URL trae #N, abrir ese himno directamente
const hashStr = location.hash.slice(1);
const hash = parseInt(hashStr, 10);
if (hash >= 1 && hash <= 400) {
  renderVista();
  abrirHimno(hash, false);
  history.replaceState({ himno: hash }, '', '#' + hash);
} else if (hashStr === 'filiales') {
  renderVista();
  abrirFiliales(false);
  history.replaceState({ filiales: true }, '', '#filiales');
} else {
  renderVista();
}

// Registrar el service worker (solo funciona servido por HTTPS o localhost)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
})();
