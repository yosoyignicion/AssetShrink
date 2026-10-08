<div align="center">

<img src="src/logotipo.jpg" alt="AssetShrink" width="760">

# AssetShrink Suite

**35 herramientas local-first para imagen, diseño, texto/código, desarrollo e IA — en un único binario C++17.**

Sin subidas · Sin registro · Sin marcas de agua · 100 % offline

<a href="https://github.com/yosoyignicion/AssetShrink/releases/latest"><img src="https://img.shields.io/badge/Descargar-v3.2.0-6d5efc?style=for-the-badge&logo=github&logoColor=white" alt="Descargar la última versión"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/Licencia-MIT-3DA639?style=for-the-badge" alt="Licencia MIT"></a>

<br>

<img src="https://img.shields.io/badge/C%2B%2B-17-00599C?logo=cplusplus&logoColor=white" alt="C++17">
<img src="https://img.shields.io/badge/WebP-motor_nativo-8A2BE2" alt="WebP nativo">
<img src="https://img.shields.io/badge/CI-ubuntu_·_macOS_·_windows-4CAF50?logo=githubactions&logoColor=white" alt="CI multiplataforma">
<img src="https://img.shields.io/badge/PWA-instalable-5A0FC8?logo=pwa&logoColor=white" alt="PWA">
<img src="https://img.shields.io/badge/ES%2FEN-bilingüe-2563EB" alt="Bilingüe">

</div>

AssetShrink es una caja de herramientas de escritorio que arranca un servidor local y abre una interfaz web en tu navegador. **Todo el procesamiento ocurre en tu equipo**: no hay subidas, ni cuentas, ni telemetría, y funciona sin conexión. Ideal para trabajar con assets confidenciales de clientes o proyectos.

---

## 🎬 Vista rápida

<table>
  <tr>
    <td width="50%" align="center"><img src="docs/img/landing-dark.webp" alt="Interfaz en tema oscuro"></td>
    <td width="50%" align="center"><img src="docs/img/landing-light.webp" alt="Interfaz en tema claro"></td>
  </tr>
  <tr>
    <td align="center"><sub>Tema oscuro (sigue al sistema)</sub></td>
    <td align="center"><sub>Tema claro</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><img src="docs/img/optimizer-dark.webp" alt="Optimizador con comparador antes/después"></td>
    <td width="50%" align="center"><img src="docs/img/command-palette-dark.webp" alt="Command palette (Ctrl/Cmd+K)"></td>
  </tr>
  <tr>
    <td align="center"><sub>Comparador antes/después tras comprimir</sub></td>
    <td align="center"><sub>Command palette <kbd>Ctrl/Cmd</kbd>+<kbd>K</kbd></sub></td>
  </tr>
</table>

### Demo en movimiento

<img src="src/capture-video.gif" alt="Demo de AssetShrink" width="880">

---

## ✨ Por qué AssetShrink

<img src="src/versus.png" alt="PNG vs WebP" width="820">

- 🔒 **Privacidad total** — procesamiento estrictamente local. Ningún archivo abandona tu dispositivo.
- 🚀 **Rendimiento nativo** — motor en C++17 (stb + libwebp) para procesar imagen en memoria, sin escrituras temporales en disco.
- 🪶 **Un único binario** — el backend y toda la interfaz (HTML/CSS/JS) van embebidos en el ejecutable. Cero dependencias en tiempo de ejecución.
- 📦 **Procesamiento por lotes** — cola de tareas para arrastrar y comprimir decenas de archivos con descarga agrupada en ZIP.
- 🌍 **Bilingüe y personalizable** — interfaz ES/EN, temas claro/oscuro, favoritos, recientes, ajustes por herramienta y exportables/importables.
- 📲 **PWA instalable** — service worker offline-first, atajos y pegado/arrastre global de imágenes.
- 💸 **Gratis y open source (MIT)** — sin cuentas, sin límites y sin marcas de agua.

---

## 🧰 Las 35 herramientas

| Categoría | Herramientas |
|-----------|--------------|
| 🖼️ **Imagen** | Optimizador · Redimensionar · Recortar y girar · Embellecer capturas · Marca de agua · Extractor de colores · Generador de favicon · Comparador de imágenes · Optimizador SVG · Convertidor de formato |
| 🎨 **Diseño** | Generador de degradados · Color y contraste (WCAG) · Generador de sombras · Cuentagotas |
| 🔤 **Texto y Código** | Contador de palabras · Convertidor de texto · Líneas de texto · Buscar y reemplazar · Comparador de textos · Editor Markdown · Herramientas JSON · Probador de Regex · Lorem ipsum |
| 🔧 **Desarrollo** | Hash y codificador · Generador de contraseñas · Generador de UUID · Generador de QR · Imagen a Base64 · Timestamp ↔ fecha · Decodificador JWT · Analizador de URL |
| 💡 **IA** | Prompts de IA · Limpiador de datos sensibles · Fragmentador semántico · Contador de tokens |

> **Backend C++** (5): Optimizador, Redimensionar, Extractor de colores, Embellecer capturas y Generador de QR.
> **Cliente** (30): el resto se ejecuta en el navegador con Canvas/JS, sin llamar al servidor.

---

## 📥 Descarga

Descarga el binario precompilado desde la [última release](https://github.com/yosoyignicion/AssetShrink/releases/latest). Descomprime y ejecuta:

| Sistema | Archivo |
|---------|---------|
| 🐧 **Linux x64** | [`AssetShrink-linux-x64.zip`](https://github.com/yosoyignicion/AssetShrink/releases/download/v3.2.0/AssetShrink-linux-x64.zip) |
| 🪟 **Windows x64** | [`AssetShrink-windows-x64.zip`](https://github.com/yosoyignicion/AssetShrink/releases/download/v3.2.0/AssetShrink-windows-x64.zip) |
| 🍎 **macOS (universal)** | [`AssetShrink-macos-universal.zip`](https://github.com/yosoyignicion/AssetShrink/releases/download/v3.2.0/AssetShrink-macos-universal.zip) |

```bash
./AssetShrink          # Linux / macOS
.\AssetShrink.exe      # Windows
```

Se abre automáticamente en `http://localhost:8080`, eligiendo el primer puerto libre entre **8080–8089**.

> **💡 Opciones de línea de comandos** — `--help` · `--version` · `--port <n>` · `--no-open`

---

## 🔧 Compilar desde código fuente

> *No necesitas compilar si usaste un binario precompilado. Esta sección es para desarrolladores.*

**Requisitos**

```bash
# Linux
sudo apt update && sudo apt install cmake build-essential libwebp-dev pkg-config

# macOS
brew install webp pkg-config
```

**Compilar y ejecutar**

```bash
cmake -B build
cmake --build build
./build/AssetShrink
```

**Verificación**

```bash
scripts/smoke.sh        # arranca el binario y valida todos los endpoints
scripts/check_i18n.sh   # comprueba que toda clave t("...") exista en ES y EN
```

---

## 🏗️ Arquitectura

- **Backend** (`src/core/`, `src/tools/`) — `image_io` (stb + stb_image_resize2 + WebP) y `assets` (búsqueda de assets embebidos + MIME); herramientas modulares registradas vía `register_<tool>(httplib::Server&)`.
- **Frontend** (`src/web/`) — SPA vanilla-JS (ES modules, router History API), un módulo por herramienta, i18n ES/EN, PWA (manifest + service worker) y ZIP sin dependencias.
- **Assets embebidos** en build-time (`cmake/embed_assets.cmake`, `file(READ ... HEX)` → `assets_generated.cpp`): todo se sirve desde memoria en un solo binario.
- **API local** — `POST /api/convert`, `/api/resize`, `/api/palette`, `/api/beautify`, `GET /api/qr`. Rutas `/`, `/pricing` y `/tools/<slug>` inyectan meta SEO por ruta desde `seo.txt`.
- **Versión** — única fuente en `CMakeLists.txt` → `config.h` generado.

Detalles completos para agentes/contribuidores en [`AGENTS.md`](AGENTS.md).

---

## 🧩 Dependencias y licencias de terceros

Este proyecto es posible gracias a extraordinarias librerías de la comunidad, enlazadas de forma estática y respetando sus licencias:

- **[stb](https://github.com/nothings/stb)** (Dominio Público / MIT) — Lectura y escritura de imágenes en memoria.
- **[cpp-httplib](https://github.com/yhirose/cpp-httplib)** (MIT) — Servidor HTTP ligero y de alto rendimiento.
- **[libwebp](https://chromium.googlesource.com/webm/libwebp)** (BSD-3-Clause, Google) — Codificación/decodificación WebP.
- **[QR Code generator](https://github.com/nayuki/QR-Code-generator)** (MIT, Nayuki) — Generación de códigos QR.

---

## 📄 Licencia

MIT — consulta el archivo [LICENSE](LICENSE) para más detalles.

<div align="center"><sub>Hecho con C++17 & WebP. Tus datos, en tu máquina.</sub></div>
