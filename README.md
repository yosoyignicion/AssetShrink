<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/logotipo.jpg">
  <img src="src/logotipo.jpg" alt="AssetShrink Logo" width="800">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/versus.png">
  <img src="src/versus.png" alt="AssetShrink Versus Banner" width="800">
</picture>

<div align="center">
  <a href="https://github.com/yosoyignicion/AssetShrink">
    <img src="https://img.shields.io/badge/Gratis_y_open_source-GitHub-181717?style=for-the-badge&logo=github" alt="Gratis y open source">
  </a>
</div>

# AssetShrink Suite v3.2

> **Suite de herramientas local, ultra-rápida y privada mediante C++17 & WebP.**

AssetShrink es una suite de escritorio ligera que se ejecuta al 100% en tu máquina local. Incluye 35 herramientas: optimización y conversión de imágenes, redimensionado, recorte, marca de agua, extractor de colores, favicons, comparación, SVG, degradados, color y contraste, sombras, utilidades de texto/código/desarrollo y herramientas para IA. Nada sale de tu equipo: tus archivos nunca se envían a servidores externos. Es **gratis y de código abierto (MIT)**, sin cuentas ni marcas de agua.

<p align="center">
  <img src="https://img.shields.io/badge/C%2B%2B-17-00599C?logo=cplusplus" alt="C++17">
  <img src="https://img.shields.io/badge/WebP-Optimizado-8A2BE2" alt="WebP">
  <img src="https://img.shields.io/badge/Licencia-MIT-green" alt="MIT">
  <img src="https://img.shields.io/badge/CI_Passing-ubuntu_|_macOS_|_windows-4CAF50" alt="CI">
</p>

---

## 🎬 Demo

<img src="src/capture-video.gif" alt="AssetShrink Demo" width="800">

---

## 📥 Descarga

Los binarios se compilan automáticamente en CI para **Linux, macOS y Windows** en cada push a `main`. Descárgalos desde la pestaña **Actions → último workflow → Artifacts**, o compílalos desde el código fuente (ver más abajo).

```bash
./AssetShrink          # Linux/macOS
.\AssetShrink.exe      # Windows
```

El servidor se levanta automáticamente en `http://localhost:8080` y abre tu navegador.

> **💡 Opciones** — `./AssetShrink --help` (`--version`, `--port <n>`, `--no-open`).

---

## ✨ Características Clave

*   🔒 **Privacidad Total:** Procesamiento estrictamente local. Ideal para manejar assets confidenciales de proyectos o clientes.
*   🚀 **Rendimiento Nativo:** Motor en C++17 para procesamiento de imagen de latencia ultra-baja.
*   🔄 **Conversión Bidireccional:** Soporta PNG ↔ JPEG ↔ WebP directamente en memoria (sin escrituras temporales en disco).
*   📦 **Procesamiento por Lotes:** Cola de tareas para arrastrar y procesar decenas de archivos simultáneamente.
*   🧰 **Suite Multiusos:** Imagen, diseño, texto, código, desarrollo e IA — todo en un único binario offline.
*   🌍 **Internacionalización:** Interfaz completa en Español e Inglés; guarda tus preferencias (tema, idioma, favoritos y ajustes por herramienta) en el sistema y permite exportarlas/importarlas.

---

## 🧰 Herramientas

| Categoría | Herramientas |
|-----------|--------------|
| 🖼️ Imagen | Optimizador · Redimensionar · Recortar y girar · Embellecer capturas · Marca de agua · Extractor de colores · Generador de favicon · Comparador de imágenes · Optimizador SVG · Convertidor de formato |
| 🎨 Diseño | Generador de degradados · Color y contraste (WCAG) · Generador de sombras · Cuentagotas |
| 🔤 Texto y Código | Contador de palabras · Convertidor de texto · Líneas de texto · Buscar y reemplazar · Comparador de textos · Editor Markdown · Herramientas JSON · Probador de Regex · Lorem ipsum |
| 🔧 Desarrollo | Hash y codificador · Generador de contraseñas · Generador de UUID · Generador de QR · Imagen a Base64 · Timestamp ↔ fecha · Decodificador JWT · Analizador de URL |
| 💡 IA | Prompts de IA · Limpiador de datos sensibles · Fragmentador semántico · Contador de tokens |

> Las herramientas de texto, JSON, Markdown, Regex, color, sombras, UUID, timestamp, JWT, URL, recorte, marca de agua y SVG se ejecutan en el navegador (sin backend); las de imagen, favicon, Base64 y QR usan el motor nativo C++. La interfaz está disponible en **Español e Inglés**, incluye buscador, tema claro/oscuro (sigue al sistema), favoritos, command palette (Ctrl/Cmd+K), ajustes exportables/importables, PWA instalable con atajos y pegado/arrastre global de imágenes.

---

## 🔧 Compilación desde Código Fuente

> *No necesitas compilar si descargaste el binario precompilado. Esta sección es para desarrolladores.*

### Requisitos (Linux)

```bash
sudo apt update
sudo apt install cmake build-essential libwebp-dev pkg-config
```

### Compilación y Ejecución

```bash
cmake -B build
cmake --build build
./build/AssetShrink
```

### Verificación

```bash
scripts/smoke.sh        # arranca el binario y valida todos los endpoints
scripts/check_i18n.sh   # comprueba que toda clave t("...") exista en ES y EN
```

---

## 📂 Dependencias y Licencias de Terceros

Este proyecto es posible gracias a extraordinarias librerías de la comunidad, enlazadas de manera estática y respetando sus licencias correspondientes:

- **[stb](https://github.com/nothings/stb)** (Dominio Público / MIT) — Lectura y escritura de imágenes en memoria.
- **[cpp-httplib](https://github.com/yhirose/cpp-httplib)** (Licencia MIT) — Servidor HTTP de alto rendimiento y bajo footprint.
- **[libwebp](https://chromium.googlesource.com/webm/libwebp)** (Licencia BSD-3-Clause de Google) — El motor de codificación y decodificación WebP estándar de la industria.
- **[QR Code generator](https://github.com/nayuki/QR-Code-generator)** (Licencia MIT, Nayuki) — Generación de códigos QR en C++.

## 📄 Licencia

MIT License — consulta el archivo [LICENSE](LICENSE) para más detalles.
