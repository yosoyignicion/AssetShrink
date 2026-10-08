#include <chrono>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <string>
#include <string_view>
#include <thread>
#include <unordered_map>
#include <utility>

#include "config.h"
#include "httplib.h"

#include "core/assets.h"
#include "tools/tools.h"

namespace {

std::string html_escape(const std::string& value) {
    std::string out;
    out.reserve(value.size());
    for (const char c : value) {
        switch (c) {
            case '&': out += "&amp;"; break;
            case '<': out += "&lt;"; break;
            case '>': out += "&gt;"; break;
            case '"': out += "&quot;"; break;
            case '\'': out += "&#39;"; break;
            default: out += c;
        }
    }
    return out;
}

// Metadatos por ruta, leídos de /seo.txt (embebido). Formato: ruta|título|descripción
const std::unordered_map<std::string, std::pair<std::string, std::string>>& seo_table() {
    static const auto table = [] {
        std::unordered_map<std::string, std::pair<std::string, std::string>> map;
        const auto* asset = assetshrink::find_asset("/seo.txt");
        if (!asset) return map;
        std::string content(reinterpret_cast<const char*>(asset->data), asset->size);
        std::istringstream stream(content);
        std::string line;
        while (std::getline(stream, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty() || line[0] == '#') continue;
            const auto first = line.find('|');
            if (first == std::string::npos) continue;
            const auto second = line.find('|', first + 1);
            if (second == std::string::npos) continue;
            map[line.substr(0, first)] = {line.substr(first + 1, second - first - 1),
                                          line.substr(second + 1)};
        }
        return map;
    }();
    return table;
}

// Sirve index.html inyectando los meta de la ruta solicitada.
void render_index(httplib::Response& res, const std::string& path) {
    const auto* asset = assetshrink::find_asset("/index.html");
    if (!asset) {
        res.status = 500;
        res.set_content("index.html no embebido", "text/plain");
        return;
    }
    std::string html(reinterpret_cast<const char*>(asset->data), asset->size);

    std::string title = "Suite de herramientas local";
    std::string desc = "Suite de herramientas local para imagen, texto, código y diseño.";
    std::string key = path;
    if (key.size() > 1 && key.back() == '/') key.pop_back();
    const auto& table = seo_table();
    if (const auto it = table.find(key); it != table.end()) {
        if (!it->second.first.empty()) title = it->second.first;
        if (!it->second.second.empty()) desc = it->second.second;
    }

    const std::string full_title = html_escape(title) + " · AssetShrink";
    std::string meta;
    meta += "<title>" + full_title + "</title>\n";
    meta += "<meta name=\"description\" content=\"" + html_escape(desc) + "\">\n";
    meta += "<meta property=\"og:title\" content=\"" + full_title + "\">\n";
    meta += "<meta property=\"og:description\" content=\"" + html_escape(desc) + "\">\n";
    meta += "<meta property=\"og:type\" content=\"website\">\n";
    meta += "<meta name=\"twitter:card\" content=\"summary_large_image\">\n";
    meta += "<meta name=\"twitter:title\" content=\"" + full_title + "\">\n";
    meta += "<meta name=\"twitter:description\" content=\"" + html_escape(desc) + "\">\n";

    const std::string marker = "<!--SEO-->";
    if (const auto pos = html.find(marker); pos != std::string::npos) {
        html.replace(pos, marker.size(), meta);
    }

    res.set_content(html, "text/html; charset=utf-8");
}

void abrir_navegador_auto(int puerto) {
    std::this_thread::sleep_for(std::chrono::milliseconds(350));
    const std::string url = "http://localhost:" + std::to_string(puerto);
    int status = -1;

#if defined(_WIN32)
    status = std::system(("start " + url).c_str());
#elif defined(__APPLE__)
    status = std::system(("open " + url).c_str());
#elif defined(__linux__)
    status = std::system(("xdg-open " + url + " >/dev/null 2>&1 &").c_str());
#endif

    if (status != 0) {
        std::cerr << "[Warning] No se pudo abrir el navegador. Abre manualmente: " << url
                  << std::endl;
    }
}

bool has_extension(std::string_view path) {
    const auto slash = path.find_last_of('/');
    const auto dot = path.find_last_of('.');
    return dot != std::string_view::npos && (slash == std::string_view::npos || dot > slash);
}

bool serve_asset(httplib::Response& res, std::string_view path) {
    const auto* asset = assetshrink::find_asset(path);
    if (!asset) return false;
    res.set_content(reinterpret_cast<const char*>(asset->data), asset->size,
                    assetshrink::mime_for(path));
    return true;
}

}  // namespace

int main(int argc, char* argv[]) {
    int puerto_base = 8080;
    bool abrir_navegador = true;

    for (int i = 1; i < argc; ++i) {
        const std::string arg = argv[i];
        if (arg == "--version" || arg == "-v") {
            std::cout << PROJECT_NAME << " " << PROJECT_VERSION << std::endl;
            std::cout << "Copyright (c) 2025 AssetShrink · https://github.com/yosoyignicion/AssetShrink"
                      << std::endl;
            return 0;
        }
        if (arg == "--help" || arg == "-h") {
            std::cout << "Uso: " << PROJECT_NAME << " [opciones]\n\n"
                      << "  -v, --version     Muestra la versión y sale\n"
                      << "      --port <n>    Puerto base (intenta n..n+9). Por defecto 8080\n"
                      << "      --no-open     No abrir el navegador automáticamente\n"
                      << "  -h, --help        Muestra esta ayuda\n";
            return 0;
        }
        if (arg == "--no-open") {
            abrir_navegador = false;
        } else if (arg == "--port") {
            if (i + 1 >= argc) {
                std::cerr << "[Fatal Error] --port requiere un valor." << std::endl;
                return 1;
            }
            try {
                const int value = std::stoi(argv[++i]);
                if (value < 1 || value > 65535 - 10) {
                    std::cerr << "[Fatal Error] Puerto fuera de rango: " << value << std::endl;
                    return 1;
                }
                puerto_base = value;
            } catch (...) {
                std::cerr << "[Fatal Error] Valor de --port inválido." << std::endl;
                return 1;
            }
        } else {
            std::cerr << "[Fatal Error] Opción desconocida: " << arg
                      << " (usa --help)" << std::endl;
            return 1;
        }
    }

    httplib::Server svr;

    svr.set_error_handler([](const httplib::Request&, httplib::Response& res) {
        if (res.status == 404) {
            res.set_content(
                "<html><head><meta charset=\"UTF-8\"><title>AssetShrink</title>"
                "<style>body{background:#020617;color:#f1f5f9;font-family:system-ui;"
                "display:flex;flex-direction:column;align-items:center;justify-content:center;"
                "min-height:100vh;margin:0;}h1{font-size:5rem;margin:0;background:linear-gradient("
                "to right,#a78bfa,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:"
                "transparent;}p{color:#64748b;}a{color:#818cf8;}</style>"
                "<h1>404</h1><p>Esta p\u00e1gina no existe en el servidor local.</p>"
                "<a href=\"/\">Volver al inicio</a></html>",
                "text/html; charset=utf-8");
        }
    });

    // API de herramientas (backend C++).
    assetshrink::register_optimize(svr);
    assetshrink::register_resize(svr);
    assetshrink::register_palette(svr);
    assetshrink::register_beautify(svr);
    assetshrink::register_qr(svr);

    // Landing / SPA con meta por ruta.
    svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
        render_index(res, "/");
    });
    svr.Get("/pricing", [](const httplib::Request&, httplib::Response& res) {
        render_index(res, "/pricing");
    });
    svr.Get(R"(/tools/([\w-]+))", [](const httplib::Request& req,
                                     httplib::Response& res) {
        render_index(res, "/tools/" + req.matches[1].str());
    });

    // Assets estáticos embebidos + fallback SPA.
    svr.Get(R"(/.*)", [](const httplib::Request& req, httplib::Response& res) {
        if (serve_asset(res, req.path)) return;
        if (req.path == "/index.html" || !has_extension(req.path)) {
            render_index(res, req.path);
            return;
        }
        res.status = 404;
    });

    // Selector de puerto libre (puerto_base .. puerto_base+9).
    int puerto_final = puerto_base;
    bool enlazado = false;
    for (int i = 0; i < 10; ++i) {
        puerto_final = puerto_base + i;
        if (svr.bind_to_port("localhost", puerto_final)) {
            enlazado = true;
            break;
        }
    }
    if (!enlazado) {
        std::cerr << "[Fatal Error] No hay puertos libres en el rango " << puerto_base << "-"
                  << puerto_base + 9 << "." << std::endl;
        return 1;
    }

    if (abrir_navegador) {
        std::thread hilo_navegador(abrir_navegador_auto, puerto_final);
        hilo_navegador.detach();
    }

    std::cout << "[Success] AssetShrink " << PROJECT_VERSION << " en http://localhost:"
              << puerto_final << std::endl;

    svr.listen_after_bind();
    return 0;
}
