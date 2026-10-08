import { formatBytes, copyText, download, wireDropzone } from "../ui.js";

function minifySvg(input) {
  let s = input;
  s = s.replace(/<\?xml[\s\S]*?\?>/g, "");
  s = s.replace(/<!DOCTYPE[\s\S]*?>/gi, "");
  // Elimina comentarios salvo condicionales de IE.
  s = s.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");
  // Solo colapsa el espacio *entre* etiquetas; nunca dentro de nodos de texto (evita corromper contenido).
  s = s.replace(/>\s+</g, "><");
  s = s.replace(/\s+\/>/g, "/>");
  return s.trim();
}

function isValidSvg(svg) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  return !doc.querySelector("parsererror");
}

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="row-between">
        <label class="field" style="margin:0;">SVG</label>
        <div class="presets">
          <button class="chip" id="pick">${t("svg.file")}</button>
          <button class="btn btn-primary" id="go">${t("common.process")}</button>
        </div>
      </div>
      <input type="file" id="fi" accept=".svg,image/svg+xml" hidden>
      <textarea id="in" class="mono" style="min-height:180px;" placeholder="&lt;svg …&gt;…&lt;/svg&gt;" aria-label="SVG"></textarea>
    </div>
    <div class="panel">
      <div class="row-between"><label class="field" style="margin:0;">${t("common.output")}</label><span id="summary" class="note">—</span></div>
      <textarea id="out" class="mono result-box" readonly style="min-height:160px;"></textarea>
      <div class="presets" style="margin-top:0.75rem;">
        <button class="chip" id="copy">${t("common.copy")}</button>
        <button class="chip" id="dl">${t("common.download")}</button>
      </div>
    </div>`;

  const input = root.querySelector("#in");
  const out = root.querySelector("#out");
  const summary = root.querySelector("#summary");

  function loadSvgFile(file) {
    if (!file) return;
    file.text().then((text) => {
      input.value = text;
      optimize();
    });
  }

  wireDropzone(root.querySelector("#pick"), root.querySelector("#fi"), ([file]) => loadSvgFile(file));

  // Captura el drop de SVG antes del handler global (que enruta imágenes raster al optimizador).
  const isSvg = (file) => file && (file.type === "image/svg+xml" || /\.svg$/i.test(file.name));
  const onDropCapture = (e) => {
    const file = [...(e.dataTransfer?.files || [])].find(isSvg);
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    loadSvgFile(file);
  };
  document.addEventListener("drop", onDropCapture, true);

  function optimize() {
    const src = input.value;
    if (!src.trim()) return;
    if (!isValidSvg(src)) {
      summary.innerHTML = `<span class="badge err">${t("svg.invalid")}</span>`;
      out.value = "";
      return;
    }
    const min = minifySvg(src);
    const saved = src.length ? Math.max(0, ((src.length - min.length) / src.length) * 100).toFixed(0) : 0;
    out.value = min;
    summary.innerHTML = `<span class="badge ok">${formatBytes(src.length)} → ${formatBytes(min.length)} · -${saved}%</span>`;
  }

  root.querySelector("#go").addEventListener("click", optimize);
  root.querySelector("#copy").addEventListener("click", () => copyText(out.value));
  root.querySelector("#dl").addEventListener("click", () =>
    download(new Blob([out.value], { type: "image/svg+xml" }), "optimized.svg")
  );

  return () => document.removeEventListener("drop", onDropCapture, true);
}
