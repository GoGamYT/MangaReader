import json
import urllib.parse
import re
from collections import defaultdict
from b2sdk.v2 import InMemoryAccountInfo, B2Api

# Configuración inicial
key_id = "005d60258956e7f0000000007"
application_key = "K005jDEfY3bRLIgkMgXtx9ZsWJr5VgQ"
bucket_name = "ComicsMangas"
categorias_base = ["+18", "manga", "manhwa", "manhua", "comic"]
EXTENSIONES_VALIDAS = ('.webp', '.jpg', '.jpeg', '.png')

# Verifica si el archivo tiene una extensión válida
def es_imagen_valida(nombre_archivo):
    return nombre_archivo.lower().endswith(EXTENSIONES_VALIDAS)

# Procesa el bucket para todas las categorías
def procesar_bucket(bucket):
    estructura = defaultdict(lambda: {
        "capitulos": defaultdict(list),
        "imagenes_sueltas": [],
        "categoria": None
    })

    for categoria in categorias_base:
        prefijo = f"chapter/{categoria}/"
        for file_version, _ in bucket.ls(prefijo, recursive=True):
            nombre = file_version.file_name
            
            if (".bzempty" in nombre.lower() or nombre.endswith('/') or not es_imagen_valida(nombre)):
                continue
            
            partes = nombre.split('/')
            if len(partes) < 4:
                continue

            _, cat, serie, *resto = partes
            if estructura[serie]["categoria"] is None:
                estructura[serie]["categoria"] = cat

            if len(resto) == 1:
                estructura[serie]["imagenes_sueltas"].append(nombre)
            elif len(resto) >= 2:
                capitulo = resto[0]
                estructura[serie]["capitulos"][capitulo].append(nombre)
    
    return estructura

# Genera los datos en formato JSON
def generar_datos_series(estructura):
    resultado = []

    for serie, data in estructura.items():
        if not data["capitulos"] and not data["imagenes_sueltas"]:
            continue

        serie_id = re.sub(r'[^a-z0-9_]', '_', serie.lower())
        titulo = " ".join(
            word.capitalize() if len(word) > 3 else word
            for word in serie.replace("_", " ").split()
        )

        portada_path = None
        for capitulo, archivos in sorted(data["capitulos"].items()):
            for archivo in sorted(archivos):
                if es_imagen_valida(archivo):
                    portada_path = archivo
                    break
            if portada_path:
                break

        if not portada_path and data["imagenes_sueltas"]:
            for img in sorted(data["imagenes_sueltas"]):
                if es_imagen_valida(img):
                    portada_path = img
                    break

        if not portada_path:
            continue

        portada_url = f"https://f005.backblazeb2.com/file/{bucket_name}/{urllib.parse.quote(portada_path)}"
        categoria = data["categoria"]

        entrada = {
            "id": serie_id,
            "titulo": titulo,
            "portada": portada_url,
            "categoria": [categoria],
            "tipo_historieta": categoria,
            "estado": "finalizado"
        }

        if data["capitulos"]:
            entrada["capitulos"] = {
                cap: len([img for img in archivos if es_imagen_valida(img)]) + 1
                for cap, archivos in sorted(data["capitulos"].items())
            }
        else:
            entrada["total"] = len([img for img in data["imagenes_sueltas"] if es_imagen_valida(img)]) + 1

        resultado.append(entrada)

    return resultado

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Ejecución principal
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

info = InMemoryAccountInfo()
b2_api = B2Api(info)
b2_api.authorize_account("production", key_id, application_key)
bucket = b2_api.get_bucket_by_name(bucket_name)

estructura_completa = procesar_bucket(bucket)
datos_finales = generar_datos_series(estructura_completa)

with open("series.json", "w", encoding="utf-8") as f:
    json.dump(datos_finales, f, ensure_ascii=False, indent=2)

print(f"✅ Proceso completado. {len(datos_finales)} series generadas.")
