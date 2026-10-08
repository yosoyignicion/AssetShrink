import { copyText } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">${t("timestamp.input")}</label>
      <div style="display:flex; gap:0.5rem;">
        <input type="text" id="in" class="mono" value="${Math.floor(Date.now() / 1000)}" style="flex:1;">
        <button class="btn btn-primary" id="now">${t("timestamp.now")}</button>
      </div>
      <p class="note" style="margin-top:0.5rem;">${t("timestamp.hint")}</p>
    </div>
    <div class="panel">
      <div class="row-between"><label class="field" style="margin:0;">${t("common.output")}</label>
        <button class="btn-sm ghost" id="copyAll">${t("common.copy")}</button></div>
      <div id="out" class="mono" style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;"></div>
    </div>`;

  const input = root.querySelector("#in");
  const out = root.querySelector("#out");

  function parse(v) {
    const s = v.trim();
    if (/^-?\d+$/.test(s)) {
      const n = Number(s);
      return new Date(Math.abs(n) < 1e11 ? n * 1000 : n);
    }
    return new Date(s);
  }

  function relative(d) {
    const diff = (d.getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(ctx.getLang(), { numeric: "auto" });
    const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
    for (const [unit, secs] of units) {
      if (Math.abs(diff) >= secs || unit === "second") return rtf.format(Math.round(diff / secs), unit);
    }
  }

  function render() {
    const d = parse(input.value);
    if (isNaN(d.getTime())) {
      out.innerHTML = `<span class="badge err">${t("timestamp.invalid")}</span>`;
      return;
    }
    const rows = [
      ["Unix (s)", String(Math.floor(d.getTime() / 1000))],
      ["Unix (ms)", String(d.getTime())],
      ["ISO 8601", d.toISOString()],
      ["UTC", d.toUTCString()],
      [t("timestamp.local"), d.toLocaleString(ctx.getLang())],
      [t("timestamp.relative"), relative(d)]
    ];
    out.innerHTML = rows
      .map(
        ([k, v]) => `<div class="row-between"><span class="note">${k}</span>
        <button class="btn-sm ghost copy" data-v="${encodeURIComponent(v)}" style="font-family:monospace;">${v} ⧉</button></div>`
      )
      .join("");
    out.querySelectorAll(".copy").forEach((b) =>
      b.addEventListener("click", () => copyText(decodeURIComponent(b.dataset.v)))
    );
  }

  input.addEventListener("input", render);
  root.querySelector("#now").addEventListener("click", () => {
    input.value = Math.floor(Date.now() / 1000);
    render();
  });
  root.querySelector("#copyAll").addEventListener("click", () => copyText(out.innerText));
  render();

  return () => {};
}
