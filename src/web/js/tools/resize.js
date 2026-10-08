import { formatBytes, download, baseName, wireDropzone, postImage, registerPasteTarget } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;
  let currentFile = null;
  let natW = 0;
  let natH = 0;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <div class="form-row">
        <div>
          <label class="field">${t("resize.w")}</label>
          <input type="number" id="w" min="1">
        </div>
        <div>
          <label class="field">${t("resize.h")}</label>
          <input type="number" id="h" min="1">
        </div>
        <div>
          <label class="field">${t("resize.pct")}</label>
          <input type="number" id="pct" min="1" max="400" placeholder="—">
        </div>
      </div>
      <div class="form-row">
        <div>
          <label class="field">${t("common.format")}</label>
          <select id="fmt">
            <option value="webp">WebP</option>
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
          </select>
        </div>
        <div>
          <label class="field">${t("common.quality")}</label>
          <div class="row-between"><input type="range" id="q" min="5" max="100" value="85"><span class="badge ok" id="qv">85%</span></div>
        </div>
      </div>
      <div class="row-between">
        <label class="note"><input type="checkbox" id="lock" checked> ${t("resize.keep")}</label>
        <button class="btn btn-primary" id="go">${t("common.process")}</button>
      </div>
      <div style="margin-top:1rem;">
        <label class="field">${t("resize.presets")}</label>
        <div class="presets">
          <button class="chip" data-preset="original">${t("resize.original")}</button>
          <button class="chip" data-w="1200" data-h="630">OG 1200×630</button>
          <button class="chip" data-w="1080" data-h="1080">IG 1080</button>
          <button class="chip" data-w="1600" data-h="900">X 1600×900</button>
          <button class="chip" data-w="1920" data-h="1080">HD 1920×1080</button>
          <button class="chip" data-w="512" data-h="512">Favicon 512</button>
        </div>
      </div>
    </div>
    <div id="result" style="margin-top:1.25rem;"></div>`;

  const w = root.querySelector("#w");
  const h = root.querySelector("#h");
  const pct = root.querySelector("#pct");
  const lock = root.querySelector("#lock");
  const q = root.querySelector("#q");
  const qv = root.querySelector("#qv");

  q.addEventListener("input", () => (qv.textContent = `${q.value}%`));

  w.addEventListener("input", () => {
    if (lock.checked && natW) h.value = Math.round((w.value / natW) * natH);
  });
  h.addEventListener("input", () => {
    if (lock.checked && natH) w.value = Math.round((h.value / natH) * natW);
  });
  pct.addEventListener("input", () => {
    if (!pct.value || !natW) return;
    w.value = Math.round((natW * pct.value) / 100);
    h.value = Math.round((natH * pct.value) / 100);
  });
  root.querySelectorAll("[data-preset], [data-w]").forEach((chip) =>
    chip.addEventListener("click", () => {
      root.querySelectorAll(".presets .chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      lock.checked = false;
      pct.value = "";
      if (chip.dataset.preset === "original") {
        w.value = natW || "";
        h.value = natH || "";
      } else {
        w.value = chip.dataset.w;
        h.value = chip.dataset.h;
      }
    })
  );

  function handleFile(file) {
    if (!file) return;
    currentFile = file;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      natW = img.naturalWidth;
      natH = img.naturalHeight;
      w.value = natW;
      h.value = natH;
      pct.value = "";
      root.querySelector("#cfg").style.display = "block";
      root.querySelector("#dz").textContent = `${file.name} · ${natW}×${natH} (${formatBytes(file.size)})`;
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([file]) => handleFile(file));
  const unregisterPaste = registerPasteTarget(handleFile);

  root.querySelector("#go").addEventListener("click", async () => {
    if (!currentFile) return;
    const params = { format: root.querySelector("#fmt").value, quality: q.value };
    if (pct.value) params.percent = pct.value;
    else {
      params.w = w.value;
      params.h = h.value;
    }
    const out = root.querySelector("#result");
    out.innerHTML = `<div class="panel"><span class="badge warn">${t("common.processing")}</span></div>`;
    try {
      const blob = await postImage("/api/resize", currentFile, params);
      const ext = params.format === "png" ? "png" : params.format === "jpg" ? "jpg" : "webp";
      const url = URL.createObjectURL(blob);
      out.innerHTML = `
        <div class="panel">
          <div class="row-between" style="margin-bottom:1rem;">
            <span>${formatBytes(blob.size)} · ${w.value}×${h.value}</span>
            <button class="btn-sm" id="dl">${t("common.download")}</button>
          </div>
          <img class="preview" src="${url}" alt="result">
        </div>`;
      out.querySelector("#dl").addEventListener("click", () =>
        download(url, `${baseName(currentFile.name)}-${w.value}x${h.value}.${ext}`)
      );
    } catch (e) {
      out.innerHTML = `<div class="panel"><span class="badge err">${t("common.error")}</span> ${e.message}</div>`;
    }
  });

  return () => unregisterPaste();
}
