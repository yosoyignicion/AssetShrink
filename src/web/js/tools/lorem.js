import { copyText } from "../ui.js";

const WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
    " "
  );

const rand = () => WORDS[Math.floor(Math.random() * WORDS.length)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function sentence() {
  const n = 8 + Math.floor(Math.random() * 10);
  const words = Array.from({ length: n }, rand);
  return cap(words.join(" ")) + ".";
}

function paragraph(sentences) {
  return Array.from({ length: sentences }, sentence).join(" ");
}

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">${t("lorem.title")}</label>
      <div class="form-row">
        <div><label class="field">${t("lorem.paragraphs")}</label><input type="number" id="p" value="3" min="1" max="20"></div>
        <div><label class="field">${t("lorem.sentences")}</label><input type="number" id="s" value="4" min="1" max="12"></div>
        <div><label class="field">${t("lorem.format")}</label>
          <select id="fmt"><option value="text">${t("lorem.plain")}</option><option value="html">&lt;p&gt; HTML</option></select></div>
      </div>
      <div class="presets"><button class="btn btn-primary" id="gen">${t("common.generate")}</button>
        <button class="btn-sm ghost" id="copy">${t("common.copy")}</button></div>
      <textarea id="out" class="mono result-box" style="min-height:180px; margin-top:0.75rem;"></textarea>
    </div>
    <div class="panel">
      <label class="field">${t("lorem.table")}</label>
      <div class="form-row">
        <div><label class="field">${t("lorem.rows")}</label><input type="number" id="rows" value="3" min="1" max="30"></div>
        <div><label class="field">${t("lorem.cols")}</label><input type="number" id="cols" value="3" min="1" max="12"></div>
        <div style="display:flex; align-items:flex-end;"><button class="btn btn-ghost" id="genTable">${t("common.generate")}</button></div>
      </div>
      <textarea id="table" class="mono result-box" style="min-height:120px; margin-top:0.75rem;"></textarea>
      <button class="btn-sm ghost" id="copyTable" style="margin-top:0.5rem;">${t("common.copy")}</button>
    </div>`;

  const out = root.querySelector("#out");

  root.querySelector("#gen").addEventListener("click", () => {
    const paragraphs = Math.max(1, Number(root.querySelector("#p").value) || 1);
    const sentences = Math.max(1, Number(root.querySelector("#s").value) || 1);
    const html = root.querySelector("#fmt").value === "html";
    // Arranque clásico para que el texto sea reconocible como Lorem ipsum.
    const first = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    const blocks = Array.from({ length: paragraphs }, (_, i) => (i === 0 ? first + " " + paragraph(sentences - 1) : paragraph(sentences)));
    out.value = html ? blocks.map((b) => `<p>${b}</p>`).join("\n") : blocks.join("\n\n");
  });

  root.querySelector("#genTable").addEventListener("click", () => {
    const rows = Math.max(1, Number(root.querySelector("#rows").value) || 1);
    const cols = Math.max(1, Number(root.querySelector("#cols").value) || 1);
    const header = `| ${Array.from({ length: cols }, (_, i) => `${t("lorem.col")} ${i + 1}`).join(" | ")} |`;
    const sep = `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`;
    const body = Array.from({ length: rows }, () => `| ${Array.from({ length: cols }, () => "  ").join(" | ")} |`).join("\n");
    root.querySelector("#table").value = [header, sep, body].join("\n");
  });

  root.querySelector("#copy").addEventListener("click", () => copyText(out.value));
  root.querySelector("#copyTable").addEventListener("click", () => copyText(root.querySelector("#table").value));

  root.querySelector("#gen").click();
  root.querySelector("#genTable").click();

  return () => {};
}
