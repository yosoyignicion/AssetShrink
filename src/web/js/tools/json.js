import { copyText, escapeHtml } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <textarea id="in" class="mono" aria-label="${t("common.input")}" placeholder='{"hello":"world"}' style="min-height:200px;"></textarea>
      <div class="presets" style="margin-top:0.75rem;">
        <button class="chip" id="format">${t("json.format")}</button>
        <button class="chip" id="minify">${t("json.minify")}</button>
        <button class="chip" id="validate">${t("json.validate")}</button>
        <button class="chip" id="sort">${t("json.sort")}</button>
        <button class="chip" id="csv2json">${t("json.csv2json")}</button>
        <button class="chip" id="json2csv">${t("json.json2csv")}</button>
      </div>
    </div>
    <div class="panel">
      <div class="row-between"><label class="field">${t("common.output")}</label>
        <span id="status"></span>
      </div>
      <div class="result-box mono" id="out"></div>
      <button class="btn-sm" id="copy" style="margin-top:0.75rem;">${t("common.copy")}</button>
    </div>`;

  const input = root.querySelector("#in");
  const out = root.querySelector("#out");
  const status = root.querySelector("#status");

  function parse() {
    return JSON.parse(input.value);
  }
  function setStatus(ok, msg) {
    status.innerHTML = `<span class="badge ${ok ? "ok" : "err"}">${escapeHtml(msg)}</span>`;
  }
  function run(fn) {
    try {
      if (!input.value.trim()) return;
      out.textContent = fn(parse());
      setStatus(true, t("json.valid"));
    } catch (e) {
      out.textContent = "";
      setStatus(false, e.message);
    }
  }

  root.querySelector("#format").addEventListener("click", () => run((o) => JSON.stringify(o, null, 2)));
  root.querySelector("#minify").addEventListener("click", () => run((o) => JSON.stringify(o)));
  root.querySelector("#validate").addEventListener("click", () => {
    try {
      parse();
      setStatus(true, t("json.valid"));
    } catch (e) {
      setStatus(false, e.message);
    }
  });
  root.querySelector("#sort").addEventListener("click", () =>
    run((o) => JSON.stringify(sortKeys(o), null, 2))
  );
  root.querySelector("#copy").addEventListener("click", () => copyText(out.textContent));

  // --- CSV ⇄ JSON (parser con soporte de comillas y comas embebidas) ---
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim() !== ""));
  }

  root.querySelector("#csv2json").addEventListener("click", () => {
    try {
      const rows = parseCsv(input.value);
      if (!rows.length) return;
      const [head, ...body] = rows;
      const data = body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""])));
      out.textContent = JSON.stringify(data, null, 2);
      setStatus(true, t("json.csv2json") + " ✓");
    } catch (e) {
      setStatus(false, e.message);
    }
  });

  root.querySelector("#json2csv").addEventListener("click", () => {
    try {
      const data = parse();
      if (!Array.isArray(data) || !data.length) throw new Error(t("json.expectArray"));
      const keys = [...new Set(data.flatMap((o) => Object.keys(o)))];
      const esc = (v) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [keys.join(","), ...data.map((o) => keys.map((k) => esc(o[k])).join(","))];
      out.textContent = lines.join("\n");
      setStatus(true, t("json.json2csv") + " ✓");
    } catch (e) {
      setStatus(false, e.message);
    }
  });

  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object")
      return Object.keys(value)
        .sort()
        .reduce((acc, k) => ((acc[k] = sortKeys(value[k])), acc), {});
    return value;
  }

  return () => {};
}
