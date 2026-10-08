import { copyText } from "../ui.js";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(n, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}
const rgbToHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  h /= 360; s /= 100; l /= 100;
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

// Luminancia relativa (WCAG 2.1).
function luminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(c1, c2) {
  const l1 = luminance(c1), l2 = luminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="grid-2">
      <div class="panel">
        <label class="field">${t("color.pick")}</label>
        <div style="display:flex; gap:0.75rem; align-items:center;">
          <input type="color" id="c" value="#6366f1" style="width:56px; height:44px; border:none; background:none;">
          <input type="text" id="hex" class="mono" value="#6366f1" aria-label="HEX" style="flex:1;">
        </div>
        <div id="values" class="mono" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.5rem;"></div>
      </div>
      <div class="panel">
        <label class="field">${t("color.contrast")}</label>
        <div class="form-row">
          <div><label class="field">${t("color.fg")}</label><input type="color" id="fg" value="#ffffff"></div>
          <div><label class="field">${t("color.bg")}</label><input type="color" id="bg" value="#6366f1"></div>
        </div>
        <div id="ratio" style="margin-top:1rem;"></div>
      </div>
    </div>
    <div class="panel">
      <label class="field">${t("color.harmony")}</label>
      <div id="harmony" class="swatches" style="margin-top:0.5rem;"></div>
    </div>`;

  const c = root.querySelector("#c");
  const hex = root.querySelector("#hex");
  const values = root.querySelector("#values");
  const fg = root.querySelector("#fg");
  const bg = root.querySelector("#bg");
  const ratio = root.querySelector("#ratio");
  const harmony = root.querySelector("#harmony");

  function row(label, val) {
    return `<div class="row-between"><span class="note">${label}</span>
      <button class="btn-sm ghost copy" data-v="${val}" style="font-family:monospace;">${val} ⧉</button></div>`;
  }

  function renderColor() {
    const rgb = hexToRgb(c.value);
    const hsl = rgbToHsl(rgb);
    values.innerHTML =
      row("HEX", rgbToHex(rgb)) + row("RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`) + row("HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
    values.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", () => copyText(b.dataset.v)));
    renderHarmony(hsl);
  }

  function renderHarmony(hsl) {
    const mk = (h) => rgbToHex(hslToRgb({ ...hsl, h: (h + 360) % 360 }));
    const sets = {
      [t("color.complementary")]: [0, 180],
      [t("color.analogous")]: [-30, 0, 30],
      [t("color.triadic")]: [0, 120, 240],
      [t("color.tetradic")]: [0, 90, 180, 270],
      [t("color.mono")]: [0, 15, 30, 45]
    };
    harmony.innerHTML = Object.entries(sets)
      .map(
        ([name, hs]) => `<div style="display:flex; flex-direction:column; gap:0.4rem;">
          <span class="note">${name}</span>
          <div style="display:flex; gap:0.3rem;">
            ${hs
              .map((h, i) => {
                const col = mk(hsl.h + h);
                return `<div class="swatch" role="button" tabindex="0" aria-label="${col}" data-hex="${col}" title="${col}" style="background:${col}; min-width:38px; height:38px; border-radius:8px; cursor:pointer; flex:1; ${i === 0 ? "outline:2px solid var(--indigo);" : ""}"></div>`;
              })
              .join("")}
          </div>
        </div>`
      )
      .join("");
    harmony.querySelectorAll(".swatch").forEach((el) =>
      el.addEventListener("click", () => {
        c.value = el.dataset.hex;
        hex.value = el.dataset.hex;
        renderColor();
      })
    );
  }

  function renderContrast() {
    const r = contrast(hexToRgb(fg.value), hexToRgb(bg.value));
    const badge = (ok, label) => `<span class="badge ${ok ? "ok" : "err"}">${label} ${ok ? "✓" : "✗"}</span>`;
    ratio.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
        <div aria-hidden="true" style="width:80px; height:44px; border-radius:8px; background:${bg.value}; color:${fg.value}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.5rem; border:1px solid var(--border);">Aa</div>
        <span style="font-size:1.6rem; font-weight:900;">${r.toFixed(2)}:1</span>
      </div>
      <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
        ${badge(r >= 4.5, "AA normal")}
        ${badge(r >= 3, "AA large")}
        ${badge(r >= 7, "AAA normal")}
        ${badge(r >= 4.5, "AAA large")}
      </div>`;
  }

  c.addEventListener("input", () => {
    hex.value = c.value;
    renderColor();
  });
  hex.addEventListener("input", () => {
    if (/^#?[0-9a-fA-F]{3,6}$/.test(hex.value)) {
      c.value = hex.value.startsWith("#") ? hex.value : "#" + hex.value;
      renderColor();
    }
  });
  [fg, bg].forEach((el) => el.addEventListener("input", renderContrast));

  renderColor();
  renderContrast();
  return () => {};
}
