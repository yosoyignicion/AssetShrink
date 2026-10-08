import { wireDropzone, toast, registerPasteTarget } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="dropzone" id="dz">${t("common.drop")}</div>
    <input type="file" id="fi" accept="image/*" hidden>
    <div class="panel" id="cfg" style="display:none; margin-top:1.25rem;">
      <div class="form-row">
        <div><label class="field">${t("palette.count")}</label><div class="row-between"><input type="range" id="count" min="3" max="16" value="8"><span class="badge ok" id="cv">8</span></div></div>
      </div>
      <button class="btn btn-primary" id="go">${t("common.process")}</button>
    </div>
    <div id="result" style="margin-top:1.25rem;"></div>`;

  const count = root.querySelector("#count");
  const cv = root.querySelector("#cv");
  count.addEventListener("input", () => (cv.textContent = count.value));

  let currentFile = null;
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
    const out = root.querySelector("#result");
    out.innerHTML = `<div class="panel"><span class="badge warn">${t("common.processing")}</span></div>`;
    try {
      const form = new FormData();
      form.append("image", currentFile);
      const res = await fetch(`/api/palette?count=${count.value}`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const css = `:root {\n${data.colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n")}\n}`;
      const tailwind = `{\n${data.colors.map((c, i) => `  "brand-${i + 1}": "${c.hex}"`).join(",\n")}\n}`;
      const json = JSON.stringify(data.colors, null, 2);
      out.innerHTML = `
        <div class="panel">
          <p class="section-sub" style="margin-bottom:1rem;">${t("palette.hint")}</p>
          <div class="swatches">
            ${data.colors
              .map(
                (c) => `<div class="swatch" data-hex="${c.hex}" style="background:${c.hex};">
                    ${c.hex}<small>${c.percent}%</small>
                  </div>`
              )
              .join("")}
          </div>
          <div class="presets" style="margin-top:1rem;">
            <button class="chip" data-exp="css">CSS</button>
            <button class="chip" data-exp="tailwind">Tailwind</button>
            <button class="chip" data-exp="json">JSON</button>
          </div>
          <div class="result-box mono" id="expBox" style="margin-top:0.75rem; white-space:pre-wrap;"></div>
        </div>`;
      const exps = { css, tailwind, json };
      const expBox = out.querySelector("#expBox");
      expBox.textContent = css;
      out.querySelectorAll("[data-exp]").forEach((b) =>
        b.addEventListener("click", () => {
          out.querySelectorAll("[data-exp]").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          expBox.textContent = exps[b.dataset.exp];
        })
      );
      out.querySelectorAll(".swatch").forEach((el) =>
        el.addEventListener("click", () => {
          navigator.clipboard.writeText(el.dataset.hex);
          toast(el.dataset.hex + " copiado");
        })
      );
    } catch (e) {
      out.innerHTML = `<div class="panel"><span class="badge err">${t("common.error")}</span> ${e.message}</div>`;
    }
  });

  return () => unregisterPaste();
}
