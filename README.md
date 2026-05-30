```
                    ╔══════════════════════════════════╗
                    ║          ASSETSHRINK             ║
                    ║    ⚡ C++17 · WebP · Local ⚡    ║
                    ╚══════════════════════════════════╝

     █████╗  ██████╗ ███████╗███████╗████████╗███████╗██╗  ██╗██████╗ ██╗███╗   ██╗██╗  ██╗
    ██╔══██╗██╔════╝ ██╔════╝██╔════╝╚══██╔══╝██╔════╝██║  ██║██╔══██╗██║████╗  ██║██║ ██╔╝
    ███████║██║  ███╗███████╗███████╗   ██║   ███████╗███████║██████╔╝██║██╔██╗ ██║█████╔╝
    ██╔══██║██║   ██║╚════██║╚════██║   ██║   ╚════██║██╔══██║██╔══██╗██║██║╚██╗██║██╔═██╗
    ██║  ██║╚██████╔╝███████║███████║   ██║   ███████║██║  ██║██║  ██║██║██║ ╚████║██║  ██╗
    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝

```

# AssetShrink

**Compresor local de imágenes a WebP ultra-rápido y privado mediante C++17.**

![Badge](https://img.shields.io/badge/C%2B%2B-17-00599C?logo=cplusplus)
![Badge](https://img.shields.io/badge/WebP-Optimizado-8A2BE2)
![Badge](https://img.shields.io/badge/Licencia-MIT-green)
![Badge](https://img.shields.io/badge/CI_Passing-ubuntu_|_macOS_|_windows-4CAF50)

---

## Características clave

- **100% Local y Privado** — Los datos nunca salen de tu ordenador. Sin telemetría, sin subidas a la nube.
- **Velocidad nativa de C++ y optimización de Google WebP** — Rendimiento máximo combinado con el mejor códec de compresión con pérdida.
- **Comparador interactivo split-screen** — Desliza para ver original vs comprimido en tiempo real. Ajusta la calidad y el modo lossless al instante.
- **Sin suscripciones, sin servidores externos** — Un binario, una máquina, sin dependencias de terceros en ejecución.
- **Multiplataforma** — Compilado y probado en Linux, macOS y Windows via CI/CD.

## Requisitos previos

- Compilador con soporte C++17 (GCC >= 7, Clang >= 5)
- CMake >= 3.15
- `libwebp-dev` (en sistemas Linux)

```bash
# Debian / Ubuntu
sudo apt install build-essential cmake pkg-config libwebp-dev

# Arch Linux
sudo pacman -S base-devel cmake libwebp

# Fedora
sudo dnf install gcc-c++ cmake pkgconfig libwebp-devel
```

## Instrucciones de compilación

```bash
cmake -B build
cmake --build build
```

## Cómo usar

Ejecuta el binario generado:

```bash
./build/AssetShrink
```

El servidor se inicia y el navegador se abre automáticamente en `http://localhost:8080`. Arrastra cualquier imagen PNG, JPG o JPEG y se comprimirá al instante a formato WebP. Usa el comparador visual para ver la diferencia, ajusta la calidad con el deslizador o activa el modo lossless para compresión sin pérdida.

## Tecnologías integradas

- **stb** — Librería *header-only* para decodificación de imágenes (dominio público).
- **cpp-httplib** — Servidor HTTP ligero con licencia MIT.
- **libwebp** — Códec de compresión WebP de Google (licencia BSD).

## Licencia

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

### Atribuciones de terceros

- **[stb](https://github.com/nothings/stb)** por Sean Barrett — Dominio público.
- **[cpp-httplib](https://github.com/yhirose/cpp-httplib)** por Yuji Hirose — Licencia MIT.
- **[libwebp](https://chromium.googlesource.com/webm/libwebp)** por Google — Licencia BSD.
