import { wireDropzone, registerPasteTarget, download, baseName, formatBytes, toast } from "../ui.js";

// Editor de recorte: carga la imagen en un canvas de trabajo (con rotación/volteo ya
// aplicados), permite dibujar una selección con el ratón y exporta el recorte.
export function mount(root, ctx) {
  const { t } = ctx;
  let img = null;
  let angle = 0; // 0/90/180/270
  let flipH = false;
  let flipV = false;
  let work = null; // canvas con rotación/volteo aplicados
  let sel = null; // selección en coordenadas del canvas de trabajo {x,y,w,h}
  let drag = null;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <div class="presets">
        <button class="chip" id="rotL">⟲ 90°</button>
        <button class="chip" id="rotR">⟳ 90°</button>
        <button class="chip" id="flipH">↔ ${t("crop.flipH")}</button>
        <button class="chip" id="flipV">↕ ${t("crop.flipV")}</button>
        <button class="chip" id="reset">${t("common.reset")}</button>
      </div>
      <p class="note" style="margin:0.6rem 0;">${t("crop.hint")}</p>
      <div style="position:relative; display:inline-block; max-width:100%;">
        <canvas id="canvas" style="max-width:100%; display:block; border-radius:12px; border:1px solid var(--border); cursor:crosshair;"></canvas>
      </div>
      <div class="row-between" style="margin-top:0.75rem;">
        <span class="note" id="selInfo"></span>
        <button class="btn btn-primary" id="dl">${t("common.download")} PNG</button>
      </div>
    </div>`;

  const canvas = root.querySelector("#canvas");
  const cctx = canvas.getContext("2d");

  function render() {
    if (!work) return;
    canvas.width = work.width;
    canvas.height = work.height;
    cctx.drawImage(work, 0, 0);
    if (sel) {
      // Oscurece todo menos la selección.
      cctx.save();
      cctx.fillStyle = "rgba(2,6,23,0.55)";
      cctx.fillRect(0, 0, canvas.width, canvas.height);
      cctx.clearRect(sel.x, sel.y, sel.w, sel.h);
      cctx.drawImage(work, sel.x, sel.y, sel.w, sel.h, sel.x, sel.y, sel.w, sel.h);
      cctx.strokeStyle = "#6366f1";
      cctx.lineWidth = Math.max(1, canvas.width / 400);
      cctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
      cctx.restore();
      root.querySelector("#selInfo").textContent = `${Math.round(sel.w)} × ${Math.round(sel.h)} px`;
    } else {
      root.querySelector("#selInfo").textContent = "";
    }
  }

  function buildWork() {
    if (!img) return;
    const swap = angle === 90 || angle === 270;
    const w = swap ? img.naturalHeight : img.naturalWidth;
    const h = swap ? img.naturalWidth : img.naturalHeight;
    work = document.createElement("canvas");
    work.width = w;
    work.height = h;
    const c = work.getContext("2d");
    c.translate(w / 2, h / 2);
    c.rotate((angle * Math.PI) / 180);
    c.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    c.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    sel = null;
    render();
  }

  function handleFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      img = im;
      angle = 0; flipH = false; flipV = false;
      root.querySelector("#cfg").style.display = "block";
      root.querySelector("#dz").textContent = `${file.name} · ${formatBytes(file.size)}`;
      buildWork();
      URL.revokeObjectURL(url);
    };
    im.onerror = () => { URL.revokeObjectURL(url); toast(t("crop.loadError")); };
    im.src = url;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([f]) => handleFile(f));
  const unregisterPaste = registerPasteTarget(handleFile);

  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height
    };
  };
  canvas.addEventListener("mousedown", (e) => {
    drag = { ...toCanvas(e), move: false };
  });
  window.addEventListener("mousemove", (e) => {
    if (!drag) return;
    const p = toCanvas(e);
    drag.move = true;
    sel = {
      x: Math.max(0, Math.min(drag.x, p.x)),
      y: Math.max(0, Math.min(drag.y, p.y)),
      w: Math.min(canvas.width, Math.abs(p.x - drag.x)),
      h: Math.min(canvas.height, Math.abs(p.y - drag.y))
    };
    render();
  });
  window.addEventListener("mouseup", () => (drag = null));

  root.querySelector("#rotL").addEventListener("click", () => { angle = (angle + 270) % 360; buildWork(); });
  root.querySelector("#rotR").addEventListener("click", () => { angle = (angle + 90) % 360; buildWork(); });
  root.querySelector("#flipH").addEventListener("click", () => { flipH = !flipH; buildWork(); });
  root.querySelector("#flipV").addEventListener("click", () => { flipV = !flipV; buildWork(); });
  root.querySelector("#reset").addEventListener("click", () => { angle = 0; flipH = flipV = false; buildWork(); });

  root.querySelector("#dl").addEventListener("click", () => {
    if (!work) return;
    const area = sel && sel.w > 2 && sel.h > 2 ? sel : { x: 0, y: 0, w: work.width, h: work.height };
    const out = document.createElement("canvas");
    out.width = Math.round(area.w);
    out.height = Math.round(area.h);
    out.getContext("2d").drawImage(work, area.x, area.y, area.w, area.h, 0, 0, out.width, out.height);
    out.toBlob((blob) => {
      const name = img ? baseName(document.querySelector("#dz").textContent.split(" ·")[0]) : "crop";
      download(blob, `${name}-crop.png`);
    }, "image/png");
  });

  return () => unregisterPaste();
}
