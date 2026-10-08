import { copyText } from "../ui.js";
import { escapeHtml } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">URL</label>
      <input type="text" id="url" class="mono" value="https://example.com:8080/ruta/pagina?q=hola&lang=es#seccion" style="width:100%;">
    </div>
    <div class="grid-2">
      <div class="panel">
        <label class="field">${t("urlparts.parts")}</label>
        <div id="parts" class="mono" style="display:flex; flex-direction:column; gap:0.5rem;"></div>
      </div>
      <div class="panel">
        <div class="row-between"><label class="field" style="margin:0;">${t("urlparts.params")}</label>
          <button class="btn-sm ghost" id="rebuild">${t("urlparts.rebuild")}</button></div>
        <div id="params" style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.4rem;"></div>
        <div class="result-box mono" id="built" style="margin-top:0.75rem; white-space:pre-wrap;"></div>
      </div>
    </div>`;

  const urlEl = root.querySelector("#url");
  const parts = root.querySelector("#parts");
  const paramsEl = root.querySelector("#params");
  const built = root.querySelector("#built");

  function row(k, v) {
    return `<div class="row-between"><span class="note">${k}</span>
      <span class="copyv" data-v="${encodeURIComponent(v)}" style="cursor:pointer; font-family:monospace;">${escapeHtml(v)} ⧉</span></div>`;
  }

  function render() {
    let u;
    try {
      u = new URL(urlEl.value);
    } catch {
      parts.innerHTML = `<span class="badge err">URL no válida</span>`;
      paramsEl.innerHTML = "";
      built.textContent = "";
      return;
    }
    parts.innerHTML = [
      ["origin", u.origin],
      ["protocol", u.protocol],
      ["host", u.host],
      ["port", u.port || "(default)"],
      ["pathname", u.pathname],
      ["hash", u.hash]
    ]
      .map(([k, v]) => row(k, v))
      .join("");
    parts.querySelectorAll(".copyv").forEach((el) =>
      el.addEventListener("click", () => copyText(decodeURIComponent(el.dataset.v)))
    );

    paramsEl.innerHTML = [...u.searchParams.entries()]
      .map(
        ([k, v], i) => `<div style="display:flex; gap:0.4rem;">
          <input type="text" class="mono pk" data-i="${i}" value="${escapeHtml(k)}" style="flex:1;">
          <input type="text" class="mono pv" data-i="${i}" value="${escapeHtml(v)}" style="flex:1;">
        </div>`
      )
      .join("");
    paramsEl.querySelectorAll(".pk,.pv").forEach((el) =>
      el.addEventListener("input", () => {
        build(u, [...paramsEl.querySelectorAll(".pk")].map((p, i) => [p.value, paramsEl.querySelectorAll(".pv")[i].value]));
      })
    );
    build(u, [...u.searchParams.entries()]);
  }

  function build(u, entries) {
    const nu = new URL(u.origin + u.pathname);
    entries.forEach(([k, v]) => {
      if (k !== "") nu.searchParams.append(k, v);
    });
    nu.hash = u.hash;
    built.textContent = nu.toString();
    built.dataset.url = nu.toString();
  }

  root.querySelector("#rebuild").addEventListener("click", () => {
    const entries = [...paramsEl.querySelectorAll(".pk")].map((p, i) => [p.value, paramsEl.querySelectorAll(".pv")[i].value]);
    let u;
    try {
      u = new URL(urlEl.value);
    } catch {
      return;
    }
    build(u, entries);
    copyText(built.dataset.url || "");
  });

  urlEl.addEventListener("input", render);
  render();

  return () => {};
}
