#include "flash_doc_exporter.hpp"

#include <ek/flash/doc/flash_file.hpp>
#include <ek/flash/rasterizer/render_to_sprite.hpp>
#include <ek/flash/rasterizer/dom_scanner.hpp>
#include <ek/util/strings.hpp>
#include <ek/util/logger.hpp>

namespace ek::flash {

using std::string;

inline float sign(float a) {
    return a > 0.0f ? 1.0f : (a < 0.0f ? -1.0f : 0.0f);
}

bool is_hit_rect(const string& str) {
    return equals_ignore_case(str, "hitrect");
}

bool is_clip_rect(const string& str) {
    return equals_ignore_case(str, "cliprect");
}

void process_transform(const element_t& el, export_item_t& item) {
    item.node.matrix = el.matrix;
    item.node.color = el.color;
}

void process_filters(const element_t& el, export_item_t& item) {
    for (auto& filter : el.filters) {
        float a = math::to_radians(filter.angle);
        float d = filter.distance;
        float2 offset{d * cosf(a), d * sinf(a)};

        filter_data fd;
        fd.type = sg_filter_type::none;
        fd.color = argb32_t{filter.color};
        fd.offset = offset;
        fd.blur = filter.blur;
        fd.quality = filter.quality;

        if (filter.type == filter_kind_t::drop_shadow) {
            fd.type = sg_filter_type::drop_shadow;
        } else if (filter.type == filter_kind_t::glow) {
            fd.type = sg_filter_type::glow;
        }

        if (fd.type != sg_filter_type::none) {
            item.node.filters.push_back(fd);
        }
    }
}


void normalize_rotation(movie_layer_data& layer) {
    // normalize skews, so that we always skew the shortest distance between
    // two angles (we don't want to skew more than Math.PI)
    const int end = static_cast<int>(layer.frames.size()) - 1;
    for (int i = 0; i < end; ++i) {
        auto& kf = layer.frames[i];
        auto& nextKf = layer.frames[i + 1];
        //frameXml = frameXmlList[ii];

        if (kf.skew.x + math::pi < nextKf.skew.x) {
            nextKf.skew.x += -math::pi2;
        } else if (kf.skew.x - math::pi > nextKf.skew.x) {
            nextKf.skew.x += math::pi2;
        }
        if (kf.skew.y + math::pi < nextKf.skew.y) {
            nextKf.skew.y += -math::pi2;
        } else if (kf.skew.y - math::pi > nextKf.skew.y) {
            nextKf.skew.y += math::pi2;
        }
    }
}

void add_rotation(movie_layer_data& layer, const std::vector<frame_t>& frames) {
    float additionalRotation = 0.0f;
    const int end = static_cast<int>(layer.frames.size()) - 1;
    for (int i = 0; i < end; ++i) {
        auto& kf = layer.frames[i];
        auto& nextKf = layer.frames[i + 1];
        // reverse
        const auto& f1 = frames[i];
        // If a direction is specified, take it into account
        if (f1.motionTweenRotate != rotation_direction::none) {
            float direction = (f1.motionTweenRotate == rotation_direction::cw ? 1.0f : -1.0f);
            // negative scales affect rotation direction
            direction *= sign(nextKf.scale.x) * sign(nextKf.scale.y);

            while (direction < 0.0f && kf.skew.x < nextKf.skew.x) {
                nextKf.skew.x -= math::pi2;
            }
            while (direction > 0.0f && kf.skew.x > nextKf.skew.x) {
                nextKf.skew.x += math::pi2;
            }
            while (direction < 0.0f && kf.skew.y < nextKf.skew.y) {
                nextKf.skew.y -= math::pi2;
            }
            while (direction > 0.0f && kf.skew.y > nextKf.skew.y) {
                nextKf.skew.y += math::pi2;
            }

            // additional rotations specified?
            additionalRotation += static_cast<float>(f1.motionTweenRotateTimes)
                                  * static_cast<float>(math::pi2) * direction;
        }

        nextKf.skew = nextKf.skew + float2{additionalRotation, additionalRotation};
    }
}

flash_doc_exporter::flash_doc_exporter(const flash_file& doc)
        : doc{doc} {
}

flash_doc_exporter::~flash_doc_exporter() = default;
//{
//    for (auto ch : library.children) {
//        delete ch;
//    }
//}

void flash_doc_exporter::build_library() {

    for (const auto& item: doc.library) {
        process_element(item, &library);
    }

    for (auto* item : library.children) {
        if (item->ref && item->ref->item.linkageExportForAS) {
            auto& linkageName = item->ref->item.linkageClassName;
            if (!linkageName.empty()) {
                linkages[linkageName] = item->ref->item.name;
            }
            item->inc_ref(library);
            item->update_scale(library, library.node.matrix);
        }
    }

//    auto& children = library.children;
//    children.erase(
//            std::remove_if(
//                    children.begin(),
//                    children.end(),
//                    [](auto* item) -> bool {
//                        if (item->usage == 0) {
//                            delete item;
//                            return false;
//                        }
//                        return true;
//                    }), children.end());
//    export_item_t opt_lib;
    std::vector<export_item_t*> chi{};
    for (auto& item : library.children) {
        if (item->usage > 0) {
            chi.push_back(item);
        } else {
            delete item;
            item = nullptr;
        }
    }
    library.children = chi;
//    library = opt_lib;

    for (auto* item : library.children) {
        if (item->ref && (item->shapes > 0 || item->ref->bitmap)) {
            item->node.sprite = item->node.libraryName;
        }
        for (auto* child : item->children) {
            item->node.children.push_back(child->node);
        }
        library.node.children.push_back(item->node);
    }
}

sg_file flash_doc_exporter::export_library() const {
    sg_file sg;
    sg.library = library.node;
    sg.linkages = linkages;
    return sg;
}

void flash_doc_exporter::process_symbol_instance(const element_t& el, export_item_t* parent) {
    assert(el.elementType == element_type::symbol_instance);

    auto* item = new export_item_t();
    item->ref = &el;
    process_transform(el, *item);
    item->node.name = el.item.name;
    item->node.libraryName = el.libraryItemName;
    item->node.button = el.symbolType == symbol_type::button;
    item->node.touchable = !el.silent;
    item->node.visible = el.isVisible;

    process_filters(el, *item);

    item->append_to(parent);
}

void flash_doc_exporter::process_bitmap_instance(const element_t& el, export_item_t* parent) {
    assert(el.elementType == element_type::bitmap_instance);

    auto* item = new export_item_t;
    item->ref = &el;
    process_transform(el, *item);
    item->node.name = el.item.name;
    item->node.libraryName = el.libraryItemName;
    item->node.sprite = el.libraryItemName;

    process_filters(el, *item);

    item->append_to(parent);
}

void flash_doc_exporter::process_dynamic_text(const element_t& el, export_item_t* parent) {
    assert(el.elementType == element_type::dynamic_text);

    auto* item = new export_item_t();
    item->ref = &el;
    process_transform(el, *item);
    item->node.name = el.item.name;

    //if(dynamicText.rect != null) {
//    item->node.matrix.tx += el.rect.x - 2;
//    item->node.matrix.ty += el.rect.y - 2;
    //}
    string face = el.textRuns[0].attributes.face;
    if (!face.empty() && face.back() == '*') {
        face.pop_back();
        const auto* fontItem = doc.find(face, element_type::font_item);
        if (fontItem) {
            face = fontItem->font;
        }
    }

    item->node.dynamicText.emplace();
    item->node.dynamicText->rect = expand(el.rect, 2.0f);
    item->node.dynamicText->text = ek::replace(el.textRuns[0].characters, "\r", "\n");
    item->node.dynamicText->alignment = el.textRuns[0].attributes.alignment;
    item->node.dynamicText->face = face;
    item->node.dynamicText->size = el.textRuns[0].attributes.size;
    item->node.dynamicText->line_height = el.textRuns[0].attributes.line_height;
    item->node.dynamicText->line_spacing = el.textRuns[0].attributes.line_spacing;
    item->node.dynamicText->color = argb32_t{el.textRuns[0].attributes.color};

    process_filters(el, *item);

    item->append_to(parent);
}

void flash_doc_exporter::process_symbol_item(const element_t& el, export_item_t* parent) {
    assert(el.elementType == element_type::symbol_item);

    auto* item = new export_item_t();
    item->ref = &el;
    process_transform(el, *item);
    item->node.libraryName = el.item.name;
    assert(el.libraryItemName.empty());
    item->node.scaleGrid = el.scaleGrid;

    const auto timeline_frames_total = el.timeline.getTotalFrames();
    const bool is_static = timeline_frames_total == 1
                           && (el.symbolType == symbol_type::graphic
                               || !el.scaleGrid.empty()
                               || el.item.linkageBaseClass == "flash.display.Sprite");

    if (el.symbolType == symbol_type::button) {
        EK_TRACE << "== Button symbol ==";
    }

    if (is_static) {
        item->shapes++;
    }

    if (timeline_frames_total > 1) {
        item->node.movie.emplace();
        item->node.movie->frames = timeline_frames_total;
    }

    int layer_key = 1;
    const auto& layers = el.timeline.layers;
    for (auto it = layers.crbegin(); it != layers.crend(); ++it) {
        movie_layer_data layer_data{};
        layer_data.key = layer_key;
        int animation_key = 1;
        for (const auto& frame_data : it->frames) {

            if (is_hit_rect(it->name)) {
                item->node.hitRect = estimate_bounds(doc, frame_data.elements);
            } else if (is_clip_rect(it->name)) {
                item->node.clipRect = estimate_bounds(doc, frame_data.elements);
            }

            item->node.script = frame_data.script;
            if (!item->node.script.empty()) {
                EK_TRACE << "== SCRIPT: " << item->node.script;
            }

            switch (it->layerType) {
                case layer_type::normal:
                    if (!frame_data.elements.empty() && !is_static) {
                        for (auto& frame_element: frame_data.elements) {
                            process_element(frame_element, item);
                        }
                        if (item->node.movie
                            // if we don't have added children there is nothing to animate
                            && !item->children.empty()) {

                            movie_frame_data ef;
                            ef.index = frame_data.index;
                            ef.duration = frame_data.duration;
                            ef.key = animation_key;
                            if (frame_data.tweenType == tween_type::none) {
                                ef.motion_type = 0;
                            } else {
                                ef.motion_type = 1;
                                for (auto& fd : frame_data.tweens) {
                                    auto& g = ef.tweens.emplace_back();
                                    g.attribute = static_cast<uint8_t>(fd.target);
                                    g.ease = static_cast<float>(fd.intensity) / 100.0f;
                                    g.curve = fd.custom_ease;
                                }
                                if (ef.tweens.empty()) {
                                    auto& g = ef.tweens.emplace_back();
                                    g.attribute = 0;
                                    g.ease = static_cast<float>(frame_data.acceleration) / 100.0f;
                                }
                            }

                            const auto m = frame_data.elements[0].matrix;
                            const auto c = frame_data.elements[0].color;
                            const auto p = frame_data.elements[0].transformationPoint;
                            ef.pivot = p;
                            ef.position = m.transform(p);
                            ef.scale = m.scale();
                            ef.skew = m.skew();
                            ef.color = c;

                            layer_data.frames.push_back(ef);

                            auto* child = item->children[static_cast<int>(item->children.size()) - 1];
                            child->node.animationKey = animation_key;
                            child->node.layerKey = layer_key;
                        }
                    }
                    break;
                default:
                    break;
            }
            ++animation_key;
        }
        const auto keyframe_count = layer_data.frames.size();
        if (keyframe_count > 1) {
            normalize_rotation(layer_data);
            add_rotation(layer_data, it->frames);
        }
        item->node.movie->layers.push_back(layer_data);
        ++layer_key;
    }

    item->append_to(parent);
}

void flash_doc_exporter::process_group(const element_t& el, export_item_t* parent) {
    assert(el.elementType == element_type::group);
    for (const auto& member : el.members) {
        process_element(member, parent);
    }
}

void flash_doc_exporter::process_shape(const element_t& el, export_item_t* parent) {
    assert(el.elementType == element_type::shape);
    if (parent) {
        parent->shapes++;
    }
}

void flash_doc_exporter::process_element(const element_t& el, export_item_t* parent) {
    switch (el.elementType) {
        case element_type::symbol_instance:
            process_symbol_instance(el, parent);
            break;
        case element_type::bitmap_instance:
            process_bitmap_instance(el, parent);
            break;
        case element_type::bitmap_item:
            process_bitmap_item(el, parent);
            break;
        case element_type::symbol_item:
            process_symbol_item(el, parent);
            break;
        case element_type::dynamic_text:
            process_dynamic_text(el, parent);
            break;
        case element_type::group:
            process_group(el, parent);
            break;
        case element_type::shape:
            process_shape(el, parent);
            break;

        case element_type::font_item:
        case element_type::sound_item:
        case element_type::static_text:
        case element_type::unknown:
            // TODO:
            break;
    }
}

void flash_doc_exporter::process_bitmap_item(const element_t& el, export_item_t* lib) {
    auto* item = new export_item_t();
    item->ref = &el;
    item->node.libraryName = el.item.name;
    item->append_to(lib);
}

/*** rendering ***/

void flash_doc_exporter::render(const export_item_t& item, spritepack::atlas_t& to_atlas) const {
    const element_t& el = *item.ref;
    renderer_options_t options;
    for (auto& resolution : to_atlas.resolutions) {
        options.scale = std::min(
                item.max_abs_scale,
                resolution.resolution_scale * std::min(1.0f, item.estimated_scale)
        );
        auto res = ::ek::flash::render(doc, el, options);
        res.name = el.item.name;
        resolution.sprites.push_back(res);
    }
}

void flash_doc_exporter::build_sprites(spritepack::atlas_t& to_atlas) const {
    for (auto* item : library.children) {
        // todo: check `node.sprite` instead of these checkings?
        if (item->ref && (item->shapes > 0 || item->ref->bitmap)) {
            render(*item, to_atlas);
            //item->node.sprite = item->node.libraryName;
        }
    }
}


}