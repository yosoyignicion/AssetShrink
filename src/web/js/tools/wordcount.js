export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <textarea id="txt" aria-label="${t("common.input")}" placeholder="${t("wordcount.placeholder")}" style="min-height:240px;"></textarea>
    </div>
    <div class="grid grid-tools">
      ${statCard("chars", "0", t("common.characters"), "🔡")}
      ${statCard("words", "0", t("common.words"), "🔤")}
      ${statCard("unique", "0", t("common.unique"), "🧬")}
      ${statCard("lines", "0", t("common.lines"), "📄")}
      ${statCard("sentences", "0", t("common.sentences"), "❓")}
      ${statCard("paras", "0", t("common.paragraphs"), "📚")}
      ${statCard("reading", "0", t("common.readtime") + " (" + t("common.min") + ")", "⏱️")}
    </div>`;

  const txt = root.querySelector("#txt");
  function statCard(id, value, label, icon) {
    return `<div class="panel" style="text-align:center;"><div style="font-size:1.4rem;">${icon}</div>
      <div style="font-size:1.8rem; font-weight:900;" id="s-${id}">${value}</div>
      <div class="note">${label}</div></div>`;
  }

  function update() {
    const value = txt.value;
    const words = value.trim() ? value.trim().split(/\s+/) : [];
    const sentences = value.split(/[.!?…]+/).filter((s) => s.trim()).length;
    const paragraphs = value.trim() ? value.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
    const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^\wáéíóúñüà-ÿ]/gi, ""))).size;
    const chars = value.length;
    root.querySelector("#s-chars").textContent = chars.toLocaleString();
    root.querySelector("#s-words").textContent = words.length.toLocaleString();
    root.querySelector("#s-unique").textContent = unique.toLocaleString();
    root.querySelector("#s-lines").textContent = (value ? value.split("\n").length : 0).toLocaleString();
    root.querySelector("#s-sentences").textContent = sentences.toLocaleString();
    root.querySelector("#s-paras").textContent = paragraphs.toLocaleString();
    root.querySelector("#s-reading").textContent = Math.max(0, Math.ceil(words.length / 200));
  }

  txt.addEventListener("input", update);
  update();

  return () => {};
}
