import { wireDropzone, registerPasteTarget, download, baseName, formatBytes, toast } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;
  let img = null;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <div class="form-row">
        <div><label class="field">${t("watermark.text")}</label><input type="text" id="text" value="© AssetShrink"></div>
        <div><label class="field">${t("watermark.position")}</label>
          <select id="pos">
            <option value="tl">↖</option><option value="tc">↑</option><option value="tr">↗</option>
            <option value="ml">←</option><option value="mc" selected>•</option><option value="mr">→</option>
            <option value="bl">↙</option><option value="bc">↓</option><option value="br">↘</option>
          </select></div>
      </div>
      <div class="form-row">
        <div><label class="field">${t("watermark.size")}</label>
          <div class="row-between"><input type="range" id="size" min="2" max="30" value="6"><span class="badge ok" id="sizev">6%</span></div></div>
        <div><label class="field">${t("shadow.opacity")}</label>
          <div class="row-between"><input type="range" id="opacity" min="5" max="100" value="60"><span class="badge ok" id="opacityv">60%</span></div></div>
        <div><label class="field">${t("watermark.rotate")}</label>
          <div class="row-between"><input type="range" id="rotate" min="-90" max="90" value="0"><span class="badge ok" id="rotatev">0°</span></div></div>
      </div>
      <div class="form-row">
        <div><label class="field">${t("shadow.color")}</label><input type="color" id="color" value="#ffffff"></div>
        <div><label class="field">${t("watermark.tile")}</label><label class="note"><input type="checkbox" id="tile"> ${t("watermark.tileOn")}</label></div>
      </div>
      <div class="row-between" style="margin-top:0.5rem;">
        <span class="note" id="dims"></span>
        <button class="btn btn-primary" id="dl">${t("common.download")}</button>
      </div>
      <canvas id="canvas" style="max-width:100%; display:block; margin-top:1rem; border-radius:12px; border:1px solid var(--border);"></canvas>
    </div>`;

  const canvas = root.querySelector("#canvas");
  const cctx = canvas.getContext("2d");
  const ids = ["text", "pos", "size", "opacity", "rotate", "color", "tile"];

  function handleFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      img = im;
      root.querySelector("#cfg").style.display = "block";
      root.querySelector("#dz").textContent = `${file.name} · ${formatBytes(file.size)}`;
      root.querySelector("#dims").textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
      draw();
      URL.revokeObjectURL(url);
    };
    im.onerror = () => { URL.revokeObjectURL(url); toast(t("crop.loadError")); };
    im.src = url;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([f]) => handleFile(f));
  const unregisterPaste = registerPasteTarget(handleFile);

  function draw() {
    if (!img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    cctx.drawImage(img, 0, 0);
    const size = (Number(root.querySelector("#size").value) / 100) * canvas.width;
    const alpha = Number(root.querySelector("#opacity").value) / 100;
    const rot = (Number(root.querySelector("#rotate").value) * Math.PI) / 180;
    const text = root.querySelector("#text").value;
    cctx.font = `700 ${size}px system-ui, sans-serif`;
    cctx.fillStyle = root.querySelector("#color").value;
    cctx.globalAlpha = alpha;
    cctx.textBaseline = "middle";
    cctx.textAlign = "center";
    const pad = size * 0.8;

    if (root.querySelector("#tile").checked) {
      // Patrón diagonal repetido cubriendo toda la imagen.
      const step = size * 6;
      cctx.save();
      cctx.rotate(rot);
      for (let y = -canvas.height; y < canvas.height * 2; y += step) {
        for (let x = -canvas.width; x < canvas.width * 2; x += step) cctx.fillText(text, x, y);
      }
      cctx.restore();
    } else {
      const pos = root.querySelector("#pos").value;
      const x = pos[1] === "l" ? pad : pos[1] === "c" ? canvas.width / 2 : canvas.width - pad;
      const y = pos[0] === "t" ? pad : pos[0] === "m" ? canvas.height / 2 : canvas.height - pad;
      cctx.save();
      cctx.translate(x, y);
      cctx.rotate(rot);
      cctx.fillText(text, 0, 0);
      cctx.restore();
    }
    cctx.globalAlpha = 1;
    root.querySelector("#sizev").textContent = root.querySelector("#size").value + "%";
    root.querySelector("#opacityv").textContent = root.querySelector("#opacity").value + "%";
    root.querySelector("#rotatev").textContent = root.querySelector("#rotate").value + "°";
  }

  ids.forEach((id) => root.querySelector("#" + id).addEventListener("input", draw));

  root.querySelector("#dl").addEventListener("click", () => {
    if (!img) return;
    canvas.toBlob((blob) => {
      const name = baseName(document.querySelector("#dz").textContent.split(" ·")[0]);
      download(blob, `${name}-watermark.png`);
    }, "image/png");
  });

  return () => unregisterPaste();
}
