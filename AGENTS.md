# AssetShrink — Agent Guide

## Build

```bash
# Prerequisites (Linux):
sudo apt install cmake build-essential libwebp-dev pkg-config

# macOS:
brew install webp pkg-config

# Build & run:
cmake -B build && cmake --build build
./build/AssetShrink
```

Launches web UI at `http://localhost:8080` (auto-opens browser).

## Architecture

- **Single file**: all C++ backend + embedded HTML/CSS/JS frontend live in `main.cpp` (613 lines). No separate frontend files.
- Input images via browser drag-and-drop; `POST /convert` processes them server-side.
- Dependencies: `libwebp` (system), `cpp-httplib` + `stb` (CMake FetchContent, auto-fetched at build time).

## Conventions

- `input/` and `output/` dirs exist as empty placeholders (not referenced by code).
- `releases/` contains pre-built binaries.

## CI

- `.github/workflows/build.yml` — builds on push/PR to `main` (ubuntu, macos, windows), uploads artifact.

## No tests / No lint / No formatter
