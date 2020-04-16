#pragma once

#include <ek/math/vec.hpp>
#include <ek/math/packed_color.hpp>
#include <ek/math/box.hpp>
#include <ek/serialize/serialize.hpp>

#include <unordered_map>
#include <vector>
#include <array>
#include <string>

namespace ek {

class font_glyph_t {
public:
    std::vector<uint32_t> codes;
    std::array<int, 4> box;
    int advance_width;
    std::string sprite;

    template<typename S>
    void serialize(IO<S>& io) {
        io(codes, box, advance_width, sprite);
    }
};

class font_data_t {
public:
    uint16_t units_per_em;
    std::vector<font_glyph_t> glyphs;
    std::vector<uint16_t> sizes;

    template<typename S>
    void serialize(IO<S>& io) {
        io(units_per_em, sizes, glyphs);
    }
};

}
