import { copyText, loadSettings, saveSettings } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div><label class="field">${t("password.length")}</label><div class="row-between"><input type="range" id="len" min="6" max="64" value="20"><span class="badge ok" id="lv">20</span></div></div>
        <div><label class="field">${t("password.options")}</label>
          <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            <label class="note"><input type="checkbox" id="upper" checked> A-Z</label>
            <label class="note"><input type="checkbox" id="lower" checked> a-z</label>
            <label class="note"><input type="checkbox" id="digits" checked> 0-9</label>
            <label class="note"><input type="checkbox" id="symbols" checked> !@#</label>
            <label class="note"><input type="checkbox" id="noamb"> ${t("password.noamb")}</label>
          </div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="result-box mono" id="out" style="font-size:1.25rem; letter-spacing:0.05em; text-align:center;">—</div>
      <div style="display:flex; gap:0.5rem; margin-top:0.75rem;">
        <button class="btn btn-primary" id="gen">${t("common.generate")} 🔄</button>
        <button class="btn btn-ghost" id="copy">${t("common.copy")}</button>
      </div>
      <div id="strength" style="margin-top:0.75rem;"></div>
    </div>`;

  const len = root.querySelector("#len");
  const out = root.querySelector("#out");
  const OPT_IDS = ["upper", "lower", "digits", "symbols", "noamb"];

  len.addEventListener("input", () => (root.querySelector("#lv").textContent = len.value));

  function persist() {
    const sets = {};
    OPT_IDS.forEach((id) => (sets[id] = root.querySelector(`#${id}`).checked));
    saveSettings("password", { len: len.value, ...sets });
  }
  OPT_IDS.forEach((id) => root.querySelector(`#${id}`).addEventListener("change", persist));
  len.addEventListener("input", persist);

  const saved = loadSettings("password", {});
  if (saved.len) len.value = saved.len;
  root.querySelector("#lv").textContent = len.value;
  OPT_IDS.forEach((id) => {
    if (typeof saved[id] === "boolean") root.querySelector(`#${id}`).checked = saved[id];
  });

  // Índice aleatorio sin sesgo de módulo (rejection sampling sobre 8 bits).
  function randIndex(n) {
    const limit = Math.floor(256 / n) * n;
    const buf = new Uint8Array(1);
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % n;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randIndex(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generate() {
    const noamb = root.querySelector("#noamb").checked;
    const activeSets = [
      ["upper", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
      ["lower", "abcdefghijklmnopqrstuvwxyz"],
      ["digits", "0123456789"],
      ["symbols", "!@#$%^&*()-_=+[]{};:,.?"]
    ]
      .filter(([id]) => root.querySelector(`#${id}`).checked)
      .map(([id, chars]) => (noamb ? chars.replace(/[O0Il1|]/g, "") : chars));

    if (!activeSets.length) {
      out.textContent = t("password.pickSet");
      return;
    }
    const pool = activeSets.join("");
    const n = Number(len.value);
    const chars = [];
    // Garantiza al menos un carácter de cada conjunto seleccionado.
    if (n >= activeSets.length) {
      activeSets.forEach((set) => chars.push(set[randIndex(set.length)]));
    }
    while (chars.length < n) chars.push(pool[randIndex(pool.length)]);
    out.textContent = shuffle(chars).join("");
    const bits = Math.round(n * Math.log2(pool.length));
    const level = bits >= 120 ? ["ok", t("password.strong")] : bits >= 70 ? ["warn", t("password.medium")] : ["err", t("password.weak")];
    root.querySelector("#strength").innerHTML = `<span class="badge ${level[0]}">${level[1]} · ~${bits} bits</span>`;
  }

  root.querySelector("#gen").addEventListener("click", generate);
  root.querySelector("#copy").addEventListener("click", () => copyText(out.textContent));
  generate();

  return () => {};
}
