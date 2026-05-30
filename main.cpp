#include <iostream>
#include <string>
#include <vector>
#include <cstdint>
#include <cstring>
#include <cstdlib>
#include <thread>
#include <chrono>

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#include <webp/encode.h>
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

static const char HTML[] = R"raw(
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssetShrink PRO</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans">
    <header class="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <svg class="w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">AssetShrink</span>
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">PRO v1.0</span>
            </div>
            <span class="text-sm text-slate-400 flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Motor Local C++ Activo
            </span>
        </div>
    </header>

    <main class="max-w-4xl w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-center gap-8">
        <div class="text-center space-y-3">
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">Compresi&oacute;n de im&aacute;genes extrema, <span class="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">sin perder calidad</span>.</h1>
            <p class="text-slate-400 max-w-lg mx-auto text-sm md:text-base">Convierte y optimiza tus assets JPG/PNG a WebP localmente de manera segura.</p>
        </div>

        <div id="dropzone" class="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur flex flex-col items-center justify-center min-h-[220px]">
            <input type="file" id="fileInput" class="hidden" accept="image/png, image/jpeg, image/jpg">
            <div class="space-y-4 pointer-events-none z-10">
                <div class="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                </div>
                <div class="space-y-1">
                    <p class="text-lg font-medium text-slate-200">Arrastra tu imagen aqu&iacute; o <span class="text-indigo-400 group-hover:text-indigo-300 transition-colors">Drag &amp; Drop</span></p>
                </div>
            </div>
        </div>

        <div id="resultCard" class="hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-8 backdrop-blur">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 border border-slate-800/80 p-5 rounded-xl">
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <label class="text-sm font-semibold text-slate-300">Calidad de compresi&oacute;n (WebP):</label>
                        <span id="qualityVal" class="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">75%</span>
                    </div>
                    <input type="range" id="qualitySlider" min="5" max="100" value="75" class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                </div>
                <div class="flex items-center justify-between md:justify-end md:gap-4">
                    <label class="text-sm font-semibold text-slate-300">Compresi&oacute;n sin p&eacute;rdida (Lossless):</label>
                    <button id="losslessToggle" class="w-12 h-6 bg-slate-800 rounded-full p-1 transition-colors duration-200 focus:outline-none relative">
                        <div class="w-4 h-4 bg-slate-400 rounded-full transition-transform duration-200 translate-x-0" id="toggleCircle"></div>
                    </button>
                </div>
            </div>

            <div class="space-y-2">
                <span class="text-sm font-semibold text-slate-400">Comparativa Interactiva (Arrastra el centro para comparar):</span>
                <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 select-none">
                    <img id="imgBefore" class="absolute inset-0 w-full h-full object-contain pointer-events-none" src="" alt="Antes">
                    <span class="absolute top-3 left-3 bg-slate-950/80 text-xs px-2.5 py-1 rounded-full border border-slate-800 backdrop-blur pointer-events-none z-10">Original</span>
                    
                    <div id="imgAfterContainer" class="absolute inset-0 w-full h-full pointer-events-none z-0" style="clip-path: inset(0 0 0 50%);">
                        <img id="imgAfter" class="w-full h-full object-contain" src="" alt="Despu&eacute;s">
                        <span class="absolute top-3 right-3 bg-indigo-950/80 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20 text-indigo-300 backdrop-blur pointer-events-none">Optimizado</span>
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

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Original</p>
                    <p id="originalSize" class="text-xl font-bold text-slate-300 mt-1">-</p>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">WebP Optimizado</p>
                    <p id="compressedSize" class="text-xl font-bold text-slate-100 mt-1">-</p>
                </div>
                <div class="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl text-center flex flex-col justify-center">
                    <p class="text-xs text-indigo-400 uppercase tracking-wider font-semibold">Espacio Ahorrado</p>
                    <p id="savingPercent" class="text-2xl font-black text-emerald-400 mt-1">-</p>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
                <button id="downloadBtn" class="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-950/40 transition-all duration-200 flex items-center gap-2 text-sm">
                    Descargar WebP Optimizado
                </button>
            </div>
        </div>
    </main>

    <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>Procesado en tiempo r&eacute;cord gracias a la eficiencia de C++ &amp; WebP de Google</p>
    </footer>

    <script>
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const resultCard = document.getElementById('resultCard');
        const originalSize = document.getElementById('originalSize');
        const compressedSize = document.getElementById('compressedSize');
        const savingPercent = document.getElementById('savingPercent');
        const downloadBtn = document.getElementById('downloadBtn');
        
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityVal = document.getElementById('qualityVal');
        const losslessToggle = document.getElementById('losslessToggle');
        const toggleCircle = document.getElementById('toggleCircle');
        
        const compareSlider = document.getElementById('compareSlider');
        const imgAfterContainer = document.getElementById('imgAfterContainer');
        const sliderLine = document.getElementById('sliderLine');
        const imgBefore = document.getElementById('imgBefore');
        const imgAfter = document.getElementById('imgAfter');

        let originalFile = null;
        let currentBlob = null;
        let isLossless = false;

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('border-indigo-500', 'bg-indigo-500/5');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-indigo-500', 'bg-indigo-500/5');
            }, false);
        });

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length > 0) {
                originalFile = e.dataTransfer.files[0];
                renderAndProcess();
            }
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                originalFile = e.target.files[0];
                renderAndProcess();
            }
        });

        compareSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            imgAfterContainer.style.clipPath = `inset(0 0 0 ${value}%)`;
            sliderLine.style.left = `${value}%`;
        });

        qualitySlider.addEventListener('input', (e) => {
            qualityVal.textContent = `${e.target.value}%`;
        });

        qualitySlider.addEventListener('change', () => {
            if (!isLossless) processImage();
        });

        losslessToggle.addEventListener('click', () => {
            isLossless = !isLossless;
            if (isLossless) {
                losslessToggle.classList.add('bg-indigo-600');
                toggleCircle.classList.add('translate-x-6');
                toggleCircle.classList.remove('bg-slate-400');
                toggleCircle.classList.add('bg-white');
                qualitySlider.disabled = true;
                qualitySlider.classList.add('opacity-40');
            } else {
                losslessToggle.classList.remove('bg-indigo-600');
                toggleCircle.classList.remove('translate-x-6');
                toggleCircle.classList.remove('bg-white');
                toggleCircle.classList.add('bg-slate-400');
                qualitySlider.disabled = false;
                qualitySlider.classList.remove('opacity-40');
            }
            processImage();
        });

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function renderAndProcess() {
            if (!originalFile) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imgBefore.src = e.target.result;
                imgAfter.src = e.target.result;
            }
            reader.readAsDataURL(originalFile);

            processImage();
        }

        function processImage() {
            if (!originalFile) return;

            dropzone.classList.add('animate-pulse');
            const quality = qualitySlider.value;
            const url = `/compress?quality=${quality}&lossless=${isLossless}`;

            const formData = new FormData();
            formData.append('image', originalFile);

            fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) throw new Error('Error de procesamiento');
                originalSize.textContent = formatBytes(originalFile.size);
                return response.blob();
            })
            .then(blob => {
                currentBlob = blob;
                compressedSize.textContent = formatBytes(blob.size);
                
                const blobUrl = window.URL.createObjectURL(blob);
                imgAfter.src = blobUrl;

                const saved = originalFile.size - blob.size;
                const percent = Math.max(0, ((saved / originalFile.size) * 100).toFixed(0));
                savingPercent.textContent = `-${percent}%`;

                resultCard.classList.remove('hidden');
                dropzone.classList.remove('animate-pulse');
            })
            .catch(err => {
                alert('No se pudo procesar la imagen con los par\u00e1metros seleccionados.');
                dropzone.classList.remove('animate-pulse');
            });
        }

        downloadBtn.addEventListener('click', () => {
            if (!currentBlob) return;
            const name = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) + '.webp';
            const url = window.URL.createObjectURL(currentBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    </script>
</body>
</html>
)raw";

static std::vector<uint8_t> compress_to_webp(const uint8_t* rgba, int w, int h, int quality, bool lossless) {
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

int main() {
    httplib::Server svr;

    svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
        res.set_content(HTML, "text/html");
    });

    svr.Post("/compress", [](const httplib::Request& req, httplib::Response& res) {
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

        int w, h, channels;
        unsigned char* img = stbi_load_from_memory(
            reinterpret_cast<const unsigned char*>(file.content.data()),
            static_cast<int>(file.content.size()),
            &w, &h, &channels, 4
        );
        if (!img) {
            res.status = 400;
            res.set_content("Failed to decode image", "text/plain");
            return;
        }

        auto webp = compress_to_webp(img, w, h, static_cast<int>(quality), lossless);
        stbi_image_free(img);

        if (webp.empty()) {
            res.status = 500;
            res.set_content("WebP encoding failed", "text/plain");
            return;
        }

        auto filename = file.filename;
        auto dot = filename.rfind('.');
        if (dot != std::string::npos) filename = filename.substr(0, dot);
        filename += ".webp";

        res.set_content(reinterpret_cast<const char*>(webp.data()), webp.size(), "image/webp");
    });

    std::cout << "AssetShrink PRO — http://localhost:8080" << std::endl;

    std::thread(abrir_navegador_auto).detach();

    svr.listen("0.0.0.0", 8080);

    return 0;
}
