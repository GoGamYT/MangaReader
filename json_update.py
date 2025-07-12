import json
import urllib.parse
import re
from collections import defaultdict
from b2sdk.v2 import InMemoryAccountInfo, B2Api

# Configuración inicial
key_id = "005d60258956e7f0000000007"
application_key = "K005jDEfY3bRLIgkMgXtx9ZsWJr5VgQ"
bucket_name = "ComicsMangas"
categoria_base = "+18"
EXTENSIONES_VALIDAS = ('.webp', '.jpg', '.jpeg', '.png')

# 1. Función para verificar si un archivo es una imagen válida
def es_imagen_valida(nombre_archivo):
    return nombre_archivo.lower().endswith(EXTENSIONES_VALIDAS)

# 2. Función para procesar la estructura del bucket
def procesar_bucket(bucket):
    estructura = defaultdict(lambda: {
        "capitulos": defaultdict(list),
        "imagenes_sueltas": []
    })

    for file_version, _ in bucket.ls(f"chapter/{categoria_base}/", recursive=True):
        nombre = file_version.file_name
        
        # Ignorar archivos no deseados
        if (".bzempty" in nombre.lower() or 
            nombre.endswith('/') or 
            not es_imagen_valida(nombre)):
            continue
            
        partes = nombre.split('/')
        
        if len(partes) < 4:  # chapter/+18/serie/[capitulo/]imagen
            continue

        _, categoria, serie, *resto = partes

        if len(resto) == 1:  # Imagen suelta
            estructura[serie]["imagenes_sueltas"].append(nombre)
        elif len(resto) >= 2:  # Imagen en capítulo
            capitulo = resto[0]
            estructura[serie]["capitulos"][capitulo].append(nombre)
    
    return estructura

# 3. Función para generar el JSON final
def generar_datos_series(estructura):
    resultado = []
    
    for serie, data in estructura.items():
        # Solo procesar si tiene contenido
        if not data["capitulos"] and not data["imagenes_sueltas"]:
            continue
            
        # Generar ID y título
        serie_id = re.sub(r'[^a-z0-9_]', '_', serie.lower())
        titulo = " ".join(
            word.capitalize() if len(word) > 3 else word
            for word in serie.replace("_", " ").split()
        )
        
        # Obtener portada
        portada_path = None
        
        # Buscar en capítulos primero
        if data["capitulos"]:
            for capitulo, archivos in sorted(data["capitulos"].items()):
                for archivo in sorted(archivos):
                    if es_imagen_valida(archivo):
                        portada_path = archivo
                        break
                if portada_path:
                    break
        
        # Si no hay en capítulos, buscar en imágenes sueltas
        if not portada_path and data["imagenes_sueltas"]:
            for img in sorted(data["imagenes_sueltas"]):
                if es_imagen_valida(img):
                    portada_path = img
                    break
        
        if not portada_path:
            continue
            
        portada_url = f"https://f005.backblazeb2.com/file/{bucket_name}/{urllib.parse.quote(portada_path)}"
        
        # Preparar entrada
        entrada = {
            "id": serie_id,
            "titulo": titulo,
            "portada": portada_url,
            "categoria": [categoria_base],
            "tipo_historieta": categoria_base,
            "estado": "finalizado"
        }
        
        # Procesar capítulos o total
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

# Inicializar conexión con Backblaze
info = InMemoryAccountInfo()
b2_api = B2Api(info)
b2_api.authorize_account("production", key_id, application_key)
bucket = b2_api.get_bucket_by_name(bucket_name)

# Procesar bucket y generar datos
estructura_completa = procesar_bucket(bucket)
datos_finales = generar_datos_series(estructura_completa)

# Guardar resultado en JSON
with open("series.json", "w", encoding="utf-8") as f:
    json.dump(datos_finales, f, ensure_ascii=False, indent=2)

print(f"✅ Proceso completado. {len(datos_finales)} series generadas.")