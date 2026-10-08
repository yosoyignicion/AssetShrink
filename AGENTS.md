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

Launches the web UI at `http://localhost:8080` (auto-opens browser, picks first free port in 8080–8089).

## Verify

```bash
scripts/smoke.sh            # arranca el binario y valida todos los endpoints
scripts/check_i18n.sh       # comprueba que toda clave t("...") exista en ES y EN
```

## Architecture

- **Single binary, offline‑first.** The C++ backend plus the whole frontend are compiled into one executable.
- **Frontend** (`src/web/`): vanilla‑JS SPA (ES modules, History‑API router). `index.html` + `css/app.css` + `js/app.js` (nav/router/palette/themes/settings) + `js/tools.js` (manifest, 35 tools) + `js/i18n.js` (ES/EN) + `js/ui.js` + `js/zip.js` (ZIP sin dependencias) + one module per tool in `js/tools/`. PWA: `manifest.webmanifest` (shortcuts + iconos PNG/SVG), `sw.js` (network‑first), `icon.svg`. Iconos PWA generados con `scripts/gen_icons.py`. Meta SEO por ruta en `seo.txt` (inyectada por el servidor).
- **Assets are embedded at build time** by `cmake/embed_assets.cmake` (`file(READ ... HEX)` → `assets_generated.cpp`). No Python, no extra deps. Served from memory; adding/editing files in `src/web/` triggers re‑embedding automatically.
- **Backend core** (`src/core/`): `image_io` (stb + stb_image_resize2 + WebP, single impl TU), `assets` (embedded asset lookup + MIME).
- **Tools** (`src/tools/`): `optimize`, `resize`, `palette`, `beautify`, `qr`. Each exposes `register_<tool>(httplib::Server&)`, called from `src/main.cpp`. Public header: `src/tools/tools.h`.
- **Vendored**: `third_party/qrcodegen.cpp/.hpp` (Nayuki, MIT) for QR generation.
- Dependencies: `libwebp` (system), `cpp-httplib` + `stb` (CMake FetchContent, auto‑fetched).

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/convert` | Compress/convert (`quality`, `lossless`, `format`) |
| POST | `/api/resize` | Resize (`w`, `h`, `percent`, `format`, `quality`) |
| POST | `/api/palette` | Dominant colors (`count`) → JSON |
| POST | `/api/beautify` | Padding/shadow/rounded corners (`pad`, `radius`, `bgTop`, `bgBottom`, `shadow`) |
| GET | `/api/qr` | QR code (`text`, `size`, `ecc`, `margin`, `format=png\|svg`) |

## Conventions

- Do not add comments unless they explain non‑obvious intent (the codebase mixes ES/EN comments).
- Keep the frontend dependency‑free (no bundler, no CDN); it must work offline.
- All user‑facing strings must go through `t("key")` and be defined in both the `es` and `en` dictionaries of `i18n.js` (run `scripts/check_i18n.sh`).
- Per‑tool preferences use `loadSettings(id, defaults)` / `saveSettings(id, obj)` from `ui.js` (stored under `as:set:` and exportable).
- New tools: add a module in `src/web/js/tools/`, register it in `src/web/js/tools.js`, add a `seo.txt` line, and (if it needs the backend) a `register_*` in `src/tools/`.
- `input/` and `output/` are empty placeholders, unreferenced by code.

## CI

- `.github/workflows/build.yml` — builds on push/PR to `main` (ubuntu, macos, windows), uploads artifact.

## Lint / Formatter

None configured.
