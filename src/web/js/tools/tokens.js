export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">${t("tokens.text")}</label>
      <textarea id="in" style="min-height:200px;" placeholder="${t("tokens.placeholder")}"></textarea>
    </div>
    <div class="grid grid-tools">
      <div class="panel" style="text-align:center;"><div style="font-size:1.6rem;">🔢</div><div style="font-size:2rem;font-weight:900;" id="tokens">0</div><div class="note">${t("tokens.estimated")}</div></div>
      <div class="panel" style="text-align:center;"><div style="font-size:1.6rem;">🔡</div><div style="font-size:2rem;font-weight:900;" id="chars">0</div><div class="note">${t("common.characters")}</div></div>
      <div class="panel" style="text-align:center;"><div style="font-size:1.6rem;">🔤</div><div style="font-size:2rem;font-weight:900;" id="words">0</div><div class="note">${t("common.words")}</div></div>
    </div>
    <p class="note">${t("tokens.note")}</p>`;

  const input = root.querySelector("#in");
  function update() {
    const text = input.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const tokens = Math.ceil(chars / 4);
    root.querySelector("#tokens").textContent = tokens.toLocaleString();
    root.querySelector("#chars").textContent = chars.toLocaleString();
    root.querySelector("#words").textContent = words.toLocaleString();
  }
  input.addEventListener("input", update);
  update();

  return () => {};
}
