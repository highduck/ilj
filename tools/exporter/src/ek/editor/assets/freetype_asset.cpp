#include "freetype_asset.hpp"

#include <ek/util/logger.hpp>
#include <ek/system/working_dir.hpp>
#include <ek/spritepack/export_atlas.hpp>
#include <ek/system/system.hpp>
#include <ek/fonts/export_font.hpp>
#include <utility>
#include <memory>
#include <ek/editor/json/serialize.hpp>

namespace ek {

freetype_asset_t::freetype_asset_t(path_t path)
        : editor_asset_t{std::move(path), "freetype"} {
}

void freetype_asset_t::read_decl_from_xml(const pugi::xml_node& node) {
    atlas_decl_ = {};
    from_xml(node.child("atlas"), atlas_decl_);
    if (atlas_decl_.name.empty()) {
        atlas_decl_.name = name_;
    }

    font_decl_ = {};
    from_xml(node.child("font"), font_decl_);

    filters_decl_ = {};
    from_xml(node.child("filters"), filters_decl_);
}

void freetype_asset_t::build(assets_build_struct_t& data) {
    read_decl();

//    spritepack::atlas_t atlas{atlas_decl_};

    auto font_data = font_lib::export_font(project->base_path / resource_path_,
                                           name_,
                                           font_decl_,
                                           filters_decl_,
                                           project->main_atlas);
//                                           atlas);
    working_dir_t::with(data.output, [&] {
        EK_DEBUG << "Export Freetype asset: " << current_working_directory();

        // binary
        // ek::output_memory_stream out{100};
        // IO io{out};
        // io(font_data);
        // ::ek::save(out, name_ + ".font");
//        spritepack::export_atlas(atlas);

        ek::save(to_json_str(font_data), path_t{name_ + ".font.json"});
    });

    data.meta("atlas", name_);
    data.meta("font", name_);
}

}