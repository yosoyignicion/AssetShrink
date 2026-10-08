export function elf(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

export function toast(message) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = elf('<div class="toast"></div>');
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(node._timer);
  node._timer = setTimeout(() => node.classList.remove("show"), 1900);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copiado al portapapeles");
  } catch {
    toast("No se pudo copiar");
  }
}

export function download(blobOrUrl, filename) {
  const url = typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof blobOrUrl !== "string") setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = url;
  });
}

export async function postImage(endpoint, file, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${endpoint}${qs ? "?" + qs : ""}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text().catch(() => "Error del servidor"));
  return res.blob();
}

export function wireDropzone(zone, input, onFiles) {
  const open = () => input.click();
  zone.addEventListener("click", open);
  input.addEventListener("change", (e) => onFiles([...e.target.files]));
  ["dragenter", "dragover"].forEach((n) =>
    zone.addEventListener(n, (e) => {
      e.preventDefault();
      zone.classList.add("over");
    })
  );
  ["dragleave", "drop"].forEach((n) =>
    zone.addEventListener(n, (e) => {
      e.preventDefault();
      zone.classList.remove("over");
    })
  );
  zone.addEventListener("drop", (e) => {
    if (e.dataTransfer?.files) onFiles([...e.dataTransfer.files]);
  });
}

export function baseName(name) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

/* ---------- ajustes por herramienta (localStorage) ---------- */
// Prefijo "as:set:" para poder exportar/importar solo nuestros datos.
const SET_PREFIX = "as:set:";

export function saveSettings(id, obj) {
  try {
    localStorage.setItem(SET_PREFIX + id, JSON.stringify(obj));
  } catch {}
}

export function loadSettings(id, defaults = {}) {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SET_PREFIX + id) || "{}") };
  } catch {
    return { ...defaults };
  }
}

export { SET_PREFIX };

/* ---------- pegado de imágenes (Ctrl+V) ---------- */
let pendingPaste = null;

export function setPendingPaste(file) {
  pendingPaste = file;
}

export function takePendingPaste() {
  const file = pendingPaste;
  pendingPaste = null;
  return file;
}

// Registra un destino de pegado. El manejador recibe un File. Devuelve un cleanup.
export function registerPasteTarget(handler) {
  const onFile = (e) => {
    handler(e.detail);
    e.preventDefault();
  };
  document.addEventListener("as:file", onFile);
  const pending = takePendingPaste();
  if (pending) handler(pending);
  return () => document.removeEventListener("as:file", onFile);
}

// Asocia cada <label class="field"> con el siguiente control de formulario sin etiquetar.
// Evita depender de ids manuales en cada herramienta.
export function linkLabels(root) {
  const labels = [...root.querySelectorAll("label.field")];
  const controls = [...root.querySelectorAll("input, select, textarea")];
  const used = new Set();
  let counter = 0;
  for (const label of labels) {
    if (label.htmlFor || label.querySelector("input, select, textarea")) continue;
    const next = controls.find(
      (c) =>
        !used.has(c) &&
        c.type !== "hidden" &&
        (label.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
    if (!next) continue;
    used.add(next);
    if (!next.id) next.id = `fld_${counter++}`;
    label.htmlFor = next.id;
  }
}


