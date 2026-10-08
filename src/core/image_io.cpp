#include "image_io.h"

// Implementaciones de terceros (una única vez en todo el binario).
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"
#define STB_IMAGE_RESIZE_IMPLEMENTATION
#include "stb_image_resize2.h"

#include <webp/decode.h>
#include <webp/encode.h>

namespace assetshrink {

namespace {

bool is_webp(const std::uint8_t* d, std::size_t n) {
    return n > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F' &&
           d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P';
}

void write_to_vector(void* ctx, void* data, int size) {
    auto* buffer = static_cast<std::vector<std::uint8_t>*>(ctx);
    auto* bytes = static_cast<const std::uint8_t*>(data);
    buffer->insert(buffer->end(), bytes, bytes + size);
}

}  // namespace

bool load_image(const std::uint8_t* data, std::size_t size, Image& out) {
    unsigned char* pixels = nullptr;
    int w = 0, h = 0, channels = 0;

    if (is_webp(data, size)) {
        pixels = WebPDecodeRGBA(data, size, &w, &h);
    } else {
        pixels = stbi_load_from_memory(data, static_cast<int>(size), &w, &h,
                                       &channels, 4);
    }

    if (!pixels || w <= 0 || h <= 0) {
        return false;
    }

    out.width = w;
    out.height = h;
    out.rgba.assign(pixels, pixels + static_cast<std::size_t>(w) * h * 4);

    if (is_webp(data, size)) {
        WebPFree(pixels);
    } else {
        stbi_image_free(pixels);
    }
    return true;
}

bool encode_image(const Image& img, const std::string& format, float quality,
                  bool lossless, std::vector<std::uint8_t>& out) {
    if (img.width <= 0 || img.height <= 0 || img.rgba.empty()) {
        return false;
    }
    const int stride = img.width * 4;

    if (format == "webp") {
        std::uint8_t* encoded = nullptr;
        std::size_t size = 0;
        if (lossless) {
            size = WebPEncodeLosslessRGBA(img.rgba.data(), img.width, img.height,
                                          stride, &encoded);
        } else {
            size = WebPEncodeRGBA(img.rgba.data(), img.width, img.height, stride,
                                  quality, &encoded);
        }
        if (!encoded || size == 0) {
            if (encoded) WebPFree(encoded);
            return false;
        }
        out.assign(encoded, encoded + size);
        WebPFree(encoded);
        return true;
    }

    if (format == "png") {
        out.clear();
        return stbi_write_png_to_func(write_to_vector, &out, img.width,
                                      img.height, 4, img.rgba.data(), stride) != 0;
    }

    if (format == "jpg" || format == "jpeg") {
        out.clear();
        return stbi_write_jpg_to_func(write_to_vector, &out, img.width,
                                      img.height, 4, img.rgba.data(),
                                      static_cast<int>(quality)) != 0;
    }

    return false;
}

bool resize_image(const Image& src, int new_width, int new_height, Image& out) {
    if (src.width <= 0 || src.height <= 0 || new_width <= 0 || new_height <= 0) {
        return false;
    }
    out.width = new_width;
    out.height = new_height;
    out.rgba.resize(static_cast<std::size_t>(new_width) * new_height * 4);

    unsigned char* result = stbir_resize_uint8_srgb(
        src.rgba.data(), src.width, src.height, src.width * 4, out.rgba.data(),
        new_width, new_height, new_width * 4, STBIR_RGBA);
    return result != nullptr;
}

}  // namespace assetshrink
