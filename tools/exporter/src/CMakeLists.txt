add_subdirectory(ek/math)
add_subdirectory(ek/editor)
add_subdirectory(ek/scenex)
add_subdirectory(ek/imaging)

target_sources(${PROJECT_NAME}  PUBLIC
        ek/util/logger.cpp
        ek/util/logger.hpp
        ek/util/strings.hpp
        ek/util/strings.cpp
        ek/util/source_location.hpp
        ek/util/path.hpp
        ek/util/path.cpp
        ek/util/clock.hpp
        ek/util/clock.cpp
        ek/util/timer.hpp

        ek/system/system.cpp
        ek/system/system.hpp
        ek/system/working_dir.cpp
        ek/system/working_dir.hpp

        ek/binpack/max_rects.hpp
        ek/binpack/max_rects.cpp

        ek/serialize/core.hpp
        ek/serialize/serialize.hpp
        ek/serialize/streams.hpp
        ek/serialize/types.hpp

        # flash document
        ek/flash/doc/flash_archive.cpp
        ek/flash/doc/flash_archive.hpp
        ek/flash/doc/flash_file.cpp
        ek/flash/doc/flash_file.hpp
        ek/flash/doc/types.hpp

        ek/flash/doc/parsing/basic_types.cpp
        ek/flash/doc/parsing/bitmap.cpp
        ek/flash/doc/parsing/edges.cpp
        ek/flash/doc/parsing/elements_parse.cpp
        ek/flash/doc/parsing/filters.cpp
        ek/flash/doc/parsing/graphics_parse.cpp
        ek/flash/doc/parsing/parse_blend_mode.cpp
        ek/flash/doc/parsing/parsing.hpp

        ### FLLASH
        # rasterizer
        ek/flash/rasterizer/cairo_renderer.cpp
        ek/flash/rasterizer/cairo_renderer.hpp
        ek/flash/rasterizer/cairo_utility.cpp
        ek/flash/rasterizer/cairo_utility.hpp

        ek/flash/rasterizer/render_to_sprite.cpp
        ek/flash/rasterizer/render_to_sprite.hpp
        ek/flash/rasterizer/render_command.hpp
        ek/flash/rasterizer/dom_scanner.cpp
        ek/flash/rasterizer/dom_scanner.hpp
        ek/flash/rasterizer/shape_edge_decoder.cpp
        ek/flash/rasterizer/shape_edge_decoder.hpp
        ek/flash/rasterizer/shape_edge.cpp
        ek/flash/rasterizer/shape_edge.hpp
        ek/flash/rasterizer/shape_renderer.cpp
        ek/flash/rasterizer/shape_renderer.hpp
        ek/flash/rasterizer/transform_model.hpp
        ek/flash/rasterizer/software_filters.cpp
        ek/flash/rasterizer/software_filters.hpp

        ek/spritepack/sprite_data.hpp
        ek/spritepack/export_atlas.cpp
        ek/spritepack/export_atlas_json.cpp
        ek/spritepack/export_atlas.hpp
        ek/spritepack/sprite_packing.cpp
        ek/spritepack/sprite_packing.hpp
        ek/spritepack/save_image_png.cpp
        ek/spritepack/save_image_png.hpp
        ek/spritepack/atlas_declaration.cpp
        ek/spritepack/atlas_declaration.hpp

        ek/fonts/export_font.cpp
        ek/fonts/export_font.hpp
        ek/fonts/ft_library.cpp
        ek/fonts/ft_library.hpp
        ek/fonts/font_declaration.cpp
        ek/fonts/font_declaration.hpp
        ek/fonts/filters_declaration.cpp
        ek/fonts/filters_declaration.hpp

        ek/xfl/flash_doc_exporter.cpp
        ek/xfl/flash_doc_exporter.hpp
        ek/xfl/export_item.cpp
        ek/xfl/export_item.hpp

        )

target_include_directories(${PROJECT_NAME} PUBLIC .)
