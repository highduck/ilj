#pragma once

#include "editor_asset.hpp"
#include <ek/spritepack/atlas_declaration.hpp>
#include <ek/flash/doc/flash_archive.hpp>
#include <memory>

namespace ek {

class flash_asset_t : public editor_asset_t {
public:
    inline static const char* type_name = "flash";

    explicit flash_asset_t(path_t path);

    void read_decl_from_xml(const pugi::xml_node& node) override;

    void build(assets_build_struct_t& data) override;

private:
    atlas_decl_t atlas_decl_;
};

std::unique_ptr<flash::basic_entry> load_flash_archive(const path_t& path);

}

