import { copyText } from "../ui.js";

const PROMPTS = [
  { cat: "Escritura", title: "Resumen ejecutivo", text: "Resume el siguiente texto en 5 puntos clave, usando lenguaje claro y directo. Mantén las cifras y nombres propios.\n\nTexto:\n" },
  { cat: "Escritura", title: "Reescribe para claridad", text: "Reescribe el siguiente texto para que sea más claro y conciso, sin perder ninguna idea. Devuelve dos versiones: formal y cercana.\n\nTexto:\n" },
  { cat: "Código", title: "Revisión de código", text: "Revisa el siguiente código. Señala bugs, problemas de seguridad y mejoras de rendimiento. Propón un parche concreto.\n\nCódigo:\n" },
  { cat: "Código", title: "Explicar como a un junior", text: "Explica qué hace el siguiente código, línea por línea, como si se lo contaras a alguien que acaba de empezar a programar.\n\nCódigo:\n" },
  { cat: "Código", title: "Generar tests", text: "Genera tests unitarios completos para el siguiente fragmento. Incluye casos límite y de error.\n\nCódigo:\n" },
  { cat: "Análisis", title: "Comparar opciones", text: "Compara las siguientes opciones en una tabla: pros, contras, coste, complejidad y cuándo elegir cada una. Termina con una recomendación razonada.\n\nOpciones:\n" },
  { cat: "Análisis", title: "Detectar supuestos", text: "Lee el siguiente texto y lista todos los supuestos implícitos que hace. Indica cuáles podrían ser falsos.\n\nTexto:\n" },
  { cat: "Datos", title: "Estructurar información", text: "Convierte la siguiente información desordenada en una tabla bien estructurada y normalizada.\n\nInformación:\n" },
  { cat: "Marketing", title: "Titulares y descripciones", text: "Genera 10 titulares y una descripción de 150 caracteres para el siguiente producto. Tono: profesional y atractivo.\n\nProducto:\n" },
  { cat: "Productividad", title: "Plan de acción", text: "Convierte el siguiente objetivo en un plan de acción paso a paso, con entregables, riesgos y una estimación temporal.\n\nObjetivo:\n" }
];

export function mount(root, ctx) {
  const { t } = ctx;
  const cats = [...new Set(PROMPTS.map((p) => p.cat))];

  root.innerHTML = `
    <div class="panel">
      <div class="form-row">
        <div><label class="field">${t("aiprompts.search")}</label><input type="text" id="q" placeholder="${t("aiprompts.keyword")}"></div>
        <div><label class="field">${t("aiprompts.category")}</label><select id="cat"><option value="">${t("aiprompts.all")}</option>${cats.map((c) => `<option>${c}</option>`).join("")}</select></div>
      </div>
    </div>
    <div class="grid grid-tools" id="list"></div>`;

  const q = root.querySelector("#q");
  const cat = root.querySelector("#cat");
  const list = root.querySelector("#list");

  function render() {
    const term = q.value.toLowerCase();
    list.innerHTML = PROMPTS.filter(
      (p) =>
        (!cat.value || p.cat === cat.value) &&
        (!term || (p.title + p.text).toLowerCase().includes(term))
    )
      .map(
        (p, i) => `
        <div class="tool-card">
          <span class="live-tag">${p.cat}</span>
          <h2 style="font-size:1rem; margin:0;">${p.title}</h2>
          <p style="white-space:pre-wrap;">${p.text.slice(0, 90)}…</p>
          <button class="btn-sm copy" data-i="${PROMPTS.indexOf(p)}">${t("common.copy")}</button>
        </div>`
      )
      .join("");
    list.querySelectorAll(".copy").forEach((b) =>
      b.addEventListener("click", () => copyText(PROMPTS[Number(b.dataset.i)].text))
    );
  }

  q.addEventListener("input", render);
  cat.addEventListener("change", render);
  render();

  return () => {};
}
