import { copyText, escapeHtml } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div><label class="field">${t("splitter.size")}</label><input type="number" id="size" value="800" min="100" max="8000"></div>
        <div><label class="field">${t("splitter.overlap")}</label><input type="number" id="overlap" value="100" min="0" max="2000"></div>
      </div>
      <label class="field">${t("splitter.text")}</label>
      <textarea id="in" style="min-height:200px;" placeholder="${t("splitter.placeholder")}"></textarea>
      <button class="btn btn-primary" id="go" style="margin-top:0.75rem;">${t("common.process")}</button>
    </div>
    <div class="panel">
      <div class="row-between"><label class="field">${t("splitter.chunks")}</label><span id="summary" class="note">—</span></div>
      <div id="list"></div>
    </div>`;

  const input = root.querySelector("#in");
  const sizeEl = root.querySelector("#size");
  const overlapEl = root.querySelector("#overlap");
  const list = root.querySelector("#list");
  const summary = root.querySelector("#summary");

  root.querySelector("#go").addEventListener("click", () => {
    const text = input.value;
    const size = Math.max(1, Number(sizeEl.value));
    const overlap = Math.min(Number(overlapEl.value), size - 1);
    if (!text.trim()) return;
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(text.length, start + size);
      chunks.push(text.slice(start, end));
      if (end >= text.length) break;
      start = end - overlap;
    }
    summary.innerHTML = `<span class="badge ok">${chunks.length} fragmento(s)</span>`;
    list.innerHTML = chunks
      .map(
        (c, i) => `
        <div class="panel" style="margin-bottom:0.75rem;">
          <div class="row-between"><span class="badge warn">#${i + 1} · ${c.length} ${t("common.characters")}</span>
          <button class="btn-sm copy" data-i="${i}">${t("common.copy")}</button></div>
          <div class="result-box mono" style="margin-top:0.5rem;">${escapeHtml(c)}</div>
        </div>`
      )
      .join("");
    list.querySelectorAll(".copy").forEach((b) =>
      b.addEventListener("click", () => copyText(chunks[Number(b.dataset.i)]))
    );
  });

  return () => {};
}
