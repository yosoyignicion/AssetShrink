import { copyText } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="grid-2">
      <div class="panel">
        ${slider("x", t("shadow.x"), -40, 40, 8)}
        ${slider("y", t("shadow.y"), -40, 40, 12)}
        ${slider("blur", "Blur", 0, 80, 24)}
        ${slider("spread", "Spread", -20, 40, 0)}
        <div class="form-row">
          <div><label class="field">${t("shadow.color")}</label><input type="color" id="color" value="#000000"></div>
          <div><label class="field">${t("shadow.opacity")}</label>
            <div class="row-between"><input type="range" id="opacity" min="0" max="100" value="25"><span class="badge ok" id="opacityv">25%</span></div></div>
        </div>
        <label class="note"><input type="checkbox" id="inset"> Inset</label>
      </div>
      <div class="panel">
        <div id="preview" style="height:180px; border-radius:14px; background:var(--surface-2); border:1px solid var(--border);"></div>
        <div class="result-box mono" id="css" style="margin-top:1rem;">box-shadow: …;</div>
        <button class="btn-sm" id="copy" style="margin-top:0.75rem;">${t("common.copy")}</button>
      </div>
    </div>`;

  const refs = {};
  function slider(id, label, min, max, val) {
    return `<div style="margin-bottom:0.75rem;"><label class="field">${label}</label>
      <div class="row-between"><input type="range" id="${id}" min="${min}" max="${max}" value="${val}">
      <span class="badge ok" id="${id}v">${val}</span></div></div>`;
  }

  function hexToRgba(hex, alpha) {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  function update() {
    const o = Number(root.querySelector("#opacity").value) / 100;
    root.querySelector("#opacityv").textContent = `${root.querySelector("#opacity").value}%`;
    ["x", "y", "blur", "spread"].forEach((id) => {
      refs[id] = root.querySelector("#" + id);
      root.querySelector(`#${id}v`).textContent = refs[id].value;
    });
    const inset = root.querySelector("#inset").checked ? "inset " : "";
    const value = `${inset}${refs.x.value}px ${refs.y.value}px ${refs.blur.value}px ${refs.spread.value}px ${hexToRgba(root.querySelector("#color").value, o)}`;
    root.querySelector("#preview").style.boxShadow = value;
    root.querySelector("#css").textContent = `box-shadow: ${value};`;
  }

  root.querySelectorAll("input").forEach((el) => el.addEventListener("input", update));
  root.querySelector("#copy").addEventListener("click", () => copyText(root.querySelector("#css").textContent));
  update();

  return () => {};
}
