import { wireDropzone, registerPasteTarget, formatBytes, download, baseName, loadSettings, saveSettings } from "../ui.js";

// Decodifica en el navegador formatos modernos (AVIF, BMP, GIF…) y los re-codifica
// en canvas a WebP/PNG/JPEG. No depende de libavif ni del backend: cero dependencias.
export function mount(root, ctx) {
  const { t } = ctx;
  let currentFile = null;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <p class="note" style="margin-top:0;">${t("imageformat.note")}</p>
      <div class="form-row">
        <div><label class="field">${t("common.format")}</label>
          <select id="fmt"><option value="image/webp">WebP</option><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></div>
        <div><label class="field">${t("common.quality")}</label>
          <div class="row-between"><input type="range" id="q" min="5" max="100" value="85"><span class="badge ok" id="qv">85%</span></div></div>
      </div>
      <div class="row-between"><span class="note" id="srcInfo"></span>
        <button class="btn btn-primary" id="go">${t("common.process")}</button></div>
    </div>
    <div id="result" style="margin-top:1.25rem;"></div>`;

  const q = root.querySelector("#q");
  const fmt = root.querySelector("#fmt");
  q.addEventListener("input", () => (root.querySelector("#qv").textContent = `${q.value}%`));

  const saved = loadSettings("imageformat", {});
  if (saved.fmt) fmt.value = saved.fmt;
  if (saved.q) q.value = saved.q;
  root.querySelector("#qv").textContent = `${q.value}%`;

  function handleFile(file) {
    if (!file) return;
    currentFile = file;
    root.querySelector("#cfg").style.display = "block";
    root.querySelector("#dz").textContent = file.name;
    root.querySelector("#srcInfo").textContent = `${file.type || t("imageformat.unknown")} · ${formatBytes(file.size)}`;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([f]) => handleFile(f));
  const unregisterPaste = registerPasteTarget(handleFile);

  root.querySelector("#go").addEventListener("click", () => {
    if (!currentFile) return;
    saveSettings("imageformat", { fmt: fmt.value, q: q.value });
    const out = root.querySelector("#result");
    out.innerHTML = `<div class="panel"><span class="badge warn">${t("common.processing")}</span></div>`;
    const url = URL.createObjectURL(currentFile);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      // PNG no usa calidad; WebP/JPEG sí.
      const quality = fmt.value === "image/png" ? undefined : Number(q.value) / 100;
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob || blob.type !== fmt.value) {
            out.innerHTML = `<div class="panel"><span class="badge err">${t("imageformat.unsupported")}</span></div>`;
            return;
          }
          const ext = fmt.value === "image/webp" ? "webp" : fmt.value === "image/png" ? "png" : "jpg";
          const dlUrl = URL.createObjectURL(blob);
          out.innerHTML = `
            <div class="panel">
              <div class="row-between">
                <span class="badge ok">${ext.toUpperCase()} · ${formatBytes(blob.size)}</span>
                <button class="btn-sm" id="dl">${t("common.download")}</button>
              </div>
              <div style="margin-top:0.75rem; text-align:center;">
                <img src="${dlUrl}" class="preview" style="max-height:220px; display:inline-block;" alt="">
              </div>
            </div>`;
          out.querySelector("#dl").addEventListener("click", () =>
            download(dlUrl, `${baseName(currentFile.name)}.${ext}`)
          );
        },
        fmt.value,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      out.innerHTML = `<div class="panel"><span class="badge err">${t("imageformat.unsupported")}</span></div>`;
    };
    img.src = url;
  });

  return () => unregisterPaste();
}
