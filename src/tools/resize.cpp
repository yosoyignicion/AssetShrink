#include <algorithm>
#include <cmath>

#include "../core/image_io.h"
#include "httplib.h"
#include "tools.h"

namespace assetshrink {

namespace {

int int_param(const httplib::Request& req, const char* name, int fallback) {
    if (!req.has_param(name)) return fallback;
    try {
        return std::stoi(req.get_param_value(name));
    } catch (...) {
        return fallback;
    }
}

}  // namespace

void register_resize(httplib::Server& svr) {
    svr.Post("/api/resize", [](const httplib::Request& req,
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

        int target_w = int_param(req, "w", 0);
        int target_h = int_param(req, "h", 0);
        int percent = int_param(req, "percent", 0);

        if (percent > 0) {
            target_w = std::max(1, static_cast<int>(std::lround(src.width * percent / 100.0)));
            target_h = std::max(1, static_cast<int>(std::lround(src.height * percent / 100.0)));
        } else if (target_w > 0 && target_h <= 0) {
            target_h = std::max(1, static_cast<int>(
                                       std::lround(src.height * (double)target_w / src.width)));
        } else if (target_h > 0 && target_w <= 0) {
            target_w = std::max(1, static_cast<int>(
                                       std::lround(src.width * (double)target_h / src.height)));
        }

        if (target_w <= 0 || target_h <= 0) {
            target_w = src.width;
            target_h = src.height;
        }

        Image resized;
        if ((target_w != src.width || target_h != src.height) &&
            !resize_image(src, target_w, target_h, resized)) {
            res.status = 500;
            res.set_content("Resize failed", "text/plain");
            return;
        }
        if (resized.width == 0) resized = src;

        std::string format = req.has_param("format") ? req.get_param_value("format") : "webp";
        float quality = 85.0f;
        if (req.has_param("quality")) {
            try {
                quality = std::stof(req.get_param_value("quality"));
            } catch (...) {
            }
        }
        const bool lossless =
            req.has_param("lossless") && req.get_param_value("lossless") == "true";

        std::vector<std::uint8_t> out;
        if (!encode_image(resized, format, quality, lossless, out) || out.empty()) {
            res.status = 500;
            res.set_content("Image encoding failed", "text/plain");
            return;
        }

        const std::string mime =
            (format == "png") ? "image/png"
            : (format == "jpg" || format == "jpeg") ? "image/jpeg"
                                                    : "image/webp";
        res.set_header("X-Image-Width", std::to_string(resized.width));
        res.set_header("X-Image-Height", std::to_string(resized.height));
        res.set_content(reinterpret_cast<const char*>(out.data()), out.size(),
                        mime.c_str());
    });
}

}  // namespace assetshrink
