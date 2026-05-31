<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/logotipo.jpg">
  <img src="src/logotipo.jpg" alt="AssetShrink Logo" width="800">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/versus.png">
  <img src="src/versus.png" alt="AssetShrink Versus Banner" width="800">
</picture>

<div align="center">
  <a href="https://ignaciodev.gumroad.com/l/assetshrink-pro">
    <img src="https://img.shields.io/badge/Comprar_AssetShrink_PRO-Gumroad-800080?style=for-the-badge&logo=gumroad" alt="Comprar en Gumroad">
  </a>
</div>

# AssetShrink PRO v2.1

> **Compresor y conversor de imágenes local, ultra-rápido y privado mediante C++17 & WebP.**

AssetShrink es una herramienta de escritorio ligera que se ejecuta al 100% en tu máquina local. Permite optimizar y convertir múltiples imágenes simultáneamente a formatos WebP, PNG o JPEG de manera segura y sin enviar tus archivos a servidores externos.

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

Descarga el binario precompilado para tu sistema desde la carpeta [`releases/`](releases/):

| Sistema | Archivo |
|---------|---------|
| 🐧 Linux x64 | [`AssetShrink-linux-x64.zip`](releases/AssetShrink-linux-x64.zip) |
| 🍎 macOS Universal | [`AssetShrink-macos-universal.zip`](releases/AssetShrink-macos-universal.zip) |
| 🪟 Windows x64 | [`AssetShrink-windows-x64.zip`](releases/AssetShrink-windows-x64.zip) |

```bash
# Descomprimir y ejecutar (Linux/macOS)
unzip AssetShrink-*.zip
./AssetShrink
```

```powershell
# Descomprimir y ejecutar (Windows)
Expand-Archive AssetShrink-windows-x64.zip .
.\AssetShrink.exe
```

El servidor se levanta automáticamente en `http://localhost:8080` y abre tu navegador.

> **💡 ¿Necesitas ayuda?** — `./AssetShrink --version` muestra la versión instalada.

---

## ✨ Características Clave

*   🔒 **Privacidad Total:** Procesamiento estrictamente local. Ideal para manejar assets confidenciales de proyectos o clientes.
*   🚀 **Rendimiento Nativo:** Desarrollado sobre un motor multihilo en C++17 para un procesamiento de imágenes de latencia ultra-baja.
*   🔄 **Conversión Bidireccional:** Soporta PNG ↔ JPEG ↔ WebP directamente en memoria (sin escrituras temporales en disco).
*   📦 **Procesamiento por Lotes:** Cola de tareas asíncrona para arrastrar y procesar decenas de archivos simultáneamente.
*   📊 **Comparador Visual:** Interfaz *Split-Screen* interactiva en tiempo real para juzgar la fidelidad de la compresión.
*   🌍 **Internacionalización:** Interfaz configurable en Español e Inglés que guarda tus preferencias en el sistema.

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

---

## 📂 Dependencias y Licencias de Terceros

Este proyecto es posible gracias a extraordinarias librerías de la comunidad, enlazadas de manera estática y respetando sus licencias correspondientes:

- **[stb](https://github.com/nothings/stb)** (Dominio Público / MIT) — Lectura y escritura de imágenes en memoria.
- **[cpp-httplib](https://github.com/yhirose/cpp-httplib)** (Licencia MIT) — Servidor HTTP de alto rendimiento y bajo footprint.
- **[libwebp](https://chromium.googlesource.com/webm/libwebp)** (Licencia BSD-3-Clause de Google) — El motor de codificación y decodificación WebP estándar de la industria.

## 📄 Licencia

MIT License — consulta el archivo [LICENSE](LICENSE) para más detalles.
