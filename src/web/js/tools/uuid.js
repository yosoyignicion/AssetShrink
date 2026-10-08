import { copyText, download } from "../ui.js";

const NANOID_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

function uuidv4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versión 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
}

function nanoid(size) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = "";
  for (const b of bytes) id += NANOID_ALPHABET[b & 63];
  return id;
}

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div><label class="field">${t("uuid.type")}</label>
          <select id="type"><option value="uuid">UUID v4</option><option value="nanoid">NanoID</option></select></div>
        <div><label class="field">${t("uuid.count")}</label><input type="number" id="count" value="5" min="1" max="500"></div>
        <div><label class="field">${t("uuid.length")}</label>
          <div class="row-between"><input type="range" id="len" min="8" max="64" value="21"><span class="badge ok" id="lv">21</span></div></div>
      </div>
      <div class="presets" style="margin-top:0.5rem;">
        <label class="note"><input type="checkbox" id="dash" checked> ${t("uuid.dash")}</label>
        <label class="note"><input type="checkbox" id="upper"> ${t("uuid.upper")}</label>
        <button class="btn btn-primary" id="gen" style="margin-left:auto;">${t("common.generate")}</button>
      </div>
    </div>
    <div class="panel">
      <div class="row-between"><label class="field" style="margin:0;">${t("common.output")}</label>
        <div class="presets"><button class="btn-sm ghost" id="copy">${t("common.copy")}</button>
        <button class="btn-sm ghost" id="dl">${t("common.download")}</button></div></div>
      <textarea id="out" class="mono result-box" readonly style="min-height:180px; margin-top:0.5rem;"></textarea>
    </div>`;

  const type = root.querySelector("#type");
  const len = root.querySelector("#len");
  len.addEventListener("input", () => (root.querySelector("#lv").textContent = len.value));

  function generate() {
    const n = Math.min(500, Math.max(1, Number(root.querySelector("#count").value) || 1));
    const upper = root.querySelector("#upper").checked;
    const dash = root.querySelector("#dash").checked;
    const list = [];
    for (let i = 0; i < n; i++) {
      let id;
      if (type.value === "nanoid") id = nanoid(Number(len.value));
      else id = dash ? uuidv4() : uuidv4().replace(/-/g, "");
      list.push(upper ? id.toUpperCase() : id);
    }
    root.querySelector("#out").value = list.join("\n");
  }

  root.querySelector("#gen").addEventListener("click", generate);
  root.querySelector("#copy").addEventListener("click", () => copyText(root.querySelector("#out").value));
  root.querySelector("#dl").addEventListener("click", () =>
    download(new Blob([root.querySelector("#out").value], { type: "text/plain" }), "uuids.txt")
  );
  generate();

  return () => {};
}
