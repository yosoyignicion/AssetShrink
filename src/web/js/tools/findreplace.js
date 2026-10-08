import { copyText } from "../ui.js";
import { escapeHtml } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div><label class="field">${t("findreplace.find")}</label><input type="text" id="find" class="mono" placeholder="texto…"></div>
        <div><label class="field">${t("findreplace.replace")}</label><input type="text" id="repl" class="mono" placeholder="$1…"></div>
      </div>
      <div class="presets" style="margin-top:0.5rem;">
        <label class="note"><input type="checkbox" id="regex"> ${t("findreplace.regex")}</label>
        <label class="note"><input type="checkbox" id="ci" checked> ${t("findreplace.ci")}</label>
      </div>
      <label class="field" style="margin-top:1rem;">${t("common.input")}</label>
      <textarea id="in" class="mono" style="min-height:180px;"></textarea>
    </div>
    <div class="panel">
      <div class="row-between"><label class="field" style="margin:0;">${t("common.output")}</label>
        <div style="display:flex; gap:0.5rem;"><span id="count" class="note"></span>
        <button class="btn-sm ghost" id="copy">${t("common.copy")}</button></div></div>
      <textarea id="out" class="mono result-box" style="min-height:180px; margin-top:0.5rem;"></textarea>
    </div>`;

  const find = root.querySelector("#find");
  const repl = root.querySelector("#repl");
  const regex = root.querySelector("#regex");
  const ci = root.querySelector("#ci");
  const input = root.querySelector("#in");
  const out = root.querySelector("#out");
  const count = root.querySelector("#count");

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function update() {
    if (!find.value) {
      out.value = input.value;
      count.textContent = "";
      return;
    }
    let flags = "g" + (ci.checked ? "i" : "");
    let re;
    try {
      re = regex.checked ? new RegExp(find.value, flags) : new RegExp(escapeRe(find.value), flags);
    } catch (e) {
      count.innerHTML = `<span class="badge err">${escapeHtml(e.message)}</span>`;
      out.value = "";
      return;
    }
    let n = 0;
    out.value = input.value.replace(re, (...args) => {
      n++;
      // Si el reemplazo usa $1…, respeta los grupos; si no, texto literal.
      return repl.value.replace(/\$(\d+)/g, (_, g) => args[Number(g)] ?? "");
    });
    count.innerHTML = `<span class="badge ${n ? "ok" : "warn"}">${n} ${t("findreplace.matches")}</span>`;
  }

  [find, repl].forEach((el) => el.addEventListener("input", update));
  [regex, ci].forEach((el) => el.addEventListener("change", update));
  input.addEventListener("input", update);
  root.querySelector("#copy").addEventListener("click", () => copyText(out.value));
  update();

  return () => {};
}
