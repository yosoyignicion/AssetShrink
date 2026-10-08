import { copyText } from "../ui.js";

const RULES = [
  { name: "Email", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { name: "IPv4", re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { name: "JWT", re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  { name: "AWS Access Key", re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: "OpenAI/Stripe key", re: /\b(?:sk|pk|rk)_(?:live|test|proj)?_?[A-Za-z0-9]{16,}\b/g },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: "Generic secret", re: /\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"']{6,}/gi },
  { name: "Private key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g }
];

// Validación Luhn para tarjetas: evita falsos positivos en números arbitrarios de 13-19 dígitos.
function luhn(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function maskCards(text, found) {
  return text.replace(/\b(?:\d[ -]?){12,18}\d\b/g, (m) => {
    const digits = m.replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) {
      found["Credit card"] = (found["Credit card"] || 0) + 1;
      return "[CREDIT_CARD_REDACTED]";
    }
    return m;
  });
}

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">${t("secrets.label")}</label>
      <textarea id="in" class="mono" style="min-height:200px;" placeholder="${t("secrets.placeholder")}"></textarea>
      <div class="row-between" style="margin-top:0.75rem;">
        <div id="summary" class="note">—</div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-sm" id="copy">${t("common.copy")}</button>
        </div>
      </div>
    </div>
    <div class="panel">
      <label class="field">${t("secrets.masked")}</label>
      <div class="result-box mono" id="out"></div>
    </div>
    <div class="panel">
      <label class="field">${t("secrets.detail")}</label>
      <div id="detail" class="note"></div>
    </div>`;

  const input = root.querySelector("#in");
  const out = root.querySelector("#out");
  const summary = root.querySelector("#summary");
  const detail = root.querySelector("#detail");
  let masked = "";

  function update() {
    let text = input.value;
    const found = {};
    RULES.forEach((rule) => {
      text = text.replace(rule.re, () => {
        found[rule.name] = (found[rule.name] || 0) + 1;
        return `[${rule.name.toUpperCase()}_REDACTED]`;
      });
    });
    text = maskCards(text, found);
    masked = text;
    const total = Object.values(found).reduce((a, b) => a + b, 0);
    summary.innerHTML = total
      ? `<span class="badge err">${t("secrets.found").replace("{n}", total)}</span>`
      : `<span class="badge ok">${t("secrets.none")}</span>`;
    detail.innerHTML = Object.entries(found)
      .map(([k, v]) => `<span class="badge warn">${k}: ${v}</span>`)
      .join(" ");
    out.textContent = text || "—";
  }

  input.addEventListener("input", update);
  root.querySelector("#copy").addEventListener("click", () => copyText(masked));
  update();

  return () => {};
}
