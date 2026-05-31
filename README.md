<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/logotipo.jpg">
  <img src="src/logotipo.jpg" alt="AssetShrink Logo" width="800">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/versus.png">
  <img src="src/versus.png" alt="AssetShrink Versus Banner" width="800">
</picture>

# AssetShrink v2.1

> **Compresor y conversor de imágenes local, ultra-rápido y privado mediante C++17 & WebP.**

AssetShrink es una herramienta de escritorio ligera que se ejecuta al 100% en tu máquina local. Permite optimizar y convertir múltiples imágenes simultáneamente a formatos WebP, PNG o JPEG de manera segura y sin enviar tus archivos a servidores externos.

![Badge](https://img.shields.io/badge/C%2B%2B-17-00599C?logo=cplusplus)
![Badge](https://img.shields.io/badge/WebP-Optimizado-8A2BE2)
![Badge](https://img.shields.io/badge/Licencia-MIT-green)
![Badge](https://img.shields.io/badge/CI_Passing-ubuntu_|_macOS_|_windows-4CAF50)

---

## 🎬 Demo

<img src="src/capture-video.gif" alt="AssetShrink Demo" width="800">

---

## ✨ Características Clave

*   🔒 **Privacidad Total:** Procesamiento estrictamente local. Ideal para manejar assets confidenciales de proyectos o clientes.
*   🚀 **Rendimiento Nativo:** Desarrollado sobre un motor multihilo en C++17 para un procesamiento de imágenes de latencia ultra-baja.
*   🔄 **Conversión Bidireccional:** Soporta PNG ↔ JPEG ↔ WebP directamente en memoria (sin escrituras temporales en disco).
*   📦 **Procesamiento por Lotes:** Cola de tareas asíncrona para arrastrar y procesar decenas de archivos simultáneamente.
*   📊 **Comparador Visual:** Interfaz *Split-Screen* interactiva en tiempo real para juzgar la fidelidad de la compresión.
*   🌍 **Internacionalización:** Interfaz configurable en Español e Inglés que guarda tus preferencias en el sistema.

---

## 🛠️ Requisitos de Compilación (Linux)

Para compilar la aplicación desde el código fuente, asegúrate de tener instaladas las herramientas de desarrollo estándar y la librería WebP de Google:

```bash
sudo apt update
sudo apt install cmake build-essential libwebp-dev pkg-config
```

## 🚀 Compilación y Ejecución Rápida

```bash
cmake -B build
cmake --build build
./build/AssetShrink
```

El ejecutable levantará de forma silenciosa el servidor local y abrirá automáticamente una pestaña de tu navegador predeterminado en `http://localhost:8080`.

## 📂 Dependencias y Licencias de Terceros

Este proyecto es posible gracias a extraordinarias librerías de la comunidad, enlazadas de manera estática y respetando sus licencias correspondientes:

- **[stb](https://github.com/nothings/stb)** (Dominio Público / MIT) — Lectura y escritura de imágenes en memoria.
- **[cpp-httplib](https://github.com/yhirose/cpp-httplib)** (Licencia MIT) — Servidor HTTP de alto rendimiento y bajo footprint.
- **[libwebp](https://chromium.googlesource.com/webm/libwebp)** (Licencia BSD-3-Clause de Google) — El motor de codificación y decodificación WebP estándar de la industria.

## 📄 Licencia

```
MIT License
Copyright (c) 2025
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
