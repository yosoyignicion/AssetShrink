import { escapeHtml, copyText, download } from "../ui.js";

function markdownToHtml(md) {
  const codeBlocks = [];
  md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push(`<pre class="result-box mono" style="white-space:pre-wrap;">${escapeHtml(code.replace(/\n$/, ""))}</pre>`);
    return `\u0000${codeBlocks.length - 1}\u0000`;
  });

  const lines = md.split("\n");
  let html = "";
  let inList = false;
  let inQuote = false;

  // Permite solo esquemas seguros; bloquea javascript:/data: para evitar XSS en la vista previa.
  const safeHref = (url) => (/^(https?:|mailto:|tel:|\/|#|\.{1,2}\/)/i.test(url) ? url : "#");

  const inline = (s) =>
    escapeHtml(s)
      .replace(/`([^`]+)`/g, '<code class="mono" style="background:#050b18;padding:0.1rem 0.35rem;border-radius:5px;">$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img src="${safeHref(url)}" alt="${alt}" style="max-width:100%; border-radius:8px;">`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => `<a href="${safeHref(url)}" target="_blank" rel="noopener" style="color:var(--indigo-soft);text-decoration:underline;">${text}</a>`);

  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      html += "</blockquote>";
      inQuote = false;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (/^```?/.test(line)) continue;
    if (/^\s*$/.test(line)) {
      closeList();
      closeQuote();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      closeQuote();
      html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      closeList();
      closeQuote();
      html += "<hr>";
      continue;
    }
    if (/^>\s?/.test(line)) {
      closeList();
      if (!inQuote) {
        html += "<blockquote style='border-left:3px solid var(--indigo);margin:0;padding-left:1rem;color:var(--muted);'>";
        inQuote = true;
      }
      html += `<p>${inline(line.replace(/^>\s?/, ""))}</p>`;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      closeQuote();
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`;
      continue;
    }
    closeList();
    closeQuote();
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  closeQuote();

  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => codeBlocks[Number(i)]);
}

export function mount(root, ctx) {
  const { t, getLang } = ctx;

  root.innerHTML = `
    <div class="grid-2">
      <div class="panel"><label class="field">${t("markdown.md")}</label><textarea id="md" class="mono" style="min-height:340px;"># Título

Escribe **Markdown** y mira la vista previa.

- Lista
- Con elementos

> Cita de ejemplo

\`\`\`js
console.log("hola");
\`\`\`</textarea></div>
      <div class="panel"><label class="field">${t("markdown.preview")}</label><div id="preview"></div></div>
    </div>
    <div class="presets">
      <button class="chip" id="copyMd">${t("markdown.copyMd")}</button>
      <button class="chip" id="copyHtml">${t("markdown.copyHtml")}</button>
      <button class="chip" id="dlMd">${t("markdown.dlMd")}</button>
      <button class="chip" id="dlHtml">${t("markdown.dlHtml")}</button>
    </div>`;

  const md = root.querySelector("#md");
  const preview = root.querySelector("#preview");
  let html = "";

  function update() {
    html = markdownToHtml(md.value);
    preview.innerHTML = html;
  }

  md.addEventListener("input", update);
  root.querySelector("#copyMd").addEventListener("click", () => copyText(md.value));
  root.querySelector("#copyHtml").addEventListener("click", () => copyText(html));
  root.querySelector("#dlMd").addEventListener("click", () =>
    download(new Blob([md.value], { type: "text/markdown" }), "document.md")
  );
  root.querySelector("#dlHtml").addEventListener("click", () => {
    // Documento HTML autónomo (no un fragmento) para poder abrirlo o imprimirlo directamente.
    const doc = `<!doctype html>
<html lang="${getLang()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Document</title>
<style>
body{max-width:760px;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui,sans-serif;color:#111;}
pre{background:#f4f4f5;padding:1rem;border-radius:8px;overflow:auto;}
code{font-family:ui-monospace,monospace;}
blockquote{border-left:3px solid #888;margin:0;padding-left:1rem;color:#555;}
img{max-width:100%;}
</style>
</head>
<body>
${html}
</body>
</html>`;
    download(new Blob([doc], { type: "text/html" }), "document.html");
  });
  update();

  return () => {};
}
