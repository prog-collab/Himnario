#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extracción de los 400 himnos del Himnario de la Asamblea Cristiana.
Incluye las correcciones documentadas:
  - Himno 126 numerado como 136 en el PDF (error tipográfico)
  - Himno 235 numerado como 236 en el PDF (desfase)
  - Formatos sin espacio (143.-TÍTULO)
  - Himno 362 concatenado al final del 361
"""
import re, json, unicodedata

with open('himnario.txt', encoding='utf-8') as f:
    texto = f.read()

# Caso especial: himno 362 concatenado al final de una línea del 361.
# Buscamos "362" seguido de punto y título en mayúsculas dentro de una línea.
m = re.search(r'(?m)^(.*\S)\s+(362\s*\.\s*-?\s*[A-ZÁÉÍÓÚÑÜ¡¿].*)$', texto)
if m and not m.group(1).strip().startswith('362'):
    texto = texto[:m.start()] + m.group(1) + '\n' + m.group(2) + texto[m.end():]
    print(f"[fix] 362 separado de la línea: ...{m.group(1)[-40:]!r}")

lineas = texto.split('\n')

def es_titulo(linea):
    """Encabezado de himno: 'N. - TÍTULO' o 'N.-TÍTULO', título mayormente en mayúsculas."""
    m = re.match(r'^\s*(\d{1,3})\s*\.\s*-?\s*(.+)$', linea)
    if not m:
        # formato sin punto: "49 - ¡OH, CUAN DULCE!" (solo con guion, para no confundir con versos)
        m = re.match(r'^\s*(\d{1,3})\s*-\s*(.+)$', linea)
    if not m:
        return None
    n, resto = int(m.group(1)), m.group(2).strip()
    if not (1 <= n <= 400) or len(resto) < 3:
        return None
    letras = [c for c in resto if c.isalpha()]
    if not letras:
        return None
    mayus = sum(1 for c in letras if c.isupper())
    if mayus / len(letras) < 0.9:   # los versos están en minúsculas
        return None
    return n, resto

# Recorremos las líneas y cortamos en cada encabezado
himnos = []          # lista de dicts crudos
actual = None
for i, linea in enumerate(lineas):
    t = es_titulo(linea)
    if t:
        if actual:
            himnos.append(actual)
        actual = {'n_pdf': t[0], 't': t[1], 'lineas': []}
    elif actual is not None:
        actual['lineas'].append(linea)
if actual:
    himnos.append(actual)

print(f"Encabezados detectados: {len(himnos)}")

# Correcciones de numeración documentadas (por título, no por posición)
def quitar_tildes(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

CORRECCIONES = {
    # título (sin tildes, mayúsculas) -> número correcto
    'PECADOR JESUS TE LLAMA': 126,
    'EN JESUS MI ESPERANZA REPOSA': 235,
}

vistos = {}
finales = []
for h in himnos:
    n = h['n_pdf']
    clave = quitar_tildes(h['t']).upper().strip().rstrip('.')
    if clave in CORRECCIONES and n != CORRECCIONES[clave] and CORRECCIONES[clave] not in vistos:
        print(f"[fix] '{h['t']}' renumerado {n} -> {CORRECCIONES[clave]}")
        n = CORRECCIONES[clave]
    # limpiar letra: quitar líneas vacías al inicio/fin, números de página sueltos
    cuerpo = [l.rstrip() for l in h['lineas']]
    cuerpo = [l for l in cuerpo if not re.fullmatch(r'\s*\d{1,3}\s*', l)]  # nros de página
    while cuerpo and not cuerpo[0].strip():
        cuerpo.pop(0)
    while cuerpo and not cuerpo[-1].strip():
        cuerpo.pop()
    letra = '\n'.join(cuerpo)
    # colapsar 3+ saltos en 2
    letra = re.sub(r'\n{3,}', '\n\n', letra)
    primera = next((l.strip() for l in cuerpo if l.strip() and not re.match(r'^(CORO|Coro)\b', l.strip())), '')
    primera = re.sub(r'^\d+\s*\.\s*-?\s*', '', primera)
    if n in vistos:
        print(f"[!] número duplicado: {n} ('{h['t']}' vs '{vistos[n]}')")
        continue
    vistos[n] = h['t']
    finales.append({'n': n, 't': h['t'].rstrip('.').strip(), 'l': letra, 'f': primera})

finales.sort(key=lambda x: x['n'])
nums = {h['n'] for h in finales}
faltan = sorted(set(range(1, 401)) - nums)
print(f"Himnos finales: {len(finales)}")
print(f"Faltantes: {faltan if faltan else 'ninguno'}")

with open('himnos_400.json', 'w', encoding='utf-8') as f:
    json.dump(finales, f, ensure_ascii=False, indent=1)
print("Guardado: himnos_400.json")
