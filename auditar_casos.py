#!/usr/bin/env python3
"""
auditar_casos.py
-----------------
Auditoria de calidad psicometrica para bancos de items de opcion multiple
(SERUM-APP). Detecta dos sesgos explotables:

  1. Sesgo de POSICION: la respuesta correcta se concentra en una letra
     (ej. B) en vez de distribuirse ~25/25/25/25% entre A, B, C, D.
  2. Sesgo de LONGITUD: la opcion correcta es sistematicamente mas larga
     que las incorrectas, permitiendo acertar sin conocimiento clinico.

USO
---
  python3 auditar_casos.py data.js
  python3 auditar_casos.py lote_nuevo.json

Acepta dos formatos de entrada:
  - El archivo completo data.js (con "window.SERUMS_DATA = {...}"),
    del cual se audita la clave "cases".
  - Un JSON simple: una lista de casos nuevos aun no fusionados
    (para revisar un lote antes de integrarlo a data.js).

UMBRALES (ajustables abajo en CONFIG)
--------------------------------------
  - Posicion: se marca alerta si alguna letra concentra >30% o <15%
    de las respuestas correctas (esperado ~25% c/u con 4 opciones).
  - Longitud: se marca alerta por caso si la opcion correcta es mas
    larga que TODAS las incorrectas Y supera el promedio de las
    incorrectas en mas de RATIO_LONGITUD (por defecto 30%).
"""

import json
import sys
from collections import Counter, defaultdict

# ----------------------- CONFIG -----------------------
POSICION_MIN_ESPERADA = 0.15   # 15%
POSICION_MAX_ESPERADA = 0.30   # 30%
RATIO_LONGITUD = 0.30          # 30% mas larga que el promedio de incorrectas
LETRAS = ["A", "B", "C", "D"]
# --------------------------------------------------------


def cargar_casos(ruta):
    """Carga casos desde data.js (window.SERUMS_DATA = {...};) o JSON simple."""
    with open(ruta, encoding="utf-8") as f:
        contenido = f.read()

    contenido_stripped = contenido.strip()

    # Caso 1: JSON simple (lista de casos o dict con "cases")
    try:
        data = json.loads(contenido_stripped)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "cases" in data:
            return data["cases"]
    except json.JSONDecodeError:
        pass

    # Caso 2: archivo data.js con wrapper JS (window.SERUMS_DATA = {...};)
    inicio = contenido.find("{")
    fin = contenido.rfind("}")
    if inicio == -1 or fin == -1:
        raise ValueError("No se pudo localizar un objeto JSON valido en el archivo.")

    data = json.loads(contenido[inicio:fin + 1])
    if "cases" not in data:
        raise ValueError("El archivo no contiene la clave 'cases'.")
    return data["cases"]


def auditar(casos):
    posicion = Counter()
    alertas_longitud = []
    alertas_estructura = []
    posicion_por_nivel = defaultdict(Counter)

    for c in casos:
        cid = c.get("id", "SIN_ID")
        titulo = c.get("title", "SIN_TITULO")
        opciones = c.get("options", [])
        correcta = c.get("correct")
        nivel = c.get("level", "SIN_NIVEL")

        # --- validacion estructural basica ---
        if len(opciones) != 4:
            alertas_estructura.append(f"  Caso {cid} ({titulo}): tiene {len(opciones)} opciones, se esperaban 4.")
            continue
        if correcta is None or not (0 <= correcta <= 3):
            alertas_estructura.append(f"  Caso {cid} ({titulo}): indice 'correct' invalido ({correcta}).")
            continue

        posicion[correcta] += 1
        posicion_por_nivel[nivel][correcta] += 1

        # --- sesgo de longitud ---
        largos = [len(o) for o in opciones]
        largo_correcta = largos[correcta]
        largos_incorrectas = [l for i, l in enumerate(largos) if i != correcta]
        promedio_incorrectas = sum(largos_incorrectas) / len(largos_incorrectas)

        es_la_mas_larga = largo_correcta == max(largos)
        supera_umbral = (
            promedio_incorrectas > 0
            and (largo_correcta - promedio_incorrectas) / promedio_incorrectas > RATIO_LONGITUD
        )

        if es_la_mas_larga and supera_umbral:
            pct = (largo_correcta / promedio_incorrectas - 1) * 100
            alertas_longitud.append(
                f"  Caso {cid} ({titulo}): opcion correcta {pct:.0f}% mas larga que el promedio de las incorrectas."
            )

    return posicion, posicion_por_nivel, alertas_longitud, alertas_estructura, len(casos)


def imprimir_reporte(posicion, posicion_por_nivel, alertas_longitud, alertas_estructura, total):
    print("=" * 60)
    print(f"AUDITORIA DE CASOS - {total} casos analizados")
    print("=" * 60)

    print("\n[1] DISTRIBUCION GLOBAL DE POSICION CORRECTA (esperado ~25% c/u)")
    for i, letra in enumerate(LETRAS):
        n = posicion.get(i, 0)
        pct = n / total * 100 if total else 0
        marca = ""
        if pct / 100 > POSICION_MAX_ESPERADA:
            marca = "  <-- ALERTA: sobrerrepresentada"
        elif pct / 100 < POSICION_MIN_ESPERADA:
            marca = "  <-- ALERTA: subrrepresentada"
        print(f"   {letra}: {n:>4} casos ({pct:5.1f}%){marca}")

    print("\n[2] DISTRIBUCION DE POSICION POR NIVEL")
    for nivel, ctr in sorted(posicion_por_nivel.items()):
        total_nivel = sum(ctr.values())
        linea = "   ".join(
            f"{LETRAS[i]}={ctr.get(i,0)/total_nivel*100:.0f}%" for i in range(4)
        )
        print(f"   {nivel} (n={total_nivel}): {linea}")

    print(f"\n[3] SESGO DE LONGITUD - {len(alertas_longitud)} casos con alerta")
    if alertas_longitud:
        for a in alertas_longitud[:30]:
            print(a)
        if len(alertas_longitud) > 30:
            print(f"  ... y {len(alertas_longitud) - 30} mas.")
    else:
        print("   Sin alertas de longitud.")

    print(f"\n[4] ERRORES ESTRUCTURALES - {len(alertas_estructura)} casos con problemas")
    if alertas_estructura:
        for a in alertas_estructura:
            print(a)
    else:
        print("   Sin errores estructurales.")

    print("\n" + "=" * 60)
    hay_alertas = len(alertas_longitud) > 0 or len(alertas_estructura) > 0
    max_pct = max(posicion.values()) / total if total else 0
    if max_pct > POSICION_MAX_ESPERADA:
        hay_alertas = True
    print("RESULTADO: " + ("REVISAR ANTES DE SUBIR" if hay_alertas else "OK PARA SUBIR"))
    print("=" * 60)


def main():
    if len(sys.argv) != 2:
        print("Uso: python3 auditar_casos.py <archivo>")
        print("  <archivo> puede ser data.js completo o un JSON con una lista de casos nuevos.")
        sys.exit(1)

    ruta = sys.argv[1]
    try:
        casos = cargar_casos(ruta)
    except Exception as e:
        print(f"Error al leer '{ruta}': {e}")
        sys.exit(1)

    if not casos:
        print("No se encontraron casos en el archivo.")
        sys.exit(1)

    resultado = auditar(casos)
    imprimir_reporte(*resultado)


if __name__ == "__main__":
    main()
