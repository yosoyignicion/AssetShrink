import { copyText, escapeHtml } from "../ui.js";

function b64urlToStr(part) {
  let s = part.replace(/-/g, "+").replace(/_/g, "/");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">JWT</label>
      <textarea id="in" class="mono" style="min-height:120px;" placeholder="eyJhbGciOi…"></textarea>
      <p class="note" style="margin-top:0.5rem;">${t("jwt.warn")}</p>
    </div>
    <div id="out"></div>`;

  const input = root.querySelector("#in");
  const out = root.querySelector("#out");

  function block(title, obj) {
    return `<div class="panel">
      <div class="row-between"><label class="field" style="margin:0;">${title}</label>
      <button class="btn-sm ghost copy" data-obj="${encodeURIComponent(JSON.stringify(obj, null, 2))}">${t("common.copy")}</button></div>
      <div class="result-box mono" style="white-space:pre-wrap; max-height:none;">${escapeHtml(JSON.stringify(obj, null, 2))}</div>
    </div>`;
  }

  function decode() {
    const token = input.value.trim();
    out.innerHTML = "";
    if (!token) return;
    const parts = token.split(".");
    if (parts.length < 2) {
      out.innerHTML = `<div class="panel"><span class="badge err">${t("jwt.invalid")}</span></div>`;
      return;
    }
    try {
      const header = JSON.parse(b64urlToStr(parts[0]));
      const payload = JSON.parse(b64urlToStr(parts[1]));
      let claim = "";
      if (payload.exp) {
        const d = new Date(payload.exp * 1000);
        const expired = d.getTime() < Date.now();
        claim = `<div class="panel"><span class="badge ${expired ? "err" : "ok"}">${t("jwt.exp")}: ${d.toLocaleString(ctx.getLang())}${expired ? " · " + t("jwt.expired") : ""}</span></div>`;
      }
      out.innerHTML = claim + block("Header", header) + block("Payload", payload);
      out.querySelectorAll(".copy").forEach((b) =>
        b.addEventListener("click", () => copyText(decodeURIComponent(b.dataset.obj)))
      );
    } catch (e) {
      out.innerHTML = `<div class="panel"><span class="badge err">${escapeHtml(e.message)}</span></div>`;
    }
  }

  input.addEventListener("input", decode);
  return () => {};
}
