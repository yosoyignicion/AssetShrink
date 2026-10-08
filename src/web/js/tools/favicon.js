import { wireDropzone, postImage, registerPasteTarget, download, copyText, toast } from "../ui.js";
import { createZip } from "../zip.js";

const SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

// Empaqueta PNGs como un .ico (contenedor ICO con payload PNG, soportado por Windows Vista+).
function icoChunks(pngs, sizes) {
  const count = pngs.length;
  const header = new Uint8Array(6 + 16 * count);
  const view = new DataView(header.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);
  let offset = header.length;
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    const s = sizes[i];
    header[base] = s >= 256 ? 0 : s;
    header[base + 1] = s >= 256 ? 0 : s;
    view.setUint16(base + 4, 1, true);
    view.setUint16(base + 6, 32, true);
    view.setUint32(base + 8, pngs[i].length, true);
    view.setUint32(base + 12, offset, true);
    offset += pngs[i].length;
  }
  return [header, ...pngs];
}

export function mount(root, ctx) {
  const { t } = ctx;
  let currentFile = null;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <div class="row-between">
        <span class="note">16 · 32 · 48 · 64 · 128 · 180 · 192 · 512 px + favicon.ico</span>
        <div class="presets">
          <button class="btn btn-ghost" id="paste">📋 ${t("favicon.paste")}</button>
          <button class="btn btn-primary" id="go">${t("common.generate")}</button>
        </div>
      </div>
    </div>
    <div id="result" style="margin-top:1.25rem;"></div>`;

  function handleFile(file) {
    if (!file) return;
    currentFile = file;
    root.querySelector("#cfg").style.display = "block";
    root.querySelector("#dz").textContent = file.name;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([f]) => handleFile(f));
  const unregisterPaste = registerPasteTarget(handleFile);

  // Lectura explícita del portapapeles (además del pegado global con Ctrl+V).
  root.querySelector("#paste").addEventListener("click", async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((tp) => tp.startsWith("image/"));
        if (type) {
          handleFile(new File([await it.getType(type)], "clipboard.png", { type }));
          return;
        }
      }
      toast(t("favicon.noClipboard"));
    } catch {
      toast(t("favicon.noClipboard"));
    }
  });

  root.querySelector("#go").addEventListener("click", async () => {
    if (!currentFile) return;
    const out = root.querySelector("#result");
    out.innerHTML = `<div class="panel"><span class="badge warn">${t("common.processing")}</span></div>`;
    try {
      // Genera los 8 tamaños en paralelo (una petición por tamaño al motor nativo).
      const items = await Promise.all(
        SIZES.map(async (size) => ({
          size,
          blob: await postImage("/api/resize", currentFile, { w: size, h: size, format: "png" })
        }))
      );
      const urls = items.map((it) => ({ size: it.size, url: URL.createObjectURL(it.blob) }));
      const icoPngs = await Promise.all(
        [16, 32, 48].map(async (s) => new Uint8Array(await items.find((i) => i.size === s).blob.arrayBuffer()))
      );
      const icoBlob = () => new Blob(icoChunks(icoPngs, [16, 32, 48]), { type: "image/x-icon" });

      const manifest = `{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}`;
      const snippet = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">`;

      out.innerHTML = `
        <div class="panel">
          <div class="swatches" style="align-items:flex-end;">
            ${urls
              .map(
                (u) => `<div style="text-align:center;">
                  <img src="${u.url}" width="${Math.min(u.size, 96)}" height="${Math.min(u.size, 96)}" style="background:#fff; border:1px solid var(--border); border-radius:8px;">
                  <div class="note">${u.size}px</div>
                </div>`
              )
              .join("")}
          </div>
          <div class="presets" style="margin-top:1rem;">
            <button class="btn-sm" id="dlIco">favicon.ico</button>
            <button class="btn-sm" id="dlZip">${t("common.download")} PNG (ZIP)</button>
          </div>
        </div>
        <div class="panel">
          <div class="row-between"><label class="field" style="margin:0;">manifest.json</label><button class="btn-sm ghost" id="cpManifest">${t("common.copy")}</button></div>
          <div class="result-box mono" id="manifest" style="max-height:none;">${manifest.replace(/</g, "&lt;")}</div>
          <div class="row-between" style="margin-top:1rem;"><label class="field" style="margin:0;">HTML</label><button class="btn-sm ghost" id="cpSnippet">${t("common.copy")}</button></div>
          <div class="result-box mono" style="max-height:none;">${snippet.replace(/</g, "&lt;")}</div>
        </div>`;

      out.querySelector("#dlIco").addEventListener("click", () => download(icoBlob(), "favicon.ico"));
      out.querySelector("#dlZip").addEventListener("click", async () => {
        const files = [];
        for (const it of items) {
          const name = it.size === 180 ? "apple-touch-icon.png" : `icon-${it.size}.png`;
          files.push({ name, data: new Uint8Array(await it.blob.arrayBuffer()) });
        }
        files.push({ name: "favicon.ico", data: new Uint8Array(await icoBlob().arrayBuffer()) });
        download(createZip(files), "favicons.zip");
        toast(`${files.length} archivos`);
      });
      out.querySelector("#cpManifest").addEventListener("click", () => copyText(manifest));
      out.querySelector("#cpSnippet").addEventListener("click", () => copyText(snippet));
    } catch (e) {
      out.innerHTML = `<div class="panel"><span class="badge err">${t("common.error")}</span> ${e.message}</div>`;
    }
  });

  return () => unregisterPaste();
}
