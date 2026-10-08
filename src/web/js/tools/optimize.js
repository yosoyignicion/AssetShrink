import { formatBytes, download, baseName, wireDropzone, postImage, registerPasteTarget, toast, loadSettings, saveSettings } from "../ui.js";
import { createZip } from "../zip.js";

export function mount(root, ctx) {
  const { t } = ctx;
  let lossless = false;
  const results = [];

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div>
          <label class="field">${t("common.format")}</label>
          <select id="fmt">
            <option value="webp">${t("optimize.recommended")}</option>
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
          </select>
        </div>
        <div>
          <label class="field">${t("common.quality")}</label>
          <div class="row-between">
            <input type="range" id="q" min="5" max="100" value="78">
            <span class="badge ok" id="qv">78%</span>
          </div>
        </div>
      </div>
      <div class="presets">
        <button class="chip active" data-q="70">${t("optimize.web")}</button>
        <button class="chip" data-q="90">${t("optimize.photo")}</button>
        <button class="chip" data-lossless="1">${t("optimize.lossless")}</button>
      </div>
    </div>
    <div class="panel">
      <label class="field">${t("optimize.rename")}</label>
      <div class="form-row" style="margin-bottom:0;">
        <div><label class="field">${t("optimize.prefix")}</label><input type="text" id="rprefix" placeholder="img-"></div>
        <div><label class="field">${t("optimize.suffix")}</label><input type="text" id="rsuffix" placeholder="-web"></div>
        <div><label class="field">${t("optimize.start")}</label><input type="number" id="rstart" value="1" min="0"></div>
        <div><label class="field">${t("optimize.numbering")}</label><label class="note"><input type="checkbox" id="rnum"> 1,2,3…</label></div>
      </div>
    </div>
    <div class="dropzone" id="dz">${t("common.drop")}<br><span class="note">${t("optimize.paste")}</span></div>
    <input type="file" id="fi" accept="image/*" multiple hidden>
    <div id="compareWrap" style="margin-top:1.25rem;"></div>
    <div id="queueWrap"></div>`;

  const q = root.querySelector("#q");
  const qv = root.querySelector("#qv");
  const fmt = root.querySelector("#fmt");
  const chips = [...root.querySelectorAll(".chip")];
  const queueWrap = root.querySelector("#queueWrap");
  const compareWrap = root.querySelector("#compareWrap");

  // Persistencia de los ajustes preferidos del usuario (se incluyen en export/import).
  const persist = () =>
    saveSettings("optimize", {
      q: q.value,
      fmt: fmt.value,
      lossless,
      rprefix: root.querySelector("#rprefix").value,
      rsuffix: root.querySelector("#rsuffix").value,
      rstart: root.querySelector("#rstart").value,
      rnum: root.querySelector("#rnum").checked
    });

  const saved = loadSettings("optimize", { q: "78", fmt: "webp", lossless: false });
  q.value = saved.q;
  qv.textContent = `${q.value}%`;
  fmt.value = saved.fmt || "webp";
  lossless = !!saved.lossless;
  if (saved.lossless) qv.textContent = t("optimize.lossless");
  root.querySelector("#rprefix").value = saved.rprefix || "";
  root.querySelector("#rsuffix").value = saved.rsuffix || "";
  root.querySelector("#rstart").value = saved.rstart || "1";
  root.querySelector("#rnum").checked = !!saved.rnum;

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      if (chip.dataset.lossless) {
        lossless = true;
        qv.textContent = t("optimize.lossless");
      } else {
        lossless = false;
        q.value = chip.dataset.q;
        qv.textContent = `${q.value}%`;
      }
      persist();
    })
  );
  q.addEventListener("input", () => {
    lossless = false;
    chips.forEach((c) => c.classList.remove("active"));
    qv.textContent = `${q.value}%`;
    persist();
  });
  fmt.addEventListener("change", persist);
  ["#rprefix", "#rsuffix", "#rstart", "#rnum"].forEach((sel) =>
    root.querySelector(sel).addEventListener("change", persist)
  );

  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), (files) => {
    files.filter((f) => f.type.startsWith("image/")).forEach(process);
  });
  const unregisterPaste = registerPasteTarget((file) => {
    if (file && file.type.startsWith("image/")) process(file);
  });

  function renameFor(index, originalName, ext) {
    const prefix = root.querySelector("#rprefix").value;
    const suffix = root.querySelector("#rsuffix").value;
    const numbering = root.querySelector("#rnum").checked;
    const start = Number(root.querySelector("#rstart").value) || 0;
    const base = numbering ? String(start + index) : baseName(originalName);
    return `${prefix}${base}${suffix}.${ext}`;
  }

  function ensureQueueHeader() {
    if (queueWrap.querySelector("#queueHead")) return;
    const head = document.createElement("div");
    head.id = "queueHead";
    head.className = "row-between";
    head.style.margin = "1.25rem 0 0.5rem";
    head.innerHTML = `
      <h2 style="margin:0; font-size:1.1rem;">${t("common.output")}</h2>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn-sm ghost" id="clearBtn">${t("optimize.clear")}</button>
        <button class="btn-sm" id="zipBtn">⬇ ${t("optimize.zip")}</button>
      </div>`;
    queueWrap.appendChild(head);
    head.querySelector("#zipBtn").addEventListener("click", downloadZip);
    head.querySelector("#clearBtn").addEventListener("click", () => {
      queueWrap.querySelectorAll(".qrow").forEach((r) => r.remove());
      results.length = 0;
      compareWrap.innerHTML = "";
      queueWrap.querySelector("#queueHead")?.remove();
    });
  }

  function process(file) {
    ensureQueueHeader();
    const row = document.createElement("div");
    row.className = "panel qrow";
    row.style.padding = "0.9rem 1.1rem";
    row.style.cursor = "pointer";
    row.innerHTML = `
      <div class="row-between">
        <div style="min-width:0;">
          <div style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</div>
          <div class="note">${formatBytes(file.size)} → <span class="out">…</span></div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge warn">${t("common.processing")}</span>
          <button class="btn-sm" style="display:none;">${t("common.download")}</button>
        </div>
      </div>`;
    queueWrap.appendChild(row);

    const badge = row.querySelector(".badge");
    const outEl = row.querySelector(".out");
    const btn = row.querySelector(".btn-sm");
    const ext = fmt.value === "png" ? "png" : fmt.value === "jpg" ? "jpg" : "webp";
    const beforeUrl = URL.createObjectURL(file);
    const index = results.length;

    postImage("/api/convert", file, { quality: q.value, lossless, format: fmt.value })
      .then((blob) => {
        const saved = Math.max(0, ((file.size - blob.size) / file.size) * 100).toFixed(0);
        outEl.innerHTML = `${formatBytes(blob.size)} <span style="color:var(--green);font-weight:700;">-${saved}%</span>`;
        badge.className = "badge ok";
        badge.textContent = "OK";
        const afterUrl = URL.createObjectURL(blob);
        btn.style.display = "inline-block";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          download(afterUrl, renameFor(index, file.name, ext));
        });
        results.push({ origName: file.name, ext, blob });
        row.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          showCompare(file.name, beforeUrl, afterUrl);
        });
        if (results.length === 1) showCompare(file.name, beforeUrl, afterUrl);
      })
      .catch(() => {
        badge.className = "badge err";
        badge.textContent = t("common.error");
      });
  }

  function showCompare(name, beforeUrl, afterUrl) {
    compareWrap.innerHTML = `
      <div class="panel">
        <div class="row-between" style="margin-bottom:0.75rem;">
          <h2 style="margin:0; font-size:1.1rem;">${t("optimize.compare")}</h2>
          <span class="note">${name}</span>
        </div>
        <div class="compare">
          <img src="${beforeUrl}" alt="before">
          <div class="after"><img src="${afterUrl}" alt="after"></div>
          <input type="range" min="0" max="100" value="50" aria-label="${t("optimize.compare")}">
          <div class="line"></div>
        </div>
      </div>`;
    const slider = compareWrap.querySelector('input[type="range"]');
    const after = compareWrap.querySelector(".after");
    const line = compareWrap.querySelector(".line");
    slider.addEventListener("input", () => {
      after.style.clipPath = `inset(0 0 0 ${slider.value}%)`;
      line.style.left = `${slider.value}%`;
    });
  }

  async function downloadZip() {
    if (!results.length) return;
    const seen = new Set();
    const files = [];
    for (let idx = 0; idx < results.length; idx++) {
      const item = results[idx];
      let name = renameFor(idx, item.origName, item.ext);
      let n = 1;
      while (seen.has(name)) name = `${baseName(name)}-${n++}.${item.ext}`;
      seen.add(name);
      files.push({ name, data: new Uint8Array(await item.blob.arrayBuffer()) });
    }
    download(createZip(files), "assetshrink.zip");
    toast(`${files.length} archivo(s) en ZIP`);
  }

  return () => unregisterPaste();
}
