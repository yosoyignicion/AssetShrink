import { wireDropzone, copyText, registerPasteTarget } from "../ui.js";

function toHex(r, g, b) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function mount(root, ctx) {
  const { t } = ctx;
  const history = [];

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="grid-2" id="stage" style="display:none; margin-top:1.25rem;">
      <div class="panel" style="overflow:auto;">
        <canvas id="canvas" style="max-width:100%; cursor:crosshair; border-radius:12px; border:1px solid var(--border); display:block;"></canvas>
        <p class="note" style="margin:0.5rem 0 0;">${t("eyedropper.pickHint")}</p>
      </div>
      <div class="panel">
        <div class="row-between"><label class="field" style="margin:0;">${t("common.output")}</label>
          <button class="btn-sm ghost" id="copy" disabled>${t("common.copy")}</button></div>
        <div id="current" class="result-box mono" style="text-align:center;">—</div>
        <label class="field" style="margin-top:1rem;">${t("eyedropper.history")}</label>
        <div class="swatches" id="history"></div>
      </div>
    </div>`;

  const canvas = root.querySelector("#canvas");
  const ctx2d = canvas.getContext("2d", { willReadFrequently: true });
  let previewUrl = null;

  function handleFile(file) {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx2d.drawImage(img, 0, 0);
      root.querySelector("#stage").style.display = "grid";
      root.querySelector("#dz").textContent = file.name;
    };
    img.src = previewUrl;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([f]) => handleFile(f));
  const unregisterPaste = registerPasteTarget(handleFile);

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const data = ctx2d.getImageData(x, y, 1, 1).data;
    const hex = toHex(data[0], data[1], data[2]);
    const rgb = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
    const cur = root.querySelector("#current");
    cur.innerHTML = `<div style="height:36px; border-radius:8px; background:${hex}; margin-bottom:0.5rem; border:1px solid var(--border);"></div>${hex} · ${rgb}`;
    const copy = root.querySelector("#copy");
    copy.disabled = false;
    copy.onclick = () => copyText(hex);

    history.unshift(hex);
    history.splice(12);
    root.querySelector("#history").innerHTML = history
      .map((h) => `<div class="swatch" data-hex="${h}" style="background:${h}; min-width:72px; padding:0.5rem; cursor:pointer;">${h}</div>`)
      .join("");
    root.querySelectorAll("#history .swatch").forEach((el) =>
      el.addEventListener("click", () => copyText(el.dataset.hex))
    );
  });

  return () => {
    unregisterPaste();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };
}
