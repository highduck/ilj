#include "save_image_png.hpp"
#include <ek/imaging/drawing.hpp>

#define STB_IMAGE_WRITE_IMPLEMENTATION

#include <stb_image_write.h>

namespace ek {

void save_image_png_stb(const image_t& image, const std::string& path, bool alpha) {
    image_t img{image};
    // require RGBA non-premultiplied alpha
    undo_premultiply_image(img);

    if (alpha) {
        stbi_write_png(path.c_str(),
                       img.width(),
                       img.height(),
                       4,
                       img.data(),
                       4 * static_cast<int>(img.width()));
    } else {

        size_t pixels_count = img.width() * img.height();
        auto* buffer = new uint8_t[pixels_count * 3];
        auto* buffer_rgb = buffer;
        auto* buffer_rgba = img.data();

        for (size_t i = 0; i < pixels_count; ++i) {
            buffer_rgb[0] = buffer_rgba[0];
            buffer_rgb[1] = buffer_rgba[1];
            buffer_rgb[2] = buffer_rgba[2];
            buffer_rgba += 4;
            buffer_rgb += 3;
        }

        stbi_write_png(path.c_str(),
                       img.width(),
                       img.height(),
                       3,
                       buffer,
                       3 * static_cast<int>(img.width()));

        delete[] buffer;
    }
}

}