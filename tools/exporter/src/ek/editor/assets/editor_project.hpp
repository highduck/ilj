#pragma once

#include <vector>
#include <ek/util/path.hpp>
#include <unordered_map>
#include <ek/spritepack/sprite_data.hpp>

namespace ek {

class editor_asset_t;

class editor_project_t {
public:
    using asset_factory = std::function<editor_asset_t*(path_t)>;

    editor_project_t();

    ~editor_project_t();

    void build(const path_t& output);

    void add_file(const path_t& path);

    void clear();

    void populate();

    template<typename EditorAsset>
    void register_asset_factory() {
        type_factory[EditorAsset::type_name] = [](auto x) { return new EditorAsset(x); };
    }

    path_t base_path{"../assets"};

    std::vector<editor_asset_t*> assets;
    std::unordered_map<std::string, asset_factory> type_factory;

    float scale_factor = 2.0f;
    int scale_uid = 2;

    spritepack::atlas_t main_atlas{atlas_decl_t{
            "main",
            {atlas_resolution_decl_t{1, int2{2048, 2048}},
             atlas_resolution_decl_t{2, int2{2048, 2048}},
             atlas_resolution_decl_t{3, int2{4096, 4096}},
             atlas_resolution_decl_t{4, int2{4096, 4096}}
            }
    }};
};

}