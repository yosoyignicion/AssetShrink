#include "assets.h"

namespace assetshrink {

namespace {

bool ends_with(std::string_view s, std::string_view suffix) {
    return s.size() >= suffix.size() &&
           s.compare(s.size() - suffix.size(), suffix.size(), suffix) == 0;
}

}  // namespace

const Asset* find_asset(std::string_view path) {
    for (const auto& asset : get_assets()) {
        if (asset.path == path) {
            return &asset;
        }
    }
    return nullptr;
}

std::string mime_for(std::string_view path) {
    if (ends_with(path, ".html")) return "text/html; charset=utf-8";
    if (ends_with(path, ".css")) return "text/css; charset=utf-8";
    if (ends_with(path, ".js") || ends_with(path, ".mjs"))
        return "application/javascript; charset=utf-8";
    if (ends_with(path, ".json")) return "application/json; charset=utf-8";
    if (ends_with(path, ".webmanifest")) return "application/manifest+json";
    if (ends_with(path, ".svg")) return "image/svg+xml";
    if (ends_with(path, ".png")) return "image/png";
    if (ends_with(path, ".jpg") || ends_with(path, ".jpeg")) return "image/jpeg";
    if (ends_with(path, ".webp")) return "image/webp";
    if (ends_with(path, ".gif")) return "image/gif";
    if (ends_with(path, ".ico")) return "image/x-icon";
    if (ends_with(path, ".woff2")) return "font/woff2";
    if (ends_with(path, ".txt")) return "text/plain; charset=utf-8";
    return "application/octet-stream";
}

}  // namespace assetshrink
