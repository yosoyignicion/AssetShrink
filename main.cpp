#include <iostream>
#include <string>
#include <vector>
#include <cstdint>
#include <cstring>
#include <cstdlib>
#include <thread>
#include <chrono>
#include <algorithm>

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

#include <webp/encode.h>
#include <webp/decode.h>
#include <httplib.h>

static void abrir_navegador_auto() {
    std::this_thread::sleep_for(std::chrono::milliseconds(300));
#if defined(_WIN32)
    std::system("start http://localhost:8080");
#elif defined(__APPLE__)
    std::system("open http://localhost:8080");
#elif defined(__linux__)
    std::system("xdg-open http://localhost:8080 &");
#endif
}

static void stbi_write_callback(void* context, void* data, int size) {
    auto* buffer = static_cast<std::vector<uint8_t>*>(context);
    auto* bytes = static_cast<uint8_t*>(data);
    buffer->insert(buffer->end(), bytes, bytes + size);
}

static bool is_webp_header(const uint8_t* data, size_t len) {
    return len >= 12 &&
           data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F' &&
           data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P';
}

struct DecodedImage {
    std::vector<uint8_t> pixels;
    int width = 0;
    int height = 0;
    bool ok = false;
};

static DecodedImage decode_image(const uint8_t* data, size_t len) {
    DecodedImage result;
    if (is_webp_header(data, len)) {
        int w, h;
        uint8_t* rgba = WebPDecodeRGBA(data, len, &w, &h);
        if (!rgba) return result;
        result.width = w;
        result.height = h;
        result.pixels.assign(rgba, rgba + w * h * 4);
        WebPFree(rgba);
        result.ok = true;
    } else {
        int w, h, channels;
        unsigned char* img = stbi_load_from_memory(data, static_cast<int>(len), &w, &h, &channels, 4);
        if (!img) return result;
        result.width = w;
        result.height = h;
        result.pixels.assign(img, img + w * h * 4);
        stbi_image_free(img);
        result.ok = true;
    }
    return result;
}

static std::vector<uint8_t> encode_webp(const uint8_t* rgba, int w, int h, int quality, bool lossless) {
    uint8_t* out = nullptr;
    size_t len;
    if (lossless) {
        len = WebPEncodeLosslessRGBA(rgba, w, h, w * 4, &out);
    } else {
        len = WebPEncodeRGBA(rgba, w, h, w * 4, quality, &out);
    }
    if (!out || len == 0) {
        WebPFree(out);
        return {};
    }
    std::vector<uint8_t> result(out, out + len);
    WebPFree(out);
    return result;
}

static std::vector<uint8_t> encode_png(const uint8_t* rgba, int w, int h) {
    std::vector<uint8_t> buffer;
    int ok = stbi_write_png_to_func(stbi_write_callback, &buffer, w, h, 4, rgba, w * 4);
    if (!ok) return {};
    return buffer;
}

static std::vector<uint8_t> encode_jpg(const uint8_t* rgba, int w, int h, int quality) {
    std::vector<uint8_t> buffer;
    int ok = stbi_write_jpg_to_func(stbi_write_callback, &buffer, w, h, 4, rgba, quality);
    if (!ok) return {};
    return buffer;
}

static const char* content_type_for(const std::string& fmt) {
    if (fmt == "png") return "image/png";
    if (fmt == "jpg")  return "image/jpeg";
    return "image/webp";
}

static const char* extension_for(const std::string& fmt) {
    if (fmt == "png") return ".png";
    if (fmt == "jpg")  return ".jpg";
    return ".webp";
}

static const char HTML[] = R"raw(
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssetShrink PRO v2.1</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans">
    
    <!-- HEADER -->
    <header class="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <svg class="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">AssetShrink</span>
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">PRO v2.1</span>
            </div>
            
            <div class="flex items-center gap-4">
                <select id="langSelect" class="bg-slate-900 border border-slate-800 rounded-lg text-xs px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500">
                    <option value="es">Espa&ntilde;ol</option>
                    <option value="en">English</option>
                </select>
                <span class="text-sm text-slate-400 flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> <span data-i18n="status-active">Motor C++ Activo</span>
                </span>
            </div>
        </div>
    </header>

    <!-- MAIN CONTAINER -->
    <main class="max-w-4xl w-full mx-auto px-6 py-12 flex-grow flex flex-col gap-8">
        <div class="text-center space-y-3">
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight" data-i18n="hero-title">Compresi&oacute;n de im&aacute;genes extrema, <span class="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">sin perder calidad</span>.</h1>
            <p class="text-slate-400 max-w-lg mx-auto text-sm md:text-base" data-i18n="hero-desc">Convierte y optimiza tus assets de forma local, r&aacute;pida y segura.</p>
        </div>

        <!-- PANEL DE CONFIGURACI&Oacute;N GLOBAL -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-300" data-i18n="label-format">Formato de salida:</label>
                    <select id="formatSelect" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                        <option value="webp">WebP (Recomendado)</option>
                        <option value="png">PNG (Sin p&eacute;rdida)</option>
                        <option value="jpg">JPEG (Est&aacute;ndar)</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-300" data-i18n="label-presets">Presets r&aacute;pidos:</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button id="presetWeb" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-1 rounded-xl transition">Web (70%)</button>
                        <button id="presetPhoto" class="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-3 px-1 rounded-xl transition">Foto (90%)</button>
                        <button id="presetLossless" class="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-3 px-1 rounded-xl transition">Lossless</button>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <label class="text-sm font-semibold text-slate-300" data-i18n="label-quality">Calidad:</label>
                        <span id="qualityVal" class="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">75%</span>
                    </div>
                    <input type="range" id="qualitySlider" min="5" max="100" value="75" class="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                </div>
            </div>
        </div>

        <!-- ZONA DRAG AND DROP (MULTI-ARCHIVO) -->
        <div id="dropzone" class="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group backdrop-blur flex flex-col items-center justify-center min-h-[180px]">
            <input type="file" id="fileInput" class="hidden" accept="image/png, image/jpeg, image/jpg, image/webp" multiple>
            <div class="space-y-3 pointer-events-none">
                <div class="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                </div>
                <p class="text-base font-medium text-slate-200" data-i18n="drag-text">Arrastra tus im&aacute;genes aqu&iacute; o examina tus archivos</p>
            </div>
        </div>

        <!-- COLA DE PROCESAMIENTO (BATCH QUEUE) -->
        <div id="queueCard" class="hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur">
            <h2 class="text-lg font-bold text-slate-200" data-i18n="title-queue">Cola de Procesamiento</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-slate-300">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-500 text-xs">
                            <th class="py-3 font-semibold" data-i18n="table-file">Archivo</th>
                            <th class="py-3 font-semibold" data-i18n="table-status">Estado</th>
                            <th class="py-3 font-semibold" data-i18n="table-size">Original</th>
                            <th class="py-3 font-semibold" data-i18n="table-optimized">Optimizado</th>
                            <th class="py-3 font-semibold text-right" data-i18n="table-actions">Acci&oacute;n</th>
                        </tr>
                    </thead>
                    <tbody id="queueList">
                    </tbody>
                </table>
            </div>
        </div>

        <!-- COMPARADOR VISUAL (SPLIT-SCREEN) -->
        <div id="compareCard" class="hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur">
            <h2 class="text-lg font-bold text-slate-200" data-i18n="title-compare">Comparador Visual en Tiempo Real</h2>
            <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 select-none">
                <img id="imgBefore" class="absolute inset-0 w-full h-full object-contain pointer-events-none" src="" alt="Antes">
                <span class="absolute top-3 left-3 bg-slate-950/80 text-xs px-2.5 py-1 rounded-full border border-slate-800 backdrop-blur pointer-events-none z-10" data-i18n="label-orig">Original</span>
                
                <div id="imgAfterContainer" class="absolute inset-0 w-full h-full pointer-events-none z-0" style="clip-path: inset(0 0 0 50%);">
                    <img id="imgAfter" class="w-full h-full object-contain" src="" alt="Despu&eacute;s">
                    <span class="absolute top-3 right-3 bg-indigo-950/80 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20 text-indigo-300 backdrop-blur pointer-events-none" data-i18n="label-opt">Optimizado</span>
                </div>

                <input type="range" id="compareSlider" min="0" max="100" value="50" class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30">
                
                <div id="sliderLine" class="absolute top-0 bottom-0 w-1 bg-indigo-500 pointer-events-none shadow-[0_0_15px_rgba(99,102,241,0.6)] z-20" style="left: 50%;">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-500 border-4 border-slate-900 flex items-center justify-center shadow-lg text-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 9l-4 4 4 4m8 0l4-4-4-4" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p data-i18n="footer-text">Procesado en tiempo r&eacute;cord gracias a la eficiencia de C++ &amp; WebP de Google</p>
    </footer>

    <script>
        const translations = {
            es: {
                "status-active": "Motor C++ Activo",
                "hero-title": "Compresi\u00f3n de im\u00e1genes extrema, <span class='bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent'>sin perder calidad</span>.",
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
                "hero-title": "Extreme image compression, <span class='bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent'>without quality loss</span>.",
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
                btn.className = "bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-3 px-1 rounded-xl transition";
            });
            activeBtn.className = "bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-1 rounded-xl transition";
        }

        qualitySlider.addEventListener('input', (e) => {
            qualityVal.textContent = `${e.target.value}%`;
            isLossless = false;
            presetLossless.className = "bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold py-3 px-1 rounded-xl transition";
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
            dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.classList.add('border-indigo-500', 'bg-indigo-500/5'); });
        });
        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.classList.remove('border-indigo-500', 'bg-indigo-500/5'); });
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
            queueCard.classList.remove('hidden');

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
            tr.className = "border-b border-slate-900 hover:bg-slate-900/20 cursor-pointer transition";
            tr.innerHTML = `
                <td class="py-4 font-medium text-slate-200 truncate max-w-[200px]">${item.file.name}</td>
                <td class="py-4"><span class="status text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded" data-i18n="status-queued">En cola</span></td>
                <td class="py-4">${formatBytes(item.originalSize)}</td>
                <td class="py-4 optimized-size">-</td>
                <td class="py-4 text-right">
                    <button class="download-btn hidden bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition" data-i18n="btn-download">Descargar</button>
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
            statusLabel.className = "status text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded";
            
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
                statusLabel.className = "status text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-semibold";
                
                row.querySelector('.optimized-size').innerHTML = `
                    <span>${formatBytes(blob.size)}</span>
                    <span class="text-xs text-emerald-400 ml-1.5 font-bold">-${percent}%</span>
                `;

                const dlBtn = row.querySelector('.download-btn');
                dlBtn.classList.remove('hidden');
                dlBtn.addEventListener('click', () => {
                    const ext = targetFormat === 'webp' ? '.webp' : (targetFormat === 'png' ? '.png' : '.jpg');
                    const name = item.file.name.substring(0, item.file.name.lastIndexOf('.')) + ext;
                    const a = document.createElement('a');
                    a.href = item.optimizedUrl;
                    a.download = name;
                    a.click();
                });

                if (compareCard.classList.contains('hidden')) {
                    loadIntoComparator(item);
                }
            })
            .catch(() => {
                item.status = 'error';
                statusLabel.textContent = translations[globalLanguage]["status-error"];
                statusLabel.className = "status text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded font-semibold";
            });
        }

        function loadIntoComparator(item) {
            if (item.status !== 'completed') return;
            compareCard.classList.remove('hidden');
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

int main() {
    httplib::Server svr;

    svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(HTML, "text/html");
    });

    svr.Post("/convert", [](const httplib::Request& req, httplib::Response& res) {
        if (!req.has_file("image")) {
            res.status = 400;
            res.set_content("No image file provided", "text/plain");
            return;
        }

        const auto file = req.get_file_value("image");

        float quality = 75.0f;
        if (req.has_param("quality")) {
            try {
                quality = std::stof(req.get_param_value("quality"));
                if (quality < 1.0f) quality = 1.0f;
                if (quality > 100.0f) quality = 100.0f;
            } catch (...) {}
        } else if (req.has_file("quality")) {
            try {
                quality = std::stof(req.get_file_value("quality").content);
                if (quality < 1.0f) quality = 1.0f;
                if (quality > 100.0f) quality = 100.0f;
            } catch (...) {}
        }

        bool lossless = false;
        if (req.has_param("lossless")) {
            lossless = req.get_param_value("lossless") == "true";
        } else if (req.has_file("lossless")) {
            lossless = req.get_file_value("lossless").content == "true";
        }

        std::string format = "webp";
        if (req.has_param("format")) {
            format = req.get_param_value("format");
        } else if (req.has_file("format")) {
            format = req.get_file_value("format").content;
        }

        const uint8_t* raw = reinterpret_cast<const uint8_t*>(file.content.data());
        size_t raw_len = file.content.size();

        auto decoded = decode_image(raw, raw_len);
        if (!decoded.ok) {
            res.status = 400;
            res.set_content("Failed to decode image", "text/plain");
            return;
        }

        std::vector<uint8_t> output;
        if (format == "png") {
            output = encode_png(decoded.pixels.data(), decoded.width, decoded.height);
        } else if (format == "jpg") {
            output = encode_jpg(decoded.pixels.data(), decoded.width, decoded.height, static_cast<int>(quality));
        } else {
            output = encode_webp(decoded.pixels.data(), decoded.width, decoded.height, static_cast<int>(quality), lossless);
        }

        if (output.empty()) {
            res.status = 500;
            res.set_content("Encoding failed", "text/plain");
            return;
        }

        auto filename = file.filename;
        auto dot = filename.rfind('.');
        if (dot != std::string::npos) filename = filename.substr(0, dot);
        filename += extension_for(format);

        res.set_content(reinterpret_cast<const char*>(output.data()), output.size(), content_type_for(format));
    });

    std::cout << "AssetShrink v2.1 — http://localhost:8080" << std::endl;

    std::thread(abrir_navegador_auto).detach();

    svr.listen("0.0.0.0", 8080);

    return 0;
}
