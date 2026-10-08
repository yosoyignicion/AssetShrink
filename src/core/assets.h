#ifndef ASSETSHRINK_ASSETS_H
#define ASSETSHRINK_ASSETS_H

#include <cstddef>
#include <string>
#include <string_view>
#include <vector>

namespace assetshrink {

struct Asset {
    std::string_view path;  // p.ej. "/index.html"
    const unsigned char* data;
    std::size_t size;
};

// Definido en el archivo generado en build-time (assets_generated.cpp).
const std::vector<Asset>& get_assets();

const Asset* find_asset(std::string_view path);
std::string mime_for(std::string_view path);

}  // namespace assetshrink

#endif  // ASSETSHRINK_ASSETS_H
