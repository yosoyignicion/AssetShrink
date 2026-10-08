import { escapeHtml } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;
  let mode = "lines";

  root.innerHTML = `
    <div class="grid-2">
      <div class="panel"><label class="field">${t("textdiff.a")}</label><textarea id="a" class="mono" style="min-height:200px;"></textarea></div>
      <div class="panel"><label class="field">${t("textdiff.b")}</label><textarea id="b" class="mono" style="min-height:200px;"></textarea></div>
    </div>
    <div class="panel">
      <div class="row-between">
        <label class="field" style="margin:0;">${t("textdiff.mode")}</label>
        <div class="presets">
          <button class="chip active" data-mode="lines">${t("textdiff.lines")}</button>
          <button class="chip" data-mode="words">${t("textdiff.words")}</button>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="row-between"><label class="field" style="margin:0;">${t("textdiff.diffs")}</label><span id="summary" class="note"></span></div>
      <div class="result-box mono" id="out" style="white-space:pre-wrap;"></div>
    </div>`;

  const a = root.querySelector("#a");
  const b = root.querySelector("#b");
  const out = root.querySelector("#out");
  const summary = root.querySelector("#summary");
  const chips = [...root.querySelectorAll("[data-mode]")];

  function lcs(x, y) {
    const n = x.length;
    const m = y.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const result = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (x[i] === y[j]) result.push(["=", x[i++], y[j++]]);
      else if (dp[i + 1][j] >= dp[i][j + 1]) result.push(["-", x[i++]]);
      else result.push(["+", y[j++]]);
    }
    while (i < n) result.push(["-", x[i++]]);
    while (j < m) result.push(["+", y[j++]]);
    return result;
  }

  function update() {
    const A = a.value;
    const B = b.value;
    let ops;
    if (mode === "words") {
      const ta = A.match(/\S+/g) || [];
      const tb = B.match(/\S+/g) || [];
      if (ta.length * tb.length > 4_000_000) {
        summary.innerHTML = `<span class="badge warn">${t("textdiff.tooBig")}</span>`;
        out.innerHTML = "";
        return;
      }
      ops = lcs(ta, tb);
    } else {
      const la = A.split("\n");
      const lb = B.split("\n");
      if (la.length * lb.length > 4_000_000) {
        summary.innerHTML = `<span class="badge warn">${t("textdiff.tooBigLines")}</span>`;
        out.innerHTML = "";
        return;
      }
      ops = lcs(la, lb);
    }

    let added = 0;
    let removed = 0;
    let html = "";
    for (const [op, tokenA, tokenB] of ops) {
      const value = op === "=" ? tokenA : op === "-" ? tokenA : tokenB;
      if (mode === "words") {
        const text = escapeHtml(value);
        if (op === "=") html += `<span>${text}</span> `;
        else if (op === "-") { removed++; html += `<span style="background:rgba(248,113,113,0.22); color:#fca5a5; border-radius:4px; padding:0 2px;">${text}</span> `; }
        else { added++; html += `<span style="background:rgba(52,211,153,0.22); color:#86efac; border-radius:4px; padding:0 2px;">${text}</span> `; }
      } else {
        const text = escapeHtml(value) || "&nbsp;";
        if (op === "+") { added++; html += `<div style="background:rgba(52,211,153,0.12); color:#86efac;">+ ${text}</div>`; }
        else if (op === "-") { removed++; html += `<div style="background:rgba(248,113,113,0.12); color:#fca5a5;">- ${text}</div>`; }
        else html += `<div style="color:var(--muted-2);">&nbsp;&nbsp;${text}</div>`;
      }
    }
    out.innerHTML = html;
    summary.innerHTML = `<span class="badge ok">+${added}</span> <span class="badge err">-${removed}</span>`;
  }

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      mode = chip.dataset.mode;
      update();
    })
  );

  a.addEventListener("input", update);
  b.addEventListener("input", update);
  update();

  return () => {};
}
