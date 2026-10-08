import { copyText, download } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="grid-2">
      <div class="panel"><label class="field">${t("common.input")}</label>
        <textarea id="in" class="mono" style="min-height:240px;">manzana
pera
manzana
  plátano  

cereza</textarea></div>
      <div class="panel"><label class="field">${t("common.output")}</label>
        <textarea id="out" class="mono result-box" style="min-height:240px;"></textarea></div>
    </div>
    <div class="presets" id="ops"></div>
    <div class="presets">
      <button class="btn-sm ghost" id="copy">${t("common.copy")}</button>
      <button class="btn-sm ghost" id="dl">${t("common.download")}</button>
      <button class="btn-sm ghost" id="reset">${t("common.reset")}</button>
    </div>`;

  const input = root.querySelector("#in");
  const out = root.querySelector("#out");

  const byLines = () => input.value.replace(/\r/g, "").split("\n");
  const write = (lines) => (out.value = lines.join("\n"));

  const OPS = {
    sortAsc: () => byLines().sort((a, b) => a.localeCompare(b, ctx.getLang(), { sensitivity: "base" })),
    sortDesc: () => byLines().sort((a, b) => b.localeCompare(a, ctx.getLang(), { sensitivity: "base" })),
    sortNum: () => byLines().sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0)),
    unique: () => {
      const seen = new Set();
      return byLines().filter((l) => {
        const k = l.trim();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    },
    removeEmpty: () => byLines().filter((l) => l.trim() !== ""),
    trim: () => byLines().map((l) => l.trim()),
    number: () => byLines().map((l, i) => `${i + 1}. ${l}`),
    shuffle: () => {
      const a = byLines();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    reverse: () => byLines().reverse(),
    reverseChars: () => byLines().map((l) => [...l].reverse().join(""))
  };

  root.querySelector("#ops").innerHTML = Object.keys(OPS)
    .map((id) => `<button class="chip" data-op="${id}">${t("textlines." + id)}</button>`)
    .join("");

  root.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      out.value = "";
      write(OPS[b.dataset.op]());
    })
  );
  input.addEventListener("input", () => (out.value = input.value));
  root.querySelector("#copy").addEventListener("click", () => copyText(out.value));
  root.querySelector("#dl").addEventListener("click", () =>
    download(new Blob([out.value], { type: "text/plain" }), "lines.txt")
  );
  root.querySelector("#reset").addEventListener("click", () => {
    out.value = input.value;
  });

  out.value = input.value;
  return () => {};
}
