import { copyText, download } from "../ui.js";

// Separa en palabras: corta en fronteras camelCase y en cualquier no-alfanumérico.
function splitWords(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9À-ÿ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const stripAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">${t("common.input")}</label>
      <textarea id="in" style="min-height:140px;">Hola mundo_esto es unaPrueba</textarea>
      <label class="note" style="display:block; margin-top:0.5rem;"><input type="checkbox" id="acc"> ${t("caseconv.accents")}</label>
    </div>
    <div class="presets" id="ops"></div>
    <div class="panel">
      <div class="row-between"><label class="field" style="margin:0;">${t("common.output")}</label>
        <div class="presets"><button class="btn-sm ghost" id="copy">${t("common.copy")}</button>
        <button class="btn-sm ghost" id="dl">${t("common.download")}</button></div></div>
      <textarea id="out" class="mono result-box" style="min-height:120px; margin-top:0.5rem;"></textarea>
    </div>`;

  const input = root.querySelector("#in");
  const out = root.querySelector("#out");
  const acc = root.querySelector("#acc");

  const OPS = {
    lower: (w) => w.join(" ").toLowerCase(),
    upper: (w) => w.join(" ").toUpperCase(),
    title: (w) => w.map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(" "),
    sentence: (w, s) => {
      const txt = w.join(" ").toLowerCase();
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    },
    camel: (w) => w.map((x, i) => (i ? x[0].toUpperCase() + x.slice(1).toLowerCase() : x.toLowerCase())).join(""),
    pascal: (w) => w.map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(""),
    snake: (w) => w.map((x) => x.toLowerCase()).join("_"),
    kebab: (w) => w.map((x) => x.toLowerCase()).join("-"),
    constant: (w) => w.map((x) => x.toUpperCase()).join("_"),
    slug: (w) => w.map((x) => x.toLowerCase()).join("-")
  };

  const LABELS = {
    lower: "lower case",
    upper: "UPPER CASE",
    title: "Title Case",
    sentence: "Sentence case",
    camel: "camelCase",
    pascal: "PascalCase",
    snake: "snake_case",
    kebab: "kebab-case",
    constant: "CONSTANT_CASE",
    slug: "slug-de-url"
  };

  root.querySelector("#ops").innerHTML = Object.keys(OPS)
    .map((id) => `<button class="chip" data-op="${id}">${LABELS[id]}</button>`)
    .join("");

  function transform(op) {
    let words = splitWords(input.value);
    const isSlug = op === "slug";
    if (acc.checked || isSlug) words = words.map(stripAccents);
    let value = OPS[op](words, input.value);
    if (isSlug) value = value.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    out.value = value;
  }

  root.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => {
      root.querySelectorAll("[data-op]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      transform(b.dataset.op);
    })
  );
  root.querySelector("#copy").addEventListener("click", () => copyText(out.value));
  root.querySelector("#dl").addEventListener("click", () =>
    download(new Blob([out.value], { type: "text/plain" }), "converted.txt")
  );

  root.querySelector('[data-op="camel"]').classList.add("active");
  transform("camel");

  return () => {};
}
