import { wireDropzone, postImage, registerPasteTarget, formatBytes, copyText } from "../ui.js";

function bytesToBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function mount(root, ctx) {
  const { t } = ctx;
  let currentFile = null;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <div class="form-row">
        <div><label class="field">${t("common.format")}</label>
          <select id="fmt"><option value="webp">WebP</option><option value="png">PNG</option><option value="jpg">JPEG</option></select></div>
        <div><label class="field">${t("common.quality")}</label>
          <div class="row-between"><input type="range" id="q" min="5" max="100" value="80"><span class="badge ok" id="qv">80%</span></div></div>
      </div>
      <div class="row-between">
        <span class="note">${t("imgbase64.note")}</span>
        <button class="btn btn-primary" id="go">${t("common.process")}</button>
      </div>
    </div>
    <div id="result" style="margin-top:1.25rem;"></div>`;

  const q = root.querySelector("#q");
  q.addEventListener("input", () => (root.querySelector("#qv").textContent = `${q.value}%`));

  function handleFile(file) {
    if (!file) return;
    currentFile = file;
    root.querySelector("#cfg").style.display = "block";
    root.querySelector("#dz").textContent = `${file.name} · ${formatBytes(file.size)}`;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([f]) => handleFile(f));
  const unregisterPaste = registerPasteTarget(handleFile);

  function block(id, label, value) {
    return `<div class="row-between" style="margin-top:1rem;"><label class="field" style="margin:0;">${label}</label>
      <button class="btn-sm ghost copy" data-src="${id}">${t("common.copy")}</button></div>
      <textarea class="result-box mono" id="${id}" readonly style="min-height:70px; max-height:180px;">${value.replace(/</g, "&lt;")}</textarea>`;
  }

  root.querySelector("#go").addEventListener("click", async () => {
    if (!currentFile) return;
    const out = root.querySelector("#result");
    out.innerHTML = `<div class="panel"><span class="badge warn">${t("common.processing")}</span></div>`;
    try {
      const fmt = root.querySelector("#fmt").value;
      const blob = await postImage("/api/convert", currentFile, { quality: q.value, format: fmt });
      const base64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
      const mime = fmt === "png" ? "image/png" : fmt === "jpg" ? "image/jpeg" : "image/webp";
      const dataUri = `data:${mime};base64,${base64}`;
      const css = `background-image: url("${dataUri}");`;
      const html = `<img src="${dataUri}" alt="">`;

      out.innerHTML = `
        <div class="panel">
          <div class="row-between">
            <span class="badge ok">${fmt.toUpperCase()} · ${formatBytes(blob.size)}</span>
            <span class="note">${formatBytes(currentFile.size)} → ${formatBytes(blob.size)} · ${t("imgbase64.metaGone")}</span>
          </div>
          <div style="margin-top:0.75rem; text-align:center;"><img src="${dataUri}" class="preview" style="max-height:120px; display:inline-block;"></div>
        </div>
        <div class="panel">
          ${block("outData", "Data URI", dataUri)}
          ${block("outB64", "Base64", base64)}
          ${block("outCss", "CSS", css)}
          ${block("outHtml", "HTML", html)}
        </div>`;
      out.querySelectorAll(".copy").forEach((b) =>
        b.addEventListener("click", () => copyText(out.querySelector(`#${b.dataset.src}`).value))
      );
    } catch (e) {
      out.innerHTML = `<div class="panel"><span class="badge err">${t("common.error")}</span> ${e.message}</div>`;
    }
  });

  return () => unregisterPaste();
}
