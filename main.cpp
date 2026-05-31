#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <thread>
#include <chrono>
#include <cstdlib>
#include <map>
#include <filesystem>

// Librerías de terceros (STB y WebP)
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"
#include <webp/encode.h>
#include <webp/decode.h>

// Servidor Web HTTP
#include "httplib.h"

namespace fs = std::filesystem;

// Función callback para escribir PNG/JPG en memoria RAM
void escribir_a_vector(void* context, void* data, int size) {
    auto* buffer = static_cast<std::vector<uint8_t>*>(context);
    auto* bytes = static_cast<uint8_t*>(data);
    buffer->insert(buffer->end(), bytes, bytes + size);
}

// Hilo secundario para abrir el navegador de forma segura
void abrir_navegador_auto(int puerto) {
    // Esperar para dar tiempo al servidor a levantar el puerto
    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    std::string url = "http://localhost:" + std::to_string(puerto);
    int status = -1;

    #if defined(_WIN32)
        status = std::system(("start " + url).c_str());
    #elif defined(__APPLE__)
        status = std::system(("open " + url).c_str());
    #elif defined(__linux__)
        status = std::system(("xdg-open " + url + " &").c_str());
    #endif

    if (status != 0) {
        std::cerr << "[Warning] No se pudo abrir el navegador de forma autom\u00e1tica. Abre manualmente: " << url << std::endl;
    }
}

// HTML incrustado - 100% Offline (Tailwind simulado mediante CSS nativo inline de alto rendimiento)
const char* INDEX_HTML = R"raw(
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssetShrink PRO v2.1.1</title>
    <!-- Estilos CSS Premium embebidos (100% Offline, no requiere internet) -->
    <style>
        :root { --indigo: #6366f1; --indigo-hover: #4f46e5; --slate-950: #020617; --slate-900: #0f172a; --slate-800: #1e293b; --slate-500: #64748b; --slate-300: #cbd5e1; --slate-100: #f1f5f9; }
        body { background-color: var(--slate-950); color: var(--slate-100); font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; margin: 0; display: flex; flex-direction: column; justify-content: space-between; }
        header { border-bottom: 1px solid var(--slate-900); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        main { max-width: 800px; width: 90%; margin: 2rem auto; flex-grow: 1; display: flex; flex-direction: column; gap: 2rem; }
        h1 { font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 0.5rem; }
        p.desc { color: var(--slate-500); text-align: center; margin-top: 0; }
        .gradient-text { background: linear-gradient(to right, #a78bfa, var(--indigo)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .panel { background: rgba(15, 23, 42, 0.6); border: 1px solid var(--slate-800); border-radius: 1rem; padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        label { font-size: 0.875rem; font-weight: 600; color: var(--slate-300); display: block; margin-bottom: 0.5rem; }
        select, input[type="range"] { width: 100%; padding: 0.75rem; background: #000; border: 1px solid var(--slate-800); border-radius: 0.75rem; color: var(--slate-100); box-sizing: border-box; }
        .presets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
        .btn-preset { background: var(--slate-900); border: 1px solid var(--slate-800); color: var(--slate-300); padding: 0.75rem 0.25rem; font-size: 0.75rem; font-weight: 600; border-radius: 0.75rem; cursor: pointer; transition: 0.2s; }
        .btn-preset.active { background: var(--indigo); border-color: var(--indigo); color: white; }
        #dropzone { border: 2px dashed var(--slate-800); background: rgba(15, 23, 42, 0.4); border-radius: 1rem; padding: 3rem; text-align: center; cursor: pointer; transition: 0.3s; }
        #dropzone:hover { border-color: var(--indigo); }
        #queueCard, #compareCard { background: rgba(15, 23, 42, 0.6); border: 1px solid var(--slate-800); border-radius: 1rem; padding: 1.5rem; display: none; }
        #queueCard.visible, #compareCard.visible { display: block; }
        table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        th { color: var(--slate-500); border-bottom: 1px solid var(--slate-800); padding: 0.75rem; text-align: left; }
        td { padding: 1rem 0.75rem; border-bottom: 1px solid rgba(30, 41, 59, 0.5); }
        .btn-dl { background: var(--indigo); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.75rem; }
        .btn-dl:hover { background: var(--indigo-hover); }
        /* Comparador Split-Screen */
        .compare-viewport { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 0.75rem; overflow: hidden; border: 1px solid var(--slate-800); background: #000; }
        .compare-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
        #imgAfterContainer { position: absolute; inset: 0; width: 100%; height: 100%; clip-path: inset(0 0 0 50%); }
        #compareSlider { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize; z-index: 30; margin: 0; }
        #sliderLine { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--indigo); left: 50%; z-index: 20; }
        .slider-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 2rem; height: 2rem; border-radius: 50%; background: var(--indigo); border: 4px solid var(--slate-950); display: flex; align-items: center; justify-content: center; color: white; }
        footer { border-top: 1px solid var(--slate-900); padding: 1.5rem; text-align: center; font-size: 0.75rem; color: var(--slate-500); }
    </style>
</head>
<body>
    <header>
        <div style="display:flex; justify-content:space-between; width:100%; max-width:850px; margin:0 auto; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
                <span style="font-size:1.5rem; font-weight:900; background: linear-gradient(to right, #a78bfa, var(--indigo)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AssetShrink</span>
                <span style="font-size:0.75rem; font-weight:600; padding:0.25rem 0.5rem; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); color:#818cf8; border-radius:999px;">PRO v2.1.1</span>
            </div>
            <div>
                <select id="langSelect">
                    <option value="es">Espa&ntilde;ol</option>
                    <option value="en">English</option>
                </select>
                <span style="font-size:0.875rem; color:var(--slate-500); margin-left:1rem;">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; margin-right:0.25rem;"></span> <span data-i18n="status-active">Motor C++ Activo</span>
                </span>
            </div>
        </div>
    </header>

    <main>
        <div>
            <h1 data-i18n="hero-title">Compresi&oacute;n de im&aacute;genes extrema, <span class="gradient-text">sin perder calidad</span>.</h1>
            <p class="desc" data-i18n="hero-desc">Convierte y optimiza tus assets de forma local, r&aacute;pida y segura.</p>
        </div>

        <div class="panel">
            <div>
                <label data-i18n="label-format">Formato de salida:</label>
                <select id="formatSelect">
                    <option value="webp">WebP (Recomendado)</option>
                    <option value="png">PNG (Sin p&eacute;rdida)</option>
                    <option value="jpg">JPEG (Est&aacute;ndar)</option>
                </select>
            </div>
            <div>
                <label data-i18n="label-presets">Presets r&aacute;pidos:</label>
                <div class="presets-grid">
                    <button id="presetWeb" class="btn-preset active">Web (70%)</button>
                    <button id="presetPhoto" class="btn-preset">Foto (90%)</button>
                    <button id="presetLossless" class="btn-preset">Lossless</button>
                </div>
            </div>
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <label data-i18n="label-quality">Calidad:</label>
                    <span id="qualityVal" style="font-size:0.875rem; font-weight:bold; color:var(--indigo); padding:0.25rem 0.5rem; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:0.5rem;">75%</span>
                </div>
                <input type="range" id="qualitySlider" min="5" max="100" value="75">
            </div>
        </div>

        <div id="dropzone">
            <input type="file" id="fileInput" style="display:none;" accept="image/png, image/jpeg, image/jpg, image/webp" multiple>
            <p style="font-size:1.125rem; font-weight:500;" data-i18n="drag-text">Arrastra tus im&aacute;genes aqu&iacute; o examina tus archivos</p>
        </div>

        <div id="queueCard">
            <h2 style="font-size:1.25rem; font-weight:bold; margin-top:0;" data-i18n="title-queue">Cola de Procesamiento</h2>
            <div style="overflow-x:auto;">
                <table>
                    <thead>
                        <tr>
                            <th data-i18n="table-file">Archivo</th>
                            <th data-i18n="table-status">Estado</th>
                            <th data-i18n="table-size">Original</th>
                            <th data-i18n="table-optimized">Optimizado</th>
                            <th style="text-align:right;" data-i18n="table-actions">Acci&oacute;n</th>
                        </tr>
                    </thead>
                    <tbody id="queueList"></tbody>
                </table>
            </div>
        </div>

        <div id="compareCard">
            <h2 style="font-size:1.25rem; font-weight:bold; margin-top:0;" data-i18n="title-compare">Comparador Visual en Tiempo Real</h2>
            <div class="compare-viewport">
                <img id="imgBefore" class="compare-img" src="" alt="Antes">
                <span style="position:absolute; top:0.75rem; left:0.75rem; background:rgba(2,6,23,0.8); border:1px solid var(--slate-800); padding:0.25rem 0.5rem; font-size:0.75rem; border-radius:99px; z-index:10;" data-i18n="label-orig">Original</span>

                <div id="imgAfterContainer">
                    <img id="imgAfter" class="compare-img" src="" alt="Despu&eacute;s">
                    <span style="position:absolute; top:0.75rem; right:0.75rem; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); padding:0.25rem 0.5rem; font-size:0.75rem; color:#818cf8; border-radius:99px; z-index:10;" data-i18n="label-opt">Optimizado</span>
                </div>

                <input type="range" id="compareSlider" min="0" max="100" value="50">

                <div id="sliderLine">
                    <div class="slider-handle">
                        <svg xmlns="http://www.w3.org/2000/svg" style="width:1rem; height:1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 9l-4 4 4 4m8 0l4-4-4-4" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer>
        <p data-i18n="footer-text">Procesado en tiempo r&eacute;cord gracias a la eficiencia de C++ &amp; WebP de Google</p>
    </footer>

    <script>
        const translations = {
            es: {
                "status-active": "Motor C++ Activo",
                "hero-title": "Compresi\u00f3n de im\u00e1genes extrema, <span class='gradient-text'>sin perder calidad</span>.",
                "hero-desc": "Convierte y optimiza tus assets de forma local, r\u00e1pida y segura.",
                "label-format": "Formato de salida:",
                "label-presets": "Presets r\u00e1pidos:",
                "label-quality": "Calidad:",
                "drag-text": "Arrastra tus im\u00e1genes aqu\u00ed o examina tus archivos",
                "title-queue": "Cola de Procesamiento",
                "table-file": "Archivo",
                "table-status": "Estado",
                "table-size": "Original",
                "table-optimized": "Optimizado",
                "table-actions": "Acci\u00f3n",
                "title-compare": "Comparador Visual en Tiempo Real",
                "label-orig": "Original",
                "label-opt": "Optimizado",
                "footer-text": "Procesado en tiempo r\u00e9cord gracias a la eficiencia de C++ &amp; WebP de Google",
                "status-queued": "En cola",
                "status-processing": "Procesando...",
                "status-completed": "Completado",
                "status-error": "Error",
                "btn-download": "Descargar"
            },
            en: {
                "status-active": "C++ Engine Active",
                "hero-title": "Extreme image compression, <span class='gradient-text'>without quality loss</span>.",
                "hero-desc": "Convert and optimize your assets locally, quickly and securely.",
                "label-format": "Output format:",
                "label-presets": "Quick presets:",
                "label-quality": "Quality:",
                "drag-text": "Drag your images here or browse files",
                "title-queue": "Processing Queue",
                "table-file": "File",
                "table-status": "Status",
                "table-size": "Original",
                "table-optimized": "Optimized",
                "table-actions": "Action",
                "title-compare": "Real-Time Visual Comparison",
                "label-orig": "Original",
                "label-opt": "Optimized",
                "footer-text": "Processed in record time thanks to C++ &amp; Google WebP efficiency",
                "status-queued": "Queued",
                "status-processing": "Processing...",
                "status-completed": "Completed",
                "status-error": "Error",
                "btn-download": "Download"
            }
        };

        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const queueCard = document.getElementById('queueCard');
        const queueList = document.getElementById('queueList');
        const compareCard = document.getElementById('compareCard');

        const formatSelect = document.getElementById('formatSelect');
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityVal = document.getElementById('qualityVal');
        const langSelect = document.getElementById('langSelect');

        const presetWeb = document.getElementById('presetWeb');
        const presetPhoto = document.getElementById('presetPhoto');
        const presetLossless = document.getElementById('presetLossless');

        const compareSlider = document.getElementById('compareSlider');
        const imgAfterContainer = document.getElementById('imgAfterContainer');
        const sliderLine = document.getElementById('sliderLine');
        const imgBefore = document.getElementById('imgBefore');
        const imgAfter = document.getElementById('imgAfter');

        let isLossless = false;
        let globalLanguage = localStorage.getItem('lang') || 'es';
        let filesQueue = [];

        langSelect.value = globalLanguage;
        updateLanguage(globalLanguage);

        langSelect.addEventListener('change', (e) => {
            globalLanguage = e.target.value;
            localStorage.setItem('lang', globalLanguage);
            updateLanguage(globalLanguage);
        });

        function updateLanguage(lang) {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[lang][key]) {
                    el.innerHTML = translations[lang][key];
                }
            });
        }

        presetWeb.addEventListener('click', () => {
            qualitySlider.value = 70;
            qualityVal.textContent = "70%";
            isLossless = false;
            updatePresetButtons(presetWeb);
        });

        presetPhoto.addEventListener('click', () => {
            qualitySlider.value = 90;
            qualityVal.textContent = "90%";
            isLossless = false;
            updatePresetButtons(presetPhoto);
        });

        presetLossless.addEventListener('click', () => {
            isLossless = true;
            qualityVal.textContent = "Lossless";
            updatePresetButtons(presetLossless);
        });

        function updatePresetButtons(activeBtn) {
            [presetWeb, presetPhoto, presetLossless].forEach(btn => {
                btn.className = "btn-preset";
            });
            activeBtn.className = "btn-preset active";
        }

        qualitySlider.addEventListener('input', (e) => {
            qualityVal.textContent = `${e.target.value}%`;
            isLossless = false;
            presetLossless.className = "btn-preset";
        });

        compareSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            imgAfterContainer.style.clipPath = `inset(0 0 0 ${value}%)`;
            sliderLine.style.left = `${value}%`;
        });

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('drop', (e) => { e.preventDefault(); addFilesToQueue(e.dataTransfer.files); });
        fileInput.addEventListener('change', (e) => { addFilesToQueue(e.target.files); });

        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--indigo)"; });
        });
        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.style.borderColor = "var(--slate-800)"; });
        });

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function addFilesToQueue(filesList) {
            if (filesList.length === 0) return;
            queueCard.classList.add('visible');

            for (let i = 0; i < filesList.length; i++) {
                const file = filesList[i];
                const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                const fileObj = {
                    id: fileId,
                    file: file,
                    originalUrl: URL.createObjectURL(file),
                    optimizedUrl: null,
                    status: 'queued',
                    originalSize: file.size,
                    compressedSize: 0,
                    blob: null
                };

                filesQueue.push(fileObj);
                renderQueueRow(fileObj);
                processQueueItem(fileObj);
            }
        }

        function renderQueueRow(item) {
            const tr = document.createElement('tr');
            tr.id = item.id;
            tr.style.cursor = "pointer";
            tr.innerHTML = `
                <td style="padding:1rem 0.75rem; font-weight:500; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.file.name}</td>
                <td><span class="status" style="font-size:0.75rem; padding:0.25rem 0.5rem; border-radius:0.25rem; background:var(--slate-800); color:var(--slate-500);" data-i18n="status-queued">En cola</span></td>
                <td>${formatBytes(item.originalSize)}</td>
                <td class="optimized-size">-</td>
                <td style="text-align:right;">
                    <button class="btn-dl" style="display:none;" data-i18n="btn-download">Descargar</button>
                </td>
            `;

            tr.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                loadIntoComparator(item);
            });

            queueList.appendChild(tr);
            updateLanguage(globalLanguage);
        }

        function processQueueItem(item) {
            const row = document.getElementById(item.id);
            const statusLabel = row.querySelector('.status');

            statusLabel.textContent = translations[globalLanguage]["status-processing"];
            statusLabel.style.background = "rgba(245,158,11,0.1)";
            statusLabel.style.color = "#fbbf24";
            statusLabel.style.border = "1px solid rgba(245,158,11,0.2)";

            const quality = qualitySlider.value;
            const targetFormat = formatSelect.value;
            const url = `/convert?quality=${quality}&lossless=${isLossless}&format=${targetFormat}`;

            const formData = new FormData();
            formData.append('image', item.file);

            fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(res => {
                if (!res.ok) throw new Error();
                return res.blob();
            })
            .then(blob => {
                item.blob = blob;
                item.compressedSize = blob.size;
                item.optimizedUrl = URL.createObjectURL(blob);
                item.status = 'completed';

                const savedBytes = item.originalSize - blob.size;
                const percent = Math.max(0, ((savedBytes / item.originalSize) * 100).toFixed(0));

                statusLabel.textContent = translations[globalLanguage]["status-completed"];
                statusLabel.style.background = "rgba(16,185,129,0.1)";
                statusLabel.style.color = "#34d399";
                statusLabel.style.border = "1px solid rgba(16,185,129,0.2)";

                row.querySelector('.optimized-size').innerHTML = `
                    <span>${formatBytes(blob.size)}</span>
                    <span style="color:#34d399; font-weight:bold; margin-left:0.5rem;">-${percent}%</span>
                `;

                const dlBtn = row.querySelector('.btn-dl');
                dlBtn.style.display = 'inline-block';
                dlBtn.addEventListener('click', () => {
                    const ext = targetFormat === 'webp' ? '.webp' : (targetFormat === 'png' ? '.png' : '.jpg');
                    const name = item.file.name.substring(0, item.file.name.lastIndexOf('.')) + ext;
                    const a = document.createElement('a');
                    a.href = item.optimizedUrl;
                    a.download = name;
                    a.click();
                });

                if (compareCard.style.display !== 'block') {
                    loadIntoComparator(item);
                }
            })
            .catch(() => {
                item.status = 'error';
                statusLabel.textContent = translations[globalLanguage]["status-error"];
                statusLabel.style.background = "rgba(239,68,68,0.1)";
                statusLabel.style.color = "#f87171";
                statusLabel.style.border = "1px solid rgba(239,68,68,0.2)";
            });
        }

        function loadIntoComparator(item) {
            if (item.status !== 'completed') return;
            compareCard.classList.add('visible');
            imgBefore.src = item.originalUrl;
            imgAfter.src = item.optimizedUrl;

            compareSlider.value = 50;
            imgAfterContainer.style.clipPath = `inset(0 0 0 50%)`;
            sliderLine.style.left = `50%`;
        }
    </script>
</body>
</html>
)raw";

int main(int argc, char* argv[]) {
    httplib::Server svr;

    // Servir la página web principal
    svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(INDEX_HTML, "text/html");
    });

    // Endpoint de conversión /convert con parámetros dinámicos
    svr.Post("/convert", [](const httplib::Request& req, httplib::Response& res) {
        if (!req.has_file("image")) {
            res.status = 400;
            res.set_content("Missing image file", "text/plain");
            return;
        }

        const auto& file = req.get_file_value("image");

        // Obtener parámetros de consulta
        float quality = 75.0f;
        if (req.has_param("quality")) {
            try { quality = std::stof(req.get_param_value("quality")); } catch (...) {}
        }

        bool lossless = false;
        if (req.has_param("lossless")) {
            lossless = req.get_param_value("lossless") == "true";
        }

        std::string format = "webp";
        if (req.has_param("format")) {
            format = req.get_param_value("format");
        }

        // 1. Cargar imagen desde la memoria RAM de forma segura
        int ancho = 0, alto = 0, canales = 0;
        unsigned char* pixeles = nullptr;

        const uint8_t* raw_data = reinterpret_cast<const uint8_t*>(file.content.data());
        size_t raw_size = file.content.size();

        // Detectar si el archivo es WebP analizando la firma mágica "RIFF" y "WEBP"
        bool es_webp = (raw_size > 12 &&
                        raw_data[0] == 'R' && raw_data[1] == 'I' && raw_data[2] == 'F' && raw_data[3] == 'F' &&
                        raw_data[8] == 'W' && raw_data[9] == 'E' && raw_data[10] == 'B' && raw_data[11] == 'P');

        if (es_webp) {
            pixeles = WebPDecodeRGBA(raw_data, raw_size, &ancho, &alto);
            canales = 4;
        } else {
            pixeles = stbi_load_from_memory(raw_data, raw_size, &ancho, &alto, &canales, 4); // Forzar RGBA
            canales = 4;
        }

        if (!pixeles) {
            res.status = 400;
            res.set_content("Could not load image data", "text/plain");
            return;
        }

        std::vector<uint8_t> buffer_salida;

        // 2. Procesar conversión según el formato solicitado
        if (format == "webp") {
            uint8_t* output_webp = nullptr;
            size_t output_size = 0;

            if (lossless) {
                output_size = WebPEncodeLosslessRGBA(pixeles, ancho, alto, ancho * 4, &output_webp);
            } else {
                output_size = WebPEncodeRGBA(pixeles, ancho, alto, ancho * 4, quality, &output_webp);
            }

            if (output_webp && output_size > 0) {
                buffer_salida.assign(output_webp, output_webp + output_size);
                WebPFree(output_webp);
                res.set_content(reinterpret_cast<const char*>(buffer_salida.data()), buffer_salida.size(), "image/webp");
            } else {
                res.status = 500;
                res.set_content("WebP compression failed", "text/plain");
            }
        }
        else if (format == "png") {
            stbi_write_png_to_func(escribir_a_vector, &buffer_salida, ancho, alto, 4, pixeles, ancho * 4);
            res.set_content(reinterpret_cast<const char*>(buffer_salida.data()), buffer_salida.size(), "image/png");
        }
        else if (format == "jpg" || format == "jpeg") {
            stbi_write_jpg_to_func(escribir_a_vector, &buffer_salida, ancho, alto, 4, pixeles, static_cast<int>(quality));
            res.set_content(reinterpret_cast<const char*>(buffer_salida.data()), buffer_salida.size(), "image/jpeg");
        }

        if (es_webp) {
            WebPFree(pixeles);
        } else {
            stbi_image_free(pixeles);
        }
    });

    // 3. Selector Inteligente de Puertos (Evitar colisiones del puerto 8080)
    int puerto_inicial = 8080;
    int puerto_final = puerto_inicial;
    bool enlazado = false;

    for (int i = 0; i < 10; ++i) {
        puerto_final = puerto_inicial + i;
        if (svr.bind_to_port("localhost", puerto_final)) {
            enlazado = true;
            break;
        }
    }

    if (!enlazado) {
        std::cerr << "[Fatal Error] No se encontraron puertos libres en el rango 8080-8089." << std::endl;
        return 1;
    }

    // Arrancar el navegador automáticamente en un hilo seguro controlado
    std::thread hilo_navegador(abrir_navegador_auto, puerto_final);
    hilo_navegador.detach();

    std::cout << "[Success] Servidor local levantado en http://localhost:" << puerto_final << std::endl;

    // Escuchar peticiones de forma continua (Bloquea el hilo principal)
    svr.listen_after_bind();

    return 0;
}
