# AssetShrink — Agent Guide

## Build

```bash
# Linux
sudo apt install cmake build-essential libwebp-dev pkg-config
# macOS
brew install webp pkg-config

cmake -B build && cmake --build build
./build/AssetShrink
```

Launches web UI at `http://localhost:8080` (auto-opens browser). Port falls back through 8080–8089 if busy. `--version` / `-v` prints version.

## Architecture

- **Single source file**: `main.cpp` (630 lines) — C++ backend + embedded HTML/CSS/JS frontend (no separate frontend files).
- `POST /convert?quality=N&lossless=true|false&format=webp|png|jpg` accepts multipart `image` field.
- Image formats: WebP ↔ PNG ↔ JPEG, all in-memory via stb + libwebp.

## Dependencies

| Package | Source |
|---------|--------|
| libwebp | system package (`libwebp-dev` / `brew install webp`) |
| stb + cpp-httplib | CMake FetchContent (auto-downloaded at build) |

## Directory layout

| Path | Purpose |
|------|---------|
| `main.cpp` | Everything |
| `src/` | README images only (logo, demo gif) — not source code |
| `archive/` | Old pre-built binaries (not referenced by code) |
| `input/`, `output/` | Unused placeholders |
| `releases/` | Current pre-built binaries |
| `config.h.in` | CMake generates → `build/config.h` with `PROJECT_VERSION` (single source: `CMakeLists.txt:2`) |

## Build quirks

- **macOS**: libwebp searched in `/opt/homebrew` (ARM64) and `/usr/local` (x86) — no `pkg-config`.
- **Windows CI**: requires `-DCMAKE_TOOLCHAIN_FILE` pointing to vcpkg for `libwebp:x64-windows`.
- C++17 required, CMake ≥ 3.15.

## CI

`.github/workflows/build.yml` — on push/PR to `main`, matrix: ubuntu / macos / windows, uploads artifact.

## No tests / No lint / No formatter

License: MIT.
