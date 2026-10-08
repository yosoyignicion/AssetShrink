#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <string>
#include <vector>

#include "../core/image_io.h"
#include "httplib.h"
#include "tools.h"

namespace assetshrink {

namespace {

struct RGB {
    std::uint8_t r, g, b;
};

struct Box {
    std::vector<RGB> pixels;
    int rmin, rmax, gmin, gmax, bmin, bmax;
};

void compute_ranges(Box& box) {
    box.rmin = box.gmin = box.bmin = 255;
    box.rmax = box.gmax = box.bmax = 0;
    for (const auto& p : box.pixels) {
        box.rmin = std::min<int>(box.rmin, p.r);
        box.rmax = std::max<int>(box.rmax, p.r);
        box.gmin = std::min<int>(box.gmin, p.g);
        box.gmax = std::max<int>(box.gmax, p.g);
        box.bmin = std::min<int>(box.bmin, p.b);
        box.bmax = std::max<int>(box.bmax, p.b);
    }
}

int widest_channel(const Box& box) {
    const int dr = box.rmax - box.rmin;
    const int dg = box.gmax - box.gmin;
    const int db = box.bmax - box.bmin;
    if (dr >= dg && dr >= db) return 0;
    if (dg >= db) return 1;
    return 2;
}

std::string to_hex(const RGB& c) {
    char buf[8];
    std::snprintf(buf, sizeof(buf), "#%02x%02x%02x", c.r, c.g, c.b);
    return std::string(buf);
}

}  // namespace

void register_palette(httplib::Server& svr) {
    svr.Post("/api/palette", [](const httplib::Request& req,
                                httplib::Response& res) {
        if (!req.has_file("image")) {
            res.status = 400;
            res.set_content("Missing image file", "text/plain");
            return;
        }
        const auto& file = req.get_file_value("image");

        Image img;
        const auto* data = reinterpret_cast<const std::uint8_t*>(file.content.data());
        if (!load_image(data, file.content.size(), img)) {
            res.status = 400;
            res.set_content("Could not load image data", "text/plain");
            return;
        }

        int count = 8;
        if (req.has_param("count")) {
            try {
                count = std::stoi(req.get_param_value("count"));
            } catch (...) {
            }
        }
        count = std::max(2, std::min(16, count));

        const std::size_t total_px = static_cast<std::size_t>(img.width) * img.height;
        const std::size_t max_samples = 80000;
        const std::size_t step = total_px > max_samples ? total_px / max_samples : 1;

        std::vector<RGB> samples;
        samples.reserve(std::min(total_px, max_samples) + 1);
        for (std::size_t i = 0; i < total_px; i += step) {
            const std::uint8_t* px = &img.rgba[i * 4];
            if (px[3] < 8) continue;  // ignorar píxeles casi transparentes
            samples.push_back({px[0], px[1], px[2]});
        }
        if (samples.empty()) {
            res.status = 400;
            res.set_content("No visible pixels", "text/plain");
            return;
        }

        std::vector<Box> boxes;
        Box initial;
        initial.pixels = std::move(samples);
        compute_ranges(initial);
        boxes.push_back(std::move(initial));

        while (static_cast<int>(boxes.size()) < count) {
            int target = -1;
            long best = -1;
            for (std::size_t i = 0; i < boxes.size(); ++i) {
                if (boxes[i].pixels.size() < 2) continue;
                const int ch = widest_channel(boxes[i]);
                const int range = ch == 0   ? boxes[i].rmax - boxes[i].rmin
                                  : ch == 1 ? boxes[i].gmax - boxes[i].gmin
                                            : boxes[i].bmax - boxes[i].bmin;
                if (range <= 0) continue;
                const long score = range;
                if (score > best) {
                    best = score;
                    target = static_cast<int>(i);
                }
            }
            if (target < 0) break;

            Box& box = boxes[target];
            const int ch = widest_channel(box);
            std::nth_element(box.pixels.begin(),
                             box.pixels.begin() + box.pixels.size() / 2,
                             box.pixels.end(),
                             [ch](const RGB& a, const RGB& b) {
                                 return (ch == 0 ? a.r : ch == 1 ? a.g : a.b) <
                                        (ch == 0 ? b.r : ch == 1 ? b.g : b.b);
                             });

            Box left, right;
            const auto mid = box.pixels.begin() + box.pixels.size() / 2;
            left.pixels.assign(box.pixels.begin(), mid);
            right.pixels.assign(mid, box.pixels.end());
            compute_ranges(left);
            compute_ranges(right);

            boxes[target] = std::move(left);
            boxes.push_back(std::move(right));
        }

        struct Swatch {
            RGB color;
            std::size_t weight;
        };
        std::vector<Swatch> swatches;
        std::size_t total_weight = 0;
        for (const auto& box : boxes) {
            if (box.pixels.empty()) continue;
            long r = 0, g = 0, b = 0;
            for (const auto& p : box.pixels) {
                r += p.r;
                g += p.g;
                b += p.b;
            }
            const std::size_t n = box.pixels.size();
            RGB avg{static_cast<std::uint8_t>(r / n), static_cast<std::uint8_t>(g / n),
                    static_cast<std::uint8_t>(b / n)};
            total_weight += n;

            // Fusionar cajas con el mismo color promedio (imágenes de pocos tonos).
            auto it = std::find_if(swatches.begin(), swatches.end(), [&](const Swatch& s) {
                return s.color.r == avg.r && s.color.g == avg.g && s.color.b == avg.b;
            });
            if (it != swatches.end()) {
                it->weight += n;
            } else {
                swatches.push_back({avg, n});
            }
        }

        std::sort(swatches.begin(), swatches.end(),
                  [](const Swatch& a, const Swatch& b) { return a.weight > b.weight; });

        std::string json = "{\"colors\":[";
        for (std::size_t i = 0; i < swatches.size(); ++i) {
            const double pct =
                total_weight ? 100.0 * swatches[i].weight / total_weight : 0.0;
            char pctbuf[32];
            std::snprintf(pctbuf, sizeof(pctbuf), "%.2f", pct);
            if (i) json += ",";
            json += "{\"hex\":\"" + to_hex(swatches[i].color) + "\",\"rgb\":[" +
                    std::to_string(swatches[i].color.r) + "," +
                    std::to_string(swatches[i].color.g) + "," +
                    std::to_string(swatches[i].color.b) + "],\"percent\":" + pctbuf + "}";
        }
        json += "]}";

        res.set_content(json, "application/json; charset=utf-8");
    });
}

}  // namespace assetshrink
