#include <algorithm>
#include <cstdint>
#include <string>
#include <vector>

#include "qrcodegen.hpp"
#include "../core/image_io.h"
#include "httplib.h"
#include "tools.h"

namespace assetshrink {

namespace {

qrcodegen::QrCode::Ecc parse_ecc(const std::string& value) {
    using Ecc = qrcodegen::QrCode::Ecc;
    if (value == "L" || value == "l") return Ecc::LOW;
    if (value == "Q" || value == "q") return Ecc::QUARTILE;
    if (value == "H" || value == "h") return Ecc::HIGH;
    return Ecc::MEDIUM;
}

std::string render_svg(const qrcodegen::QrCode& qr, int margin) {
    const int size = qr.getSize();
    const int total = size + margin * 2;
    std::string svg;
    svg.reserve(4096);
    svg += "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " +
           std::to_string(total) + " " + std::to_string(total) +
           "\" shape-rendering=\"crispEdges\">";
    svg += "<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\"/>";
    for (int y = 0; y < size; ++y) {
        for (int x = 0; x < size; ++x) {
            if (!qr.getModule(x, y)) continue;
            svg += "<rect x=\"" + std::to_string(x + margin) + "\" y=\"" +
                   std::to_string(y + margin) +
                   "\" width=\"1\" height=\"1\" fill=\"#000000\"/>";
        }
    }
    svg += "</svg>";
    return svg;
}

}  // namespace

void register_qr(httplib::Server& svr) {
    svr.Get("/api/qr", [](const httplib::Request& req, httplib::Response& res) {
        if (!req.has_param("text") || req.get_param_value("text").empty()) {
            res.status = 400;
            res.set_content("Missing 'text' parameter", "text/plain");
            return;
        }
        const std::string text = req.get_param_value("text");

        int margin = 2;
        if (req.has_param("margin")) {
            try {
                margin = std::max(0, std::min(8, std::stoi(req.get_param_value("margin"))));
            } catch (...) {
            }
        }

        int size = 320;
        if (req.has_param("size")) {
            try {
                size = std::max(64, std::min(2048, std::stoi(req.get_param_value("size"))));
            } catch (...) {
            }
        }

        const std::string ecc_str = req.has_param("ecc") ? req.get_param_value("ecc") : "M";
        const std::string format =
            req.has_param("format") ? req.get_param_value("format") : "png";

        try {
            const qrcodegen::QrCode qr =
                qrcodegen::QrCode::encodeText(text.c_str(), parse_ecc(ecc_str));

            if (format == "svg") {
                res.set_content(render_svg(qr, margin), "image/svg+xml");
                return;
            }

            const int modules = qr.getSize();
            const int total = modules + margin * 2;
            const int scale = std::max(1, size / total);
            const int dim = total * scale;

            Image img;
            img.width = dim;
            img.height = dim;
            img.rgba.assign(static_cast<std::size_t>(dim) * dim * 4, 255);

            for (int y = 0; y < modules; ++y) {
                for (int x = 0; x < modules; ++x) {
                    if (!qr.getModule(x, y)) continue;
                    for (int dy = 0; dy < scale; ++dy) {
                        for (int dx = 0; dx < scale; ++dx) {
                            const int px = (x + margin) * scale + dx;
                            const int py = (y + margin) * scale + dy;
                            std::uint8_t* p =
                                &img.rgba[(static_cast<std::size_t>(py) * dim + px) * 4];
                            p[0] = p[1] = p[2] = 0;
                            p[3] = 255;
                        }
                    }
                }
            }

            std::vector<std::uint8_t> encoded;
            if (!encode_image(img, "png", 100.0f, false, encoded) || encoded.empty()) {
                res.status = 500;
                res.set_content("QR encoding failed", "text/plain");
                return;
            }
            res.set_content(reinterpret_cast<const char*>(encoded.data()),
                            encoded.size(), "image/png");
        } catch (const std::exception&) {
            res.status = 400;
            res.set_content("QR generation failed (data too long?)", "text/plain");
        }
    });
}

}  // namespace assetshrink
