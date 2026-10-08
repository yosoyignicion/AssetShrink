import { escapeHtml } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div><label class="field">${t("regex.pattern")}</label><input type="text" id="pattern" class="mono" value="\\b\\w+@\\w+\\.\\w+\\b"></div>
        <div><label class="field">${t("regex.flags")}</label>
          <div style="display:flex; gap:1rem; flex-wrap:wrap; padding-top:0.5rem;" class="mono">
            <label class="note"><input type="checkbox" data-flag="g" checked> g</label>
            <label class="note"><input type="checkbox" data-flag="i"> i</label>
            <label class="note"><input type="checkbox" data-flag="m"> m</label>
            <label class="note"><input type="checkbox" data-flag="s"> s</label>
            <label class="note"><input type="checkbox" data-flag="u"> u</label>
          </div>
        </div>
      </div>
      <label class="field">${t("regex.test")}</label>
      <textarea id="text" class="mono" style="min-height:160px;">Contacta con ana@example.com o luis@test.org para más info.</textarea>
      <div id="status" style="margin-top:0.75rem;"></div>
    </div>
    <div class="panel">
      <label class="field">${t("regex.highlight")}</label>
      <div class="result-box" id="highlight" style="white-space:pre-wrap;"></div>
    </div>
    <div class="panel">
      <label class="field">${t("regex.detail")}</label>
      <div class="result-box mono" id="detail"></div>
    </div>`;

  const pattern = root.querySelector("#pattern");
  const text = root.querySelector("#text");
  const status = root.querySelector("#status");
  const highlight = root.querySelector("#highlight");
  const detail = root.querySelector("#detail");

  function flags() {
    return [...root.querySelectorAll("[data-flag]")]
      .filter((c) => c.checked)
      .map((c) => c.dataset.flag)
      .join("");
  }

  function update() {
    detail.textContent = "";
    let re;
    try {
      re = new RegExp(pattern.value, flags());
    } catch (e) {
      status.innerHTML = `<span class="badge err">${escapeHtml(e.message)}</span>`;
      highlight.textContent = text.value;
      return;
    }

    const global = re.flags.includes("g");
    const matches = [];
    let m;
    if (global) {
      let guard = 0;
      while ((m = re.exec(text.value)) && guard++ < 100000) {
        matches.push(m);
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    } else {
      m = re.exec(text.value);
      if (m) matches.push(m);
    }

    status.innerHTML = `<span class="badge ${matches.length ? "ok" : "warn"}">${matches.length} coincidencia(s)</span>`;

    let html = "";
    let last = 0;
    for (const match of matches) {
      html += escapeHtml(text.value.slice(last, match.index));
      html += `<mark style="background:rgba(99,102,241,0.45);color:#fff;border-radius:3px;">${escapeHtml(match[0])}</mark>`;
      last = match.index + match[0].length;
    }
    html += escapeHtml(text.value.slice(last));
    highlight.innerHTML = html;

    detail.textContent = matches
      .slice(0, 50)
      .map(
        (match, i) =>
          `#${i}  [${match.index}]  "${match[0]}"` +
          (match.length > 1 ? `\n     grupos: ${match.slice(1).map((g) => g ?? "∅").join(" | ")}` : "")
      )
      .join("\n");
  }

  pattern.addEventListener("input", update);
  text.addEventListener("input", update);
  root.querySelectorAll("[data-flag]").forEach((c) => c.addEventListener("change", update));
  update();

  return () => {};
}
