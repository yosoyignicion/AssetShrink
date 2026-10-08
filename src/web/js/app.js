import { CATEGORIES, toolById, toolsOfCategory, allTools } from "./tools.js";
import { t, pick, getLang, setLang } from "./i18n.js";
import { escapeHtml, setPendingPaste, linkLabels, toast, download } from "./ui.js";

const navEl = document.getElementById("nav");
const mainEl = document.getElementById("app");
const footerEl = document.getElementById("footer");

let unmountCurrent = null;
let routeToken = 0;

const LANGS = [
  ["es", "Español"],
  ["en", "English"]
];

/* ---------- storage: favoritos y recientes ---------- */
function getList(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function setList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function isFavorite(id) {
  return getList("favorites").includes(id);
}
function toggleFavorite(id) {
  const list = getList("favorites");
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1);
  else list.push(id);
  setList("favorites", list);
}
function pushRecent(id) {
  const list = getList("recent").filter((x) => x !== id);
  list.unshift(id);
  setList("recent", list.slice(0, 6));
}

/* ---------- tema ---------- */
function applyTheme(theme, persist = true) {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) localStorage.setItem("theme", theme);
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.textContent = theme === "light" ? "🌙" : "☀️";
    btn.setAttribute("aria-label", theme === "light" ? t("palette.dark") : t("palette.light"));
  }
}
function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}
function toggleTheme() {
  applyTheme(currentTheme() === "light" ? "dark" : "light", true);
}

/* ---------- título / navegación ---------- */
function setTitle(suffix) {
  document.title = suffix ? `${suffix} · AssetShrink` : "AssetShrink — Suite de herramientas local";
}

export function navigate(path) {  if (path === location.pathname + location.search) {
    renderRoute();
    return;
  }
  history.pushState({}, "", path);
  renderRoute();
}

/* ---------- nav ---------- */
function navTemplate() {
  const dropdowns = CATEGORIES.map(
    (cat) => `
    <div class="nav-item" data-cat="${cat.id}">
      <button type="button" class="nav-link" aria-haspopup="true" aria-expanded="false">${cat.icon} ${pick(cat.label)} <span style="font-size:0.6rem;">▾</span></button>
      <div class="dropdown">
        ${toolsOfCategory(cat)
          .map(
            (tool) => `
          <a href="/tools/${tool.id}">
            <span class="ic">${tool.icon}</span>
            <span><span class="tt">${pick(tool.title)}</span><br><span class="ds">${pick(tool.desc)}</span></span>
          </a>`
          )
          .join("")}
      </div>
    </div>`
  ).join("");

  const options = LANGS.map(
    ([code, name]) => `<option value="${code}" ${code === getLang() ? "selected" : ""}>${name}</option>`
  ).join("");

  const theme = currentTheme();

  return `
  <header class="nav">
    <div class="nav-inner">
      <a class="brand" href="/">
        <span class="gradient-text">AssetShrink</span>
        <span class="brand-badge">SUITE</span>
      </a>
      <button class="icon-btn" id="navToggle" aria-label="Menu">☰</button>
      <nav class="nav-links" id="navLinks">
        <a class="nav-link" href="/">${t("nav.home")}</a>
        ${dropdowns}
        <a class="nav-link" href="/pricing">${t("nav.pricing")}</a>
      </nav>
      <div class="nav-actions">
        <button class="nav-icon" id="paletteBtn" title="${t("palette.open")}" aria-label="${t("palette.open")}">🔍</button>
        <button class="nav-icon" id="settingsBtn" title="${t("settings.open")}" aria-label="${t("settings.open")}">⚙️</button>
        <button class="nav-icon" id="themeToggle" title="${t("palette.theme")}" aria-label="${theme === "light" ? t("palette.dark") : t("palette.light")}">${theme === "light" ? "🌙" : "☀️"}</button>
        <select class="lang-select" id="langSelect" aria-label="${t("nav.lang")}">${options}</select>
      </div>
    </div>
  </header>`;
}

function renderNav() {
  navEl.innerHTML = navTemplate();
  const links = document.getElementById("navLinks");

  document.getElementById("navToggle").addEventListener("click", () => links.classList.toggle("open"));
  document.getElementById("paletteBtn").addEventListener("click", () => openPalette());
  document.getElementById("settingsBtn").addEventListener("click", () => openSettings());
  document.getElementById("themeToggle").addEventListener("click", () => toggleTheme());

  document.querySelectorAll(".nav-item").forEach((item) => {
    const trigger = item.querySelector(".nav-link");
    let closeTimer = null;
    const setOpen = (open) => {
      item.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", String(open));
    };
    // Cierre diferido: da margen a que el puntero cruce el hueco hacia el panel.
    const openNow = () => {
      clearTimeout(closeTimer);
      // Cierra el resto de categorías al instante para que no se solapen.
      document.querySelectorAll(".nav-item.open").forEach((other) => {
        if (other !== item) other.classList.remove("open");
      });
      setOpen(true);
    };
    const closeSoon = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => setOpen(false), 110);
    };
    item.addEventListener("mouseenter", openNow);
    item.addEventListener("mouseleave", closeSoon);
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("open"));
      setOpen(!wasOpen);
    });
    item.querySelectorAll(".dropdown a").forEach((a) =>
      a.addEventListener("click", () => {
        clearTimeout(closeTimer);
        setOpen(false);
        links.classList.remove("open");
      })
    );
  });

  document.getElementById("langSelect").addEventListener("change", (e) => {
    setLang(e.target.value);
    applyTheme(currentTheme(), !!localStorage.getItem("theme"));
    renderNav();
    footerEl.innerHTML = footerTemplate();
    if (document.getElementById("paletteOverlay")?.classList.contains("open")) {
      renderPaletteItems(document.getElementById("paletteInput").value);
    }
    renderRoute();
  });
}

function footerTemplate() {
  const cats = CATEGORIES.map((c) => `<a href="/tools/${c.tools[0]}">${c.icon} ${pick(c.label)}</a>`).join("");
  return `
  <footer>
    <div class="footer-inner">
      <div>
        <div class="brand" style="margin-bottom:0.6rem;"><span class="gradient-text">AssetShrink</span></div>
        <p class="note">${t("footer.tagline")}</p>
      </div>
      <div>
        <div class="footer-title">${t("footer.product")}</div>
        <a href="/">${t("nav.home")}</a>
        <a href="/pricing">${t("nav.pricing")}</a>
        <a href="https://github.com/yosoyignicion/AssetShrink" target="_blank" rel="noopener">GitHub</a>
      </div>
      <div>
        <div class="footer-title">${t("footer.features")}</div>
        <a href="/">${t("feature.private.t")}</a>
        <a href="/">${t("feature.fast.t")}</a>
        <a href="/">${t("feature.light.t")}</a>
      </div>
      <div>
        <div class="footer-title">${t("footer.categories")}</div>
        ${cats}
      </div>
    </div>
    <div class="footer-bottom">© ${new Date().getFullYear()} AssetShrink · ${t("footer.rights")}</div>
  </footer>`;
}

function toolCard(tool, i = 0) {
  return `
    <a class="tool-card" href="/tools/${tool.id}" data-cat="${tool.category}" style="--i:${i}">
      <span class="ic">${tool.icon}</span>
      <h3>${pick(tool.title)}</h3>
      <p>${pick(tool.desc)}</p>
      <span class="live-tag">LOCAL</span>
    </a>`;
}

function categoryOf(id) {
  const cat = CATEGORIES.find((c) => c.tools.includes(id));
  return cat ? cat.id : "";
}

function quickSection(title, tools, anchor) {  if (!tools.length) return "";
  return `<section id="${anchor}" style="margin-top:2.5rem;">
      <h2 class="section-title">${title}</h2>
      <div class="grid grid-tools" style="margin-top:1rem;">${tools.map((t, i) => toolCard(t, i)).join("")}</div>
    </section>`;
}

function renderHome() {
  setTitle("");
  const total = allTools().length;
  const sections = CATEGORIES.map(
    (cat) => `
    <section class="cat-block" data-cat="${cat.id}">
      <div class="cat-head"><span class="ic">${cat.icon}</span><h2 class="section-title">${pick(cat.label)}</h2></div>
      <div class="grid grid-tools">${toolsOfCategory(cat).map((t, i) => toolCard(t, i)).join("")}</div>
    </section>`
  ).join("");

  const favTools = getList("favorites").map(toolById).filter(Boolean);
  const recentTools = getList("recent").map(toolById).filter(Boolean);

  mainEl.innerHTML = `
    <div class="container">
      <section class="hero">
        <span class="pill">🔒 ${t("hero.badge")}</span>
        <h1>${t("hero.title1")} <span class="gradient-text">${t("hero.title2")}</span></h1>
        <p>${t("hero.desc")}</p>
        <div class="cta-row">
          <button class="btn btn-primary" id="exploreBtn">${t("hero.cta")} →</button>
          <a class="btn btn-ghost" href="/pricing">${t("hero.cta2")}</a>
        </div>
        <div class="stats">
          <div class="stat"><b>${total}</b><span>${t("stats.tools")}</span></div>
          <div class="stat"><b>0</b><span>${t("stats.local")}</span></div>
          <div class="stat"><b>0</b><span>${t("stats.offline")}</span></div>
        </div>
      </section>

      ${quickSection(t("home.favorites"), favTools, "favorites")}
      ${quickSection(t("home.recent"), recentTools, "recent")}

      <section id="tools" style="margin-top:2.5rem;">
        <h2 class="section-title">${t("home.browse")}</h2>
        <p class="section-sub">${t("home.browseSub")}</p>
        <input type="text" id="toolSearch" placeholder="${t("home.search")}" aria-label="${t("home.search")}" style="max-width:340px; margin-bottom:1.5rem;">
        <p id="searchNone" class="note" style="display:none;">${t("home.searchNone")}</p>
        ${sections}
      </section>

      <section style="margin-top:1rem;">
        <h2 class="section-title">${t("home.why")}</h2>
        <div class="grid feature-grid" style="margin-top:1.25rem;">
          <div class="feature"><div class="ic">🔒</div><h3>${t("feature.private.t")}</h3><p>${t("feature.private.d")}</p></div>
          <div class="feature"><div class="ic">⚡</div><h3>${t("feature.fast.t")}</h3><p>${t("feature.fast.d")}</p></div>
          <div class="feature"><div class="ic">🪶</div><h3>${t("feature.light.t")}</h3><p>${t("feature.light.d")}</p></div>
        </div>
      </section>
    </div>`;

  const explore = document.getElementById("exploreBtn");
  if (explore) explore.addEventListener("click", () => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" }));

  const search = document.getElementById("toolSearch");
  if (search) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      let any = false;
      document.querySelectorAll(".cat-block").forEach((block) => {
        let visible = 0;
        block.querySelectorAll(".tool-card").forEach((card) => {
          const match = !q || card.innerText.toLowerCase().includes(q);
          card.style.display = match ? "" : "none";
          if (match) visible++;
        });
        block.style.display = visible ? "" : "none";
        if (visible) any = true;
      });
      ["favorites", "recent"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = q ? "none" : "";
      });
      const none = document.getElementById("searchNone");
      if (none) none.style.display = any ? "none" : "";
    });
  }
}

function renderPricing() {
  setTitle(t("nav.pricing"));
  const features = [
    t("pricing.f.alltools"),
    t("pricing.f.unlimited"),
    t("pricing.f.nowatermark"),
    t("pricing.f.offline"),
    t("pricing.f.noaccount"),
    t("pricing.f.opensource")
  ];

  mainEl.innerHTML = `
    <div class="container">
      <section class="hero">
        <span class="pill">${t("pricing.badge")}</span>
        <h1>${t("pricing.title")}</h1>
        <p>${t("pricing.sub")}</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="/">${t("pricing.cta.download")}</a>
          <button class="btn btn-ghost" id="shareBtn">${t("pricing.cta.share")}</button>
        </div>
      </section>
      <div class="panel" style="max-width:640px; margin:2rem auto;">
        <h2 class="section-title" style="font-size:1.1rem;">${t("pricing.included")}</h2>
        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem;">
          ${features
            .map(
              (f) =>
                `<li style="display:flex; gap:0.5rem;"><span style="color:var(--green); font-weight:800;">✓</span><span>${f}</span></li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="panel" style="max-width:640px; margin:0 auto; text-align:center;">
        <h2 class="section-title" style="font-size:1.1rem;">${t("pricing.support.title")}</h2>
        <p class="section-sub">${t("pricing.support.desc")}</p>
        <div class="cta-row">
          <a class="btn btn-ghost" href="https://github.com/yosoyignicion/AssetShrink" target="_blank" rel="noopener">⭐ ${t("pricing.cta.github")}</a>
          <button class="btn btn-ghost" id="shareBtn2">${t("pricing.cta.share")}</button>
        </div>
      </div>
      <p class="note" style="text-align:center; margin-top:1.5rem;">${t("pricing.free.note")}</p>
    </div>`;

  const share = async () => {
    const url = location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AssetShrink", text: t("hero.desc"), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast(t("pricing.shared"));
      }
    } catch {}
  };
  document.getElementById("shareBtn").addEventListener("click", share);
  document.getElementById("shareBtn2").addEventListener("click", share);
}

function renderNotFound() {
  setTitle("404");
  mainEl.innerHTML = `
    <div class="container">
      <section class="hero">
        <h1>404</h1>
        <p>Esa página o herramienta no existe.</p>
        <div class="cta-row"><a class="btn btn-primary" href="/">${t("nav.home")}</a></div>
      </section>
    </div>`;
}

async function renderTool(id, token) {
  const tool = toolById(id);
  if (!tool) return renderNotFound();
  setTitle(pick(tool.title));
  pushRecent(id);

  unmountCurrent = null;
  const fav = isFavorite(id);
  mainEl.innerHTML = `
    <div class="container">
      <a class="back-link" href="/">${t("common.back")}</a>
      <div class="tool-head" data-cat="${categoryOf(id)}">
        <span class="ic">${tool.icon}</span>
        <div><h1>${pick(tool.title)}</h1><p>${pick(tool.desc)}</p></div>
        <span class="spacer"></span>
        <button class="star-btn ${fav ? "on" : ""}" id="starBtn" title="${t("tool.favorite")}" aria-pressed="${fav}" aria-label="${t("tool.favorite")}">${fav ? "★" : "☆"}</button>
      </div>
      <div id="tool-root"></div>
    </div>`;

  document.getElementById("starBtn").addEventListener("click", (e) => {
    toggleFavorite(id);
    const on = isFavorite(id);
    e.currentTarget.classList.toggle("on", on);
    e.currentTarget.textContent = on ? "★" : "☆";
    e.currentTarget.setAttribute("aria-pressed", String(on));
  });

  try {
    const mod = await import(tool.module);
    const root = document.getElementById("tool-root");
    const ctx = { t, pick, getLang, id };
    const result = await mod.mount(root, ctx);
    // Si el usuario navegó a otra ruta mientras cargaba, limpiamos y abortamos.
    if (token !== routeToken) {
      if (typeof result === "function") result();
      return;
    }
    linkLabels(mainEl);
    if (typeof result === "function") unmountCurrent = result;
    else if (result && typeof result.unmount === "function") unmountCurrent = result.unmount;
  } catch (err) {
    document.getElementById("tool-root").innerHTML =
      `<div class="panel"><span class="badge err">${t("common.error")}</span> ${err.message}</div>`;
  }
}

/* ---------- command palette ---------- */
let paletteState = { items: [], active: 0 };

function paletteItems() {
  const items = allTools().map((tool) => ({
    icon: tool.icon,
    label: pick(tool.title),
    sub: pick(tool.desc),
    run: () => navigate(`/tools/${tool.id}`)
  }));
  items.push({ icon: "🏠", label: t("palette.home"), sub: "", run: () => navigate("/") });
  items.push({ icon: "💶", label: t("palette.pricing"), sub: "", run: () => navigate("/pricing") });
  items.push({ icon: "🌓", label: t("palette.theme"), sub: "", run: toggleTheme });
  return items;
}

function renderPaletteItems(filter) {
  const q = (filter || "").trim().toLowerCase();
  paletteState.items = paletteItems().filter(
    (it) => !q || `${it.label} ${it.sub}`.toLowerCase().includes(q)
  );
  paletteState.active = 0;
  const list = document.getElementById("paletteList");
  if (!list) return;
  if (!paletteState.items.length) {
    list.innerHTML = `<div class="palette-empty">${t("palette.empty")}</div>`;
    return;
  }
  list.innerHTML = paletteState.items
    .map(
      (it, i) => `
      <div class="palette-item ${i === 0 ? "active" : ""}" data-i="${i}" role="option">
        <span>${it.icon}</span>
        <span><span style="font-weight:600;">${escapeHtml(it.label)}</span>${it.sub ? `<br><span class="note">${escapeHtml(it.sub)}</span>` : ""}</span>
        <span class="k">↵</span>
      </div>`
    )
    .join("");
  list.querySelectorAll(".palette-item").forEach((el) =>
    el.addEventListener("click", () => runPaletteItem(Number(el.dataset.i)))
  );
}

function setPaletteActive(index) {
  const list = document.getElementById("paletteList");
  if (!list) return;
  const items = list.querySelectorAll(".palette-item");
  if (!items.length) return;
  paletteState.active = (index + items.length) % items.length;
  items.forEach((el, i) => el.classList.toggle("active", i === paletteState.active));
  items[paletteState.active].scrollIntoView({ block: "nearest" });
}

function runPaletteItem(index) {
  const item = paletteState.items[index];
  if (!item) return;
  closePalette();
  item.run();
}

function onPaletteKey(e) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setPaletteActive(paletteState.active + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setPaletteActive(paletteState.active - 1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    runPaletteItem(paletteState.active);
  } else if (e.key === "Escape") {
    closePalette();
  }
}

function ensurePalette() {
  if (document.getElementById("paletteOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "paletteOverlay";
  overlay.className = "palette-overlay";
  overlay.innerHTML = `
    <div class="palette" role="dialog" aria-modal="true" aria-label="${t("palette.title")}">
      <input type="text" id="paletteInput" placeholder="${t("palette.placeholder")}" aria-label="${t("palette.title")}" autocomplete="off">
      <div class="palette-list" id="paletteList" role="listbox"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) closePalette();
  });
  const input = overlay.querySelector("#paletteInput");
  input.addEventListener("input", () => renderPaletteItems(input.value));
  input.addEventListener("keydown", onPaletteKey);
}

function openPalette() {
  ensurePalette();
  const overlay = document.getElementById("paletteOverlay");
  overlay.classList.add("open");
  const input = document.getElementById("paletteInput");
  input.value = "";
  renderPaletteItems("");
  input.focus();
}

function closePalette() {
  document.getElementById("paletteOverlay")?.classList.remove("open");
}

/* ---------- ajustes: exportar / importar / reiniciar ---------- */
const OWN_KEYS = ["theme", "lang", "favorites", "recent"];
const isOwnKey = (k) => k.startsWith("as:set:") || OWN_KEYS.includes(k);

function exportSettings() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && isOwnKey(k)) data[k] = localStorage.getItem(k);
  }
  download(
    new Blob([JSON.stringify({ app: "AssetShrink", version: 1, data }, null, 2)], { type: "application/json" }),
    "assetshrink-settings.json"
  );
  toast(t("settings.exported"));
}

function importSettings(file) {
  if (!file) return;
  file
    .text()
    .then((txt) => {
      const parsed = JSON.parse(txt);
      const data = parsed && parsed.data ? parsed.data : parsed;
      let n = 0;
      Object.entries(data || {}).forEach(([k, v]) => {
        if (isOwnKey(k)) {
          localStorage.setItem(k, String(v));
          n++;
        }
      });
      toast(t("settings.imported").replace("{n}", n));
      setTimeout(() => location.reload(), 700);
    })
    .catch(() => toast(t("settings.invalid")));
}

function openSettings() {
  document.getElementById("settingsOverlay")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "settingsOverlay";
  overlay.className = "palette-overlay open";
  overlay.innerHTML = `
    <div class="palette" role="dialog" aria-modal="true" aria-label="${t("settings.title")}" style="max-width:440px;">
      <div style="padding:1.25rem;">
        <h2 class="section-title" style="font-size:1.1rem; margin-top:0;">${t("settings.title")}</h2>
        <p class="note">${t("settings.desc")}</p>
        <div class="presets" style="margin-top:1rem; gap:0.5rem;">
          <button class="btn btn-primary" id="setExport">${t("settings.export")}</button>
          <button class="btn btn-ghost" id="setImport">${t("settings.import")}</button>
          <button class="btn btn-ghost" id="setReset">${t("settings.reset")}</button>
        </div>
        <input type="file" id="setFile" accept="application/json,.json" hidden>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector("#setExport").addEventListener("click", exportSettings);
  overlay.querySelector("#setImport").addEventListener("click", () => overlay.querySelector("#setFile").click());
  overlay.querySelector("#setFile").addEventListener("change", (e) => importSettings(e.target.files[0]));
  overlay.querySelector("#setReset").addEventListener("click", () => {
    if (!confirm(t("settings.resetConfirm"))) return;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && isOwnKey(k)) localStorage.removeItem(k);
    }
    location.reload();
  });
}

/* ---------- router ---------- */
function renderRoute() {
  if (typeof unmountCurrent === "function") {
    try {
      unmountCurrent();
    } catch {}
    unmountCurrent = null;
  }
  routeToken++;
  window.scrollTo({ top: 0 });
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return renderHome();
  if (path === "/pricing") return renderPricing();
  const match = path.match(/^\/tools\/([\w-]+)$/);
  if (match) return renderTool(match[1], routeToken);
  return renderNotFound();
}

document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const anchor = e.target.closest("a");
  if (!anchor) return;
  const href = anchor.getAttribute("href");
  if (!href || !href.startsWith("/") || anchor.target === "_blank") return;
  e.preventDefault();
  navigate(href);
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openPalette();
  } else if (e.key === "Escape") {
    closePalette();
  }
});

// Pegar una imagen (Ctrl+V): la envía a la herramienta de imagen activa o al optimizador.
document.addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items ? e.clipboardData.items : [];
  for (const item of items) {
    if (item.type && item.type.startsWith("image/") && item.type !== "image/svg+xml") {
      const file = item.getAsFile();
      if (!file) continue;
      e.preventDefault();
      const ev = new CustomEvent("as:file", { detail: file, cancelable: true });
      const handled = !document.dispatchEvent(ev);
      if (!handled) {
        setPendingPaste(file);
        navigate("/tools/optimize");
      }
      return;
    }
  }
});

// Arrastrar y soltar una imagen en cualquier parte de la app.
document.addEventListener("dragover", (e) => {
  if (e.dataTransfer && [...e.dataTransfer.items].some((i) => i.kind === "file")) e.preventDefault();
});
document.addEventListener("drop", (e) => {
  if (e.target.closest(".dropzone")) return; // el dropzone ya lo gestiona
  const files = [...(e.dataTransfer?.files || [])].filter(
    (f) => f.type.startsWith("image/") && f.type !== "image/svg+xml"
  );
  if (!files.length) return;
  e.preventDefault();
  const ev = new CustomEvent("as:file", { detail: files[0], cancelable: true });
  const handled = !document.dispatchEvent(ev);
  if (!handled) {
    setPendingPaste(files[0]);
    navigate("/tools/optimize");
  }
});

// Foco luminoso que sigue al cursor sobre las tarjetas (variables CSS --mx/--my).
document.addEventListener(
  "pointermove",
  (e) => {
    const card = e.target.closest && e.target.closest(".tool-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  },
  { passive: true }
);

window.addEventListener("popstate", renderRoute);

setLang(getLang());
if (localStorage.getItem("theme")) {
  applyTheme(currentTheme());
} else {
  const prefersLight = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(prefersLight ? "light" : "dark", false);
}
// Sigue al sistema mientras el usuario no elija un tema explícito.
if (window.matchMedia) {
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) applyTheme(e.matches ? "light" : "dark", false);
  });
}
renderNav();
footerEl.innerHTML = footerTemplate();
renderRoute();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
