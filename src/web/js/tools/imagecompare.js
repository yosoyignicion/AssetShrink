import { wireDropzone } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;
  let aUrl = null;
  let bUrl = null;

  root.innerHTML = `
    <div class="grid-2">
      <div class="dropzone" id="dzA">A · ${t("common.drop")}</div>
      <div class="dropzone" id="dzB">B · ${t("common.drop")}</div>
    </div>
    <input type="file" id="fiA" accept="image/*" hidden>
    <input type="file" id="fiB" accept="image/*" hidden>
    <div class="presets" style="margin-top:1rem;">
      <button class="chip" id="swap">${t("imagecompare.swap")}</button>
      <button class="chip" id="clear">${t("optimize.clear")}</button>
    </div>
    <div id="view" style="margin-top:1.25rem;"></div>`;

  const view = root.querySelector("#view");

  function render() {
    if (!aUrl || !bUrl) {
      view.innerHTML = `<div class="panel"><span class="note">${t("imagecompare.prompt")}</span></div>`;
      return;
    }
    view.innerHTML = `
      <div class="panel">
        <div class="compare">
          <img src="${aUrl}" alt="A">
          <div class="after"><img src="${bUrl}" alt="B"></div>
          <input type="range" min="0" max="100" value="50" aria-label="${t("imagecompare.slider")}">
          <div class="line"></div>
        </div>
        <div class="row-between" style="margin-top:0.5rem;"><span class="note">${t("imagecompare.left")}</span><span class="note">${t("imagecompare.right")}</span></div>
      </div>`;
    const slider = view.querySelector('input[type="range"]');
    const after = view.querySelector(".after");
    const line = view.querySelector(".line");
    slider.addEventListener("input", () => {
      after.style.clipPath = `inset(0 0 0 ${slider.value}%)`;
      line.style.left = `${slider.value}%`;
    });
  }

  function setA(file) {
    if (!file) return;
    if (aUrl) URL.revokeObjectURL(aUrl);
    aUrl = URL.createObjectURL(file);
    root.querySelector("#dzA").textContent = `A · ${file.name}`;
    render();
  }
  function setB(file) {
    if (!file) return;
    if (bUrl) URL.revokeObjectURL(bUrl);
    bUrl = URL.createObjectURL(file);
    root.querySelector("#dzB").textContent = `B · ${file.name}`;
    render();
  }

  wireDropzone(root.querySelector("#dzA"), root.querySelector("#fiA"), ([f]) => setA(f));
  wireDropzone(root.querySelector("#dzB"), root.querySelector("#fiB"), ([f]) => setB(f));

  root.querySelector("#swap").addEventListener("click", () => {
    [aUrl, bUrl] = [bUrl, aUrl];
    render();
  });
  root.querySelector("#clear").addEventListener("click", () => {
    if (aUrl) URL.revokeObjectURL(aUrl);
    if (bUrl) URL.revokeObjectURL(bUrl);
    aUrl = bUrl = null;
    root.querySelector("#dzA").textContent = `A · ${t("common.drop")}`;
    root.querySelector("#dzB").textContent = `B · ${t("common.drop")}`;
    render();
  });

  render();
  return () => {
    if (aUrl) URL.revokeObjectURL(aUrl);
    if (bUrl) URL.revokeObjectURL(bUrl);
  };
}
