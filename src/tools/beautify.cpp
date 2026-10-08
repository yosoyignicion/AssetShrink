#include <algorithm>
#include <cmath>
#include <cstdint>
#include <string>
#include <vector>

#include "../core/image_io.h"
#include "httplib.h"
#include "tools.h"

namespace assetshrink {

namespace {

struct Color {
    std::uint8_t r = 0, g = 0, b = 0;
};

Color parse_hex(const std::string& value, Color fallback) {
    std::string s = value;
    if (!s.empty() && s.front() == '#') s.erase(s.begin());
    if (s.size() != 6) return fallback;
    try {
        const int v = std::stoi(s, nullptr, 16);
        return {static_cast<std::uint8_t>((v >> 16) & 0xFF),
                static_cast<std::uint8_t>((v >> 8) & 0xFF),
                static_cast<std::uint8_t>(v & 0xFF)};
    } catch (...) {
        return fallback;
    }
}

float rounded_rect_sdf(float px, float py, float half_w, float half_h,
                       float radius) {
    const float qx = std::fabs(px) - (half_w - radius);
    const float qy = std::fabs(py) - (half_h - radius);
    const float ax = std::max(qx, 0.0f);
    const float ay = std::max(qy, 0.0f);
    return std::sqrt(ax * ax + ay * ay) + std::min(std::max(qx, qy), 0.0f) - radius;
}

void blend(std::uint8_t* dst, const Color& color, float alpha) {
    alpha = std::max(0.0f, std::min(1.0f, alpha));
    const float inv = 1.0f - alpha;
    dst[0] = static_cast<std::uint8_t>(color.r * alpha + dst[0] * inv + 0.5f);
    dst[1] = static_cast<std::uint8_t>(color.g * alpha + dst[1] * inv + 0.5f);
    dst[2] = static_cast<std::uint8_t>(color.b * alpha + dst[2] * inv + 0.5f);
    dst[3] = 255;
}

int int_param(const httplib::Request& req, const char* name, int fallback) {
    if (!req.has_param(name)) return fallback;
    try {
        return std::stoi(req.get_param_value(name));
    } catch (...) {
        return fallback;
    }
}

}  // namespace

void register_beautify(httplib::Server& svr) {
    svr.Post("/api/beautify", [](const httplib::Request& req,
                                 httplib::Response& res) {
        if (!req.has_file("image")) {
            res.status = 400;
            res.set_content("Missing image file", "text/plain");
            return;
        }
        const auto& file = req.get_file_value("image");

        Image src;
        const auto* data = reinterpret_cast<const std::uint8_t*>(file.content.data());
        if (!load_image(data, file.content.size(), src)) {
            res.status = 400;
            res.set_content("Could not load image data", "text/plain");
            return;
        }

        const int pad = std::max(0, std::min(400, int_param(req, "pad", 64)));
        const int radius = std::max(0, std::min(200, int_param(req, "radius", 18)));
        const bool shadow = !req.has_param("shadow") || req.get_param_value("shadow") != "false";
        const Color top = parse_hex(req.has_param("bgTop") ? req.get_param_value("bgTop") : "#6366f1",
                                    {99, 102, 241});
        const Color bottom = parse_hex(req.has_param("bgBottom") ? req.get_param_value("bgBottom") : "#0f172a",
                                       {15, 23, 42});
        const float shadow_opacity = 0.35f;
        const float shadow_blur = std::max(6.0f, pad * 0.35f);
        const float shadow_offset_y = shadow ? std::max(6.0f, pad * 0.22f) : 0.0f;

        const int canvas_w = src.width + pad * 2;
        const int canvas_h = src.height + pad * 2;

        Image out;
        out.width = canvas_w;
        out.height = canvas_h;
        out.rgba.assign(static_cast<std::size_t>(canvas_w) * canvas_h * 4, 0);

        for (int y = 0; y < canvas_h; ++y) {
            const float t = canvas_h > 1 ? static_cast<float>(y) / (canvas_h - 1) : 0.0f;
            const Color row{static_cast<std::uint8_t>(top.r + (bottom.r - top.r) * t),
                            static_cast<std::uint8_t>(top.g + (bottom.g - top.g) * t),
                            static_cast<std::uint8_t>(top.b + (bottom.b - top.b) * t)};
            for (int x = 0; x < canvas_w; ++x) {
                std::uint8_t* px = &out.rgba[(static_cast<std::size_t>(y) * canvas_w + x) * 4];
                px[0] = row.r;
                px[1] = row.g;
                px[2] = row.b;
                px[3] = 255;
            }
        }

        const float half_w = src.width / 2.0f;
        const float half_h = src.height / 2.0f;
        const float center_x = pad + half_w;
        const float center_y = pad + half_h;

        if (shadow) {
            for (int y = 0; y < canvas_h; ++y) {
                for (int x = 0; x < canvas_w; ++x) {
                    const float sdf = rounded_rect_sdf(
                        x + 0.5f - center_x, y + 0.5f - (center_y + shadow_offset_y),
                        half_w, half_h, static_cast<float>(radius));
                    float mask = 1.0f - sdf / shadow_blur;
                    mask = std::max(0.0f, std::min(1.0f, mask));
                    mask *= mask;
                    if (mask <= 0.0f) continue;
                    std::uint8_t* px =
                        &out.rgba[(static_cast<std::size_t>(y) * canvas_w + x) * 4];
                    blend(px, {0, 0, 0}, mask * shadow_opacity);
                }
            }
        }

        for (int y = 0; y < src.height; ++y) {
            for (int x = 0; x < src.width; ++x) {
                const float sdf = rounded_rect_sdf(
                    x + 0.5f - half_w, y + 0.5f - half_h, half_w, half_h,
                    static_cast<float>(radius));
                float coverage = std::max(0.0f, std::min(1.0f, 0.5f - sdf));
                const std::uint8_t* sp =
                    &src.rgba[(static_cast<std::size_t>(y) * src.width + x) * 4];
                const float src_alpha = (sp[3] / 255.0f) * coverage;
                const int cx = x + pad;
                const int cy = y + pad;
                std::uint8_t* dp =
                    &out.rgba[(static_cast<std::size_t>(cy) * canvas_w + cx) * 4];
                blend(dp, {sp[0], sp[1], sp[2]}, src_alpha);
            }
        }

        std::vector<std::uint8_t> encoded;
        if (!encode_image(out, "png", 100.0f, false, encoded) || encoded.empty()) {
            res.status = 500;
            res.set_content("Beautify failed", "text/plain");
            return;
        }
        res.set_content(reinterpret_cast<const char*>(encoded.data()), encoded.size(),
                        "image/png");
    });
}

}  // namespace assetshrink
