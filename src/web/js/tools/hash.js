import { copyText, escapeHtml } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="presets">
        <button class="chip active" data-mode="hash">Hash</button>
        <button class="chip" data-mode="b64">Base64</button>
        <button class="chip" data-mode="url">URL</button>
      </div>
      <label class="field" style="margin-top:1rem;">${t("common.input")}</label>
      <textarea id="in" class="mono" style="min-height:120px;">AssetShrink</textarea>
    </div>
    <div class="panel" id="panel"></div>`;

  const input = root.querySelector("#in");
  const panel = root.querySelector("#panel");
  const chips = [...root.querySelectorAll(".chip")];
  let mode = "hash";

  chips.forEach((c) =>
    c.addEventListener("click", () => {
      chips.forEach((x) => x.classList.remove("active"));
      c.classList.add("active");
      mode = c.dataset.mode;
      update();
    })
  );

  async function sha(algo, text) {
    const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function row(label, value) {
    return `<div style="margin-bottom:1rem;">
      <div class="row-between"><label class="field" style="margin:0;">${label}</label>
      <button class="btn-sm ghost copy" data-v="${encodeURIComponent(value)}">${t("common.copy")}</button></div>
      <div class="result-box mono" style="max-height:none;">${escapeHtml(value)}</div></div>`;
  }

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }
  function b64decode(b64) {
    try {
      const bin = atob(b64.trim());
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch {
      return t("hash.invalid64");
    }
  }

  async function update() {
    const text = input.value;
    if (mode === "hash") {
      panel.innerHTML = `<span class="badge warn">${t("hash.calc")}</span>`;
      const [s1, s256, s384, s512] = await Promise.all([
        sha("SHA-1", text),
        sha("SHA-256", text),
        sha("SHA-384", text),
        sha("SHA-512", text)
      ]);
      panel.innerHTML = row("SHA-1", s1) + row("SHA-256", s256) + row("SHA-384", s384) + row("SHA-512", s512);
    } else if (mode === "b64") {
      panel.innerHTML = row("Base64 (codificar)", b64encode(text)) + row("Base64 (decodificar)", b64decode(text));
    } else {
      panel.innerHTML = row("URL encode", encodeURIComponent(text)) + row("URL decode", decodeURIComponent(text.replace(/\+/g, " ")));
    }
    panel.querySelectorAll(".copy").forEach((b) =>
      b.addEventListener("click", () => copyText(decodeURIComponent(b.dataset.v)))
    );
  }

  input.addEventListener("input", update);
  update();

  return () => {};
}
