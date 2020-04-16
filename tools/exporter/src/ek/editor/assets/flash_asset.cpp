#include "flash_asset.hpp"

#include <ek/util/logger.hpp>
#include <utility>
#include <ek/flash/doc/flash_file.hpp>
#include <ek/spritepack/export_atlas.hpp>
#include <ek/xfl/flash_doc_exporter.hpp>
#include <ek/flash/doc/flash_archive.hpp>
#include <ek/system/working_dir.hpp>
#include <ek/system/system.hpp>
#include <memory>
#include <ek/editor/json/serialize.hpp>

namespace ek {

std::unique_ptr<flash::basic_entry> load_flash_archive(const path_t& path) {
    using namespace ek::flash;

    if (is_file(path)) {
        const auto ext = path.ext();
        // dir/FILE/FILE.xfl
        if (ext == "xfl") {
            auto dir = path.dir();
            if (is_dir(dir)) {
                return std::make_unique<xfl_entry>(dir);
            } else {
                EK_ERROR("Import Flash: loading %s XFL file, but %s is not a dir", path.c_str(), dir.c_str());
            }
        } else if (ext == "fla") {
            return std::make_unique<fla_entry>(path);
        } else {
            EK_ERROR << "Import Flash: file is not xfl or fla: " << path;
        }
    }

    // dir/FILE.fla
    const auto fla_file = path + ".fla";
    if (is_file(fla_file)) {
        return std::make_unique<fla_entry>(fla_file);
    } else if (is_dir(path)) {
        if (is_file(path / path.basename() + ".xfl")) {
            return std::make_unique<xfl_entry>(path);
        } else {
            EK_WARN << "Import Flash: given dir doesn't contain .xfl file: " << path;
        }
    }

    EK_ERROR << "Import Flash: file not found: " << path;

    return nullptr;
}


flash_asset_t::flash_asset_t(path_t path)
        : editor_asset_t{std::move(path), "flash"} {
}

void flash_asset_t::read_decl_from_xml(const pugi::xml_node& node) {
    atlas_decl_ = {};
    from_xml(node.child("atlas"), atlas_decl_);
    if (atlas_decl_.name.empty()) {
        atlas_decl_.name = name_;
    }
}

void flash_asset_t::build(assets_build_struct_t& data) {
    read_decl();

    flash::flash_file ff{load_flash_archive(project->base_path / resource_path_)};
    flash::flash_doc_exporter fe{ff};
    fe.build_library();

//    spritepack::atlas_t temp_atlas{atlas_decl_};
//    fe.build_sprites(temp_atlas);
    fe.build_sprites(project->main_atlas);

    make_dirs(data.output);
    working_dir_t::with(data.output, [&] {
        EK_DEBUG << "Export Flash asset: " << current_working_directory();
//        spritepack::export_atlas(temp_atlas);
        auto sg_data = fe.export_library();

        // binary export
        // output_memory_stream out{100};
        // IO io{out};
        // io(sg_data);
        // ek::save(out, name_ + ".sg");

        // json export
        ek::save(to_json_str(sg_data), path_t{name_ + ".ani.json"});
    });

    data.meta("atlas", name_);
    data.meta("scene", name_);
}

}