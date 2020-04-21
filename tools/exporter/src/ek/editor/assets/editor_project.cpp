#include "editor_project.hpp"
#include "editor_asset.hpp"
#include "freetype_asset.hpp"
#include "flash_asset.hpp"

#include <ek/system/working_dir.hpp>
#include <ek/system/system.hpp>
#include <ek/serialize/serialize.hpp>
#include <ek/util/logger.hpp>
#include <functional>
#include <ek/spritepack/export_atlas.hpp>

namespace ek {

std::vector<path_t> search_asset_files(const path_t& path) {
    working_dir_t in{path};
    return search_files("*.asset.xml", path_t{""});
}

void editor_project_t::populate() {
    clear();
    for (const auto& path : search_asset_files(base_path)) {
        add_file(path);
    }
}

std::string get_asset_xml_type(const path_t& path) {
    std::string result;
    pugi::xml_document doc{};
    if (doc.load_file(path.c_str())) {
        result = doc.first_child().attribute("type").as_string();
    } else {
        EK_ERROR("XML parsing error %s", path.c_str());
    }
    return result;
}

void editor_project_t::add_file(const path_t& path) {
    const auto asset_type = get_asset_xml_type(base_path / path);
    auto factory_method = type_factory[asset_type];
    if (factory_method) {
        auto* asset = factory_method(path);
        assert(asset);
        asset->project = this;
        assets.push_back(asset);
    } else {
        EK_ERROR("Editor asset type %s not found", asset_type.c_str());
    }
}

void editor_project_t::clear() {
    for (auto asset : assets) {
        delete asset;
    }
    assets.clear();
}

editor_project_t::editor_project_t() {
    register_asset_factory<freetype_asset_t>();
    register_asset_factory<flash_asset_t>();
}

editor_project_t::~editor_project_t() {
    clear();
}

void editor_project_t::build(const path_t& output) {
    make_dirs(output);
    output_memory_stream out{100};
    assets_build_struct_t build_data{output, &out};
    for (auto asset : assets) {
        asset->build(build_data);
    }

    make_dirs(build_data.output);
    working_dir_t::with(build_data.output, [&] {
        spritepack::export_atlas(main_atlas);
    });

    build_data.meta("", "");
//    ::ek::save(out, output / "pack_meta");
}

}