import { download, baseName, wireDropzone, postImage, registerPasteTarget } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;
  let currentFile = null;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <div class="form-row">
        <div><label class="field">${t("beautify.padding")}</label><div class="row-between"><input type="range" id="pad" min="0" max="240" value="72"><span class="badge ok" id="padv">72</span></div></div>
        <div><label class="field">${t("beautify.radius")}</label><div class="row-between"><input type="range" id="rad" min="0" max="120" value="18"><span class="badge ok" id="radv">18</span></div></div>
      </div>
      <div class="form-row">
        <div><label class="field">${t("beautify.top")}</label><input type="color" id="c1" value="#6366f1"></div>
        <div><label class="field">${t("beautify.bottom")}</label><input type="color" id="c2" value="#0f172a"></div>
        <div><label class="field">${t("beautify.shadow")}</label><label class="note"><input type="checkbox" id="sh" checked> ${t("beautify.shadowOn")}</label></div>
      </div>
      <div class="row-between">
        <button class="btn btn-primary" id="go">${t("common.process")}</button>
      </div>
    </div>
    <div id="result" style="margin-top:1.25rem;"></div>`;

  const pad = root.querySelector("#pad");
  const rad = root.querySelector("#rad");
  pad.addEventListener("input", () => (root.querySelector("#padv").textContent = pad.value));
  rad.addEventListener("input", () => (root.querySelector("#radv").textContent = rad.value));

  function handleFile(file) {
    if (!file) return;
    currentFile = file;
    root.querySelector("#cfg").style.display = "block";
    root.querySelector("#dz").textContent = file.name;
  }
  wireDropzone(root.querySelector("#dz"), root.querySelector("#fi"), ([file]) => handleFile(file));
  const unregisterPaste = registerPasteTarget(handleFile);

  root.querySelector("#go").addEventListener("click", async () => {
    if (!currentFile) return;
    const params = {
      pad: pad.value,
      radius: rad.value,
      bgTop: root.querySelector("#c1").value,
      bgBottom: root.querySelector("#c2").value,
      shadow: root.querySelector("#sh").checked
    };
    const out = root.querySelector("#result");
    out.innerHTML = `<div class="panel"><span class="badge warn">${t("common.processing")}</span></div>`;
    try {
      const blob = await postImage("/api/beautify", currentFile, params);
      const url = URL.createObjectURL(blob);
      out.innerHTML = `
        <div class="panel">
          <div class="row-between" style="margin-bottom:1rem;">
            <span class="badge ok">PNG</span>
            <button class="btn-sm" id="dl">${t("common.download")}</button>
          </div>
          <img class="preview" src="${url}" alt="result">
        </div>`;
      out.querySelector("#dl").addEventListener("click", () =>
        download(url, `${baseName(currentFile.name)}-beautified.png`)
      );
    } catch (e) {
      out.innerHTML = `<div class="panel"><span class="badge err">${t("common.error")}</span> ${e.message}</div>`;
    }
  });

  return () => unregisterPaste();
}
