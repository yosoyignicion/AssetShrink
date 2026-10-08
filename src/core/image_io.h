#ifndef ASSETSHRINK_IMAGE_IO_H
#define ASSETSHRINK_IMAGE_IO_H

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace assetshrink {

// Punto de color independiente del formato (RGBA, 4 canales, 8 bits).
struct Image {
    std::vector<std::uint8_t> rgba;
    int width = 0;
    int height = 0;
};

// Decodifica PNG/JPEG/WebP/BMP (auto-detección) a RGBA.
bool load_image(const std::uint8_t* data, std::size_t size, Image& out);

// Codifica RGBA al formato solicitado: "webp" | "png" | "jpg" | "jpeg".
bool encode_image(const Image& img, const std::string& format, float quality,
                  bool lossless, std::vector<std::uint8_t>& out);

// Redimensiona con filtro de alta calidad.
bool resize_image(const Image& src, int new_width, int new_height, Image& out);

}  // namespace assetshrink

#endif  // ASSETSHRINK_IMAGE_IO_H
