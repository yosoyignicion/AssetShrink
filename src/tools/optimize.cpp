#include <algorithm>

#include "../core/image_io.h"
#include "httplib.h"
#include "tools.h"

namespace assetshrink {

void register_optimize(httplib::Server& svr) {
    svr.Post("/api/convert", [](const httplib::Request& req,
                                httplib::Response& res) {
        if (!req.has_file("image")) {
            res.status = 400;
            res.set_content("Missing image file", "text/plain");
            return;
        }
        const auto& file = req.get_file_value("image");

        float quality = 75.0f;
        if (req.has_param("quality")) {
            try {
                quality = std::stof(req.get_param_value("quality"));
            } catch (...) {
            }
        }
        quality = std::max(1.0f, std::min(100.0f, quality));

        const bool lossless =
            req.has_param("lossless") && req.get_param_value("lossless") == "true";

        std::string format = "webp";
        if (req.has_param("format")) format = req.get_param_value("format");

        Image img;
        const auto* data = reinterpret_cast<const std::uint8_t*>(file.content.data());
        if (!load_image(data, file.content.size(), img)) {
            res.status = 400;
            res.set_content("Could not load image data", "text/plain");
            return;
        }

        std::vector<std::uint8_t> out;
        if (!encode_image(img, format, quality, lossless, out) || out.empty()) {
            res.status = 500;
            res.set_content("Image encoding failed", "text/plain");
            return;
        }

        const std::string mime =
            (format == "png") ? "image/png"
            : (format == "jpg" || format == "jpeg") ? "image/jpeg"
                                                    : "image/webp";
        res.set_content(reinterpret_cast<const char*>(out.data()), out.size(),
                        mime.c_str());
    });
}

}  // namespace assetshrink
