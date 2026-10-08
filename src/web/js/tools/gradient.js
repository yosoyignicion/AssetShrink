import { copyText, download, loadSettings, saveSettings } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div><label class="field">${t("gradient.type")}</label>
          <select id="type"><option value="linear">${t("gradient.linear")}</option><option value="radial">${t("gradient.radial")}</option><option value="conic">${t("gradient.conic")}</option></select>
        </div>
        <div><label class="field">${t("gradient.angle")}</label>
          <div class="row-between"><input type="range" id="angle" min="0" max="360" value="135"><span class="badge ok" id="av">135°</span></div>
        </div>
      </div>
      <label class="field" style="margin-top:0.5rem;">${t("gradient.stops")}</label>
      <div id="stops"></div>
      <button class="btn-sm ghost" id="add" style="margin-top:0.5rem;">+ ${t("gradient.addStop")}</button>
    </div>
    <div class="panel">
      <div id="preview" style="height:200px; border-radius:12px; border:1px solid var(--border);"></div>
      <div class="row-between" style="margin-top:1rem;">
        <label class="field" style="margin:0;">${t("common.output")}</label>
        <div class="presets">
          <button class="btn-sm ghost" id="copy">${t("common.copy")}</button>
          <button class="btn-sm ghost" id="dl">.css</button>
        </div></div>
      <div class="result-box mono" id="css" style="margin-top:0.5rem;"></div>
    </div>`;

  const type = root.querySelector("#type");
  const angle = root.querySelector("#angle");
  const av = root.querySelector("#av");
  const stopsEl = root.querySelector("#stops");
  const preview = root.querySelector("#preview");
  const cssOut = root.querySelector("#css");
  const addBtn = root.querySelector("#add");

  const saved = loadSettings("gradient", {});
  let stops = saved.stops && saved.stops.length >= 2 ? saved.stops : [
    { color: "#6366f1", pos: 0 },
    { color: "#a78bfa", pos: 100 }
  ];
  if (saved.type) type.value = saved.type;
  if (saved.angle) angle.value = saved.angle;

  function persist() {
    saveSettings("gradient", { type: type.value, angle: angle.value, stops });
  }

  function cssValue() {
    const list = stops
      .slice()
      .sort((a, b) => a.pos - b.pos)
      .map((s) => `${s.color} ${s.pos}%`)
      .join(", ");
    if (type.value === "radial") return `radial-gradient(circle at center, ${list})`;
    if (type.value === "conic") return `conic-gradient(from ${angle.value}deg, ${list})`;
    return `linear-gradient(${angle.value}deg, ${list})`;
  }

  function renderStops() {
    stopsEl.innerHTML = stops
      .map(
        (s, i) => `
      <div class="row-between" style="gap:0.5rem; margin-bottom:0.4rem;">
        <input type="color" value="${s.color}" data-i="${i}" data-k="color" style="width:44px; height:34px; border:none; background:none;">
        <input type="range" min="0" max="100" value="${s.pos}" data-i="${i}" data-k="pos" style="flex:1;">
        <span class="badge ok" style="min-width:52px; text-align:center;" data-v="${i}">${s.pos}%</span>
        <button class="btn-sm ghost" data-del="${i}" ${stops.length <= 2 ? "disabled" : ""}>✕</button>
      </div>`
      )
      .join("");
    stopsEl.querySelectorAll("input").forEach((el) =>
      el.addEventListener("input", () => {
        const i = Number(el.dataset.i);
        stops[i][el.dataset.k] = el.dataset.k === "pos" ? Number(el.value) : el.value;
        stopsEl.querySelector(`[data-v="${i}"]`).textContent = `${stops[i].pos}%`;
        update();
      })
    );
    stopsEl.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        stops.splice(Number(b.dataset.del), 1);
        renderStops();
        update();
      })
    );
  }

  function update() {
    av.textContent = `${angle.value}°`;
    const value = cssValue();
    preview.style.background = value;
    cssOut.textContent = `background: ${value};`;
    persist();
  }

  addBtn.addEventListener("click", () => {
    stops.push({ color: "#22d3ee", pos: 50 });
    renderStops();
    update();
  });
  [type, angle].forEach((el) => el.addEventListener("input", update));
  root.querySelector("#copy").addEventListener("click", () => copyText(cssOut.textContent));
  root.querySelector("#dl").addEventListener("click", () =>
    download(new Blob([`:root {\n  --gradient: ${cssValue()};\n}\n`], { type: "text/css" }), "gradient.css")
  );

  renderStops();
  update();
  return () => {};
}
