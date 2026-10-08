import { download } from "../ui.js";

export function mount(root, ctx) {
  const { t } = ctx;

  root.innerHTML = `
    <div class="panel">
      <label class="field">${t("qr.content")}</label>
      <input type="text" id="text" value="https://example.com">
      <div class="presets" style="margin-top:0.75rem;" id="presets">
        <button class="chip" data-type="url">${t("qr.preset.url")}</button>
        <button class="chip" data-type="wifi">${t("qr.preset.wifi")}</button>
        <button class="chip" data-type="vcard">${t("qr.preset.vcard")}</button>
        <button class="chip" data-type="email">${t("qr.preset.email")}</button>
        <button class="chip" data-type="tel">${t("qr.preset.tel")}</button>
        <button class="chip" data-type="sms">${t("qr.preset.sms")}</button>
        <button class="chip" data-type="geo">${t("qr.preset.geo")}</button>
      </div>
      <div class="form-row" style="margin-top:1rem;">
        <div><label class="field">${t("qr.size")}</label><input type="number" id="size" value="320" min="64" max="2048"></div>
        <div><label class="field">${t("qr.ecc")}</label>
          <select id="ecc"><option value="L">L (7%)</option><option value="M" selected>M (15%)</option><option value="Q">Q (25%)</option><option value="H">H (30%)</option></select>
        </div>
        <div><label class="field">${t("qr.margin")}</label><input type="number" id="margin" value="2" min="0" max="8"></div>
      </div>
      <div class="presets" style="margin-top:1rem;">
        <button class="chip active" data-fmt="png">PNG</button>
        <button class="chip" data-fmt="svg">SVG</button>
        <button class="btn btn-primary" id="gen" style="margin-left:auto;">${t("common.generate")}</button>
      </div>
    </div>
    <div class="panel" id="result" style="text-align:center; display:none;">
      <div id="holder"></div>
      <button class="btn-sm" id="dl" style="margin-top:1rem;">${t("common.download")}</button>
    </div>`;

  const chips = [...root.querySelectorAll(".chip[data-fmt]")];
  let fmt = "png";
  chips.forEach((c) =>
    c.addEventListener("click", () => {
      chips.forEach((x) => x.classList.remove("active"));
      c.classList.add("active");
      fmt = c.dataset.fmt;
    })
  );

  // Plantillas de contenido: rellenan el campo con un ejemplo válido del tipo elegido.
  const TEMPLATES = {
    url: "https://example.com",
    wifi: "WIFI:T:WPA;S:MiRed;P:contrasena;;",
    vcard: "BEGIN:VCARD\nVERSION:3.0\nN:Apellido;Nombre\nTEL:+34600000000\nEMAIL:nombre@example.com\nEND:VCARD",
    email: "mailto:nombre@example.com?subject=Hola",
    tel: "tel:+34600000000",
    sms: "SMSTO:+34600000000:Hola",
    geo: "geo:40.4168,-3.7038"
  };
  root.querySelectorAll("#presets .chip").forEach((c) =>
    c.addEventListener("click", () => {
      root.querySelector("#text").value = TEMPLATES[c.dataset.type] || "";
      root.querySelector("#gen").click();
    })
  );

  root.querySelector("#gen").addEventListener("click", () => {
    const text = root.querySelector("#text").value.trim();
    if (!text) return;
    const params = new URLSearchParams({
      text,
      size: root.querySelector("#size").value,
      ecc: root.querySelector("#ecc").value,
      margin: root.querySelector("#margin").value,
      format: fmt
    });
    const url = `/api/qr?${params}`;
    const result = root.querySelector("#result");
    const holder = root.querySelector("#holder");
    result.style.display = "block";
    holder.innerHTML = `<img class="preview" style="margin:0 auto; max-width:320px;" src="${url}" alt="QR">`;
    root.querySelector("#dl").onclick = () =>
      download(url, `qr.${fmt === "svg" ? "svg" : "png"}`);
  });

  root.querySelector("#gen").click();
  return () => {};
}
