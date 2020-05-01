import {FlashFile} from "../xfl/FlashFile";
import {ExportItem} from "./ExportItem";
import {Element, Frame} from "../xfl/types";
import {DOMFilterKind, ElementType, LayerType, RotationDirection, SymbolType, TweenTarget, TweenType} from "../xfl/dom";
import {
    dynamic_text_data,
    easing_data_t,
    filter_data,
    movie_frame_data,
    movie_layer_data,
    sg_file,
    sg_filter_type,
    sg_movie_data
} from "../anif/sg_data";
import {Matrix2D, Rect} from "@highduck/math";
import {estimateBounds} from "../render/DomScanner";
import {Atlas} from "../spritepack/SpritePack";
import {renderElement} from "../rasterizer/RenderToSprite";

function tweenTargetToAttribute(target: TweenTarget): number {
    switch (target) {
        case TweenTarget.all:
            return 0;
        case TweenTarget.position:
            return 1;
        case TweenTarget.rotation:
            return 2;
        case TweenTarget.scale:
            return 3;
        case TweenTarget.color:
            return 4;
        default:
            return 0;
    }
}

function sign(a: number): number {
    return a > 0 ? 1 : (a < 0 ? -1 : 0);
}

function is_hit_rect(str?: string): boolean {
    return str !== undefined && str.toLowerCase() === "hitrect";
}

function is_clip_rect(str?: string): boolean {
    return str !== undefined && str.toLowerCase() === "cliprect";
}

function process_transform(el: Element, item: ExportItem) {
    item.node.matrix.copyFrom(el.matrix as Matrix2D);
    item.node.color.copyFrom(el.color);
}

function process_filters(el: Element, item: ExportItem) {
    for (const filter of el.filters) {
        const a = filter.angle * Math.PI / 180;//toRadians(filter.angle);
        const d = filter.distance;

        const fd = new filter_data();
        fd.blur.copyFrom(filter.blur);
        fd.color = filter.color.argb32;
        fd.offset.set(Math.cos(a) * d, Math.sin(a) * d);
        fd.quality = 0;

        if (filter.type === DOMFilterKind.drop_shadow) {
            fd.type = sg_filter_type.drop_shadow;
        } else if (filter.type === DOMFilterKind.glow) {
            fd.type = sg_filter_type.glow;
        }

        if (fd.type !== sg_filter_type.none) {
            item.node.filters.push(fd);
        }
    }
}


function normalize_rotation(layer: movie_layer_data) {
    // normalize skews, so that we always skew the shortest distance between
    // two angles (we don't want to skew more than Math.PI)
    const end = layer.frames.length - 1;
    for (let i = 0; i < end; ++i) {
        const kf = layer.frames[i];
        const nextKf = layer.frames[i + 1];

        if (kf.skew.x + Math.PI < nextKf.skew.x) {
            nextKf.skew.x -= 2 * Math.PI;
        } else if (kf.skew.x - Math.PI > nextKf.skew.x) {
            nextKf.skew.x += 2 * Math.PI;
        }
        if (kf.skew.y + Math.PI < nextKf.skew.y) {
            nextKf.skew.y -= 2 * Math.PI;
        } else if (kf.skew.y - Math.PI > nextKf.skew.y) {
            nextKf.skew.y += 2 * Math.PI;
        }
    }
}

function add_rotation(layer: movie_layer_data, frames: Frame[]) {
    let additionalRotation = 0;
    const end = layer.frames.length - 1;
    for (let i = 0; i < end; ++i) {
        const kf = layer.frames[i];
        const nextKf = layer.frames[i + 1];
        // reverse
        const f1 = frames[i];
        // If a direction is specified, take it into account
        if (f1.motionTweenRotate !== RotationDirection.none) {
            let direction = (f1.motionTweenRotate === RotationDirection.cw ? 1 : -1);
            // negative scales affect rotation direction
            direction *= sign(nextKf.scale.x) * sign(nextKf.scale.y);

            while (direction < 0 && kf.skew.x < nextKf.skew.x) {
                nextKf.skew.x -= 2 * Math.PI;
            }
            while (direction > 0 && kf.skew.x > nextKf.skew.x) {
                nextKf.skew.x += 2 * Math.PI;
            }
            while (direction < 0 && kf.skew.y < nextKf.skew.y) {
                nextKf.skew.y -= 2 * Math.PI;
            }
            while (direction > 0 && kf.skew.y > nextKf.skew.y) {
                nextKf.skew.y += 2 * Math.PI;
            }

            // additional rotations specified?
            additionalRotation += f1.motionTweenRotateTimes * 2 * Math.PI * direction;
        }

        nextKf.skew.add2(additionalRotation, additionalRotation);
    }
}

export class FlashDocExporter {
    readonly library = new ExportItem();
    readonly linkages = new Map<string, string>();

    constructor(readonly doc: FlashFile) {

    }

    dispose() {

    }

    build_library() {
        for (const item of this.doc.library) {
            this.process_element(item, this.library);
        }

        for (const item of this.library.children) {
            if (item.ref !== undefined && item.ref.item.linkageExportForAS) {
                const linkageName = item.ref.item.linkageClassName;
                if (linkageName !== undefined && linkageName.length !== 0) {
                    this.linkages.set(linkageName, item.ref.item.name);
                }
                item.inc_ref(this.library);
                item.update_scale(this.library, this.library.node.matrix);
            }
        }

        const chi: ExportItem[] = [];
        for (const item of this.library.children) {
            if (item.usage > 0) {
                chi.push(item);
            } else {
                item.dispose();
            }
        }
        this.library.children = chi;

        for (const item of this.library.children) {
            if (item.ref !== undefined && (item.shapes > 0 || item.ref.bitmap !== undefined)) {
                item.node.sprite = item.node.libraryName;
            }
            for (const child of item.children) {
                item.node.children.push(child.node);
            }
            this.library.node.children.push(item.node);
        }
    }

    build_sprites(to_atlas: Atlas) {
        for (const item of this.library.children) {
            // todo: check `node.sprite` instead of these checkings?
            if (item.ref !== undefined && (item.shapes > 0 || item.ref.bitmap !== undefined)) {
                this.render(item, to_atlas);
                //item->node.sprite = item->node.libraryName;
            }
        }
    }

    process_element(el: Element, parent: ExportItem) {
        const type = el.elementType;
        switch (type) {
            case ElementType.symbol_instance:
                this.process_symbol_instance(el, parent);
                break;
            case ElementType.bitmap_instance:
                this.process_bitmap_instance(el, parent);
                break;
            case ElementType.bitmap_item:
                this.process_bitmap_item(el, parent);
                break;
            case ElementType.symbol_item:
                this.process_symbol_item(el, parent);
                break;
            case ElementType.dynamic_text:
                this.process_dynamic_text(el, parent);
                break;
            case ElementType.group:
                this.process_group(el, parent);
                break;
            case ElementType.shape:
                this.process_shape(el, parent);
                break;

            case ElementType.font_item:
            case ElementType.sound_item:
            case ElementType.static_text:
                console.warn('element type is not supported yet: ' + type);
                break;
            case ElementType.unknown:
                console.warn('unknown element type')
                // TODO:
                break;
        }
    }

    process_symbol_instance(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.symbol_instance);

        const item = new ExportItem();
        item.ref = el;
        process_transform(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";
        item.node.button = el.symbolType === SymbolType.button;
        item.node.touchable = !el.silent;
        item.node.visible = el.isVisible;

        process_filters(el, item);

        item.append_to(parent);
    }

    process_symbol_item(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.symbol_item);

        const item = new ExportItem();
        item.ref = el;
        process_transform(el, item);
        item.node.libraryName = el.item.name;
        console.assert(el.libraryItemName === undefined || el.libraryItemName.length === 0);
        item.node.scaleGrid.copyFrom(el.scaleGrid);

        const timeline_frames_total = el.timeline.getTotalFrames();
        const is_static = timeline_frames_total === 1
            && (el.symbolType === SymbolType.graphic
                || !el.scaleGrid.empty
                || el.item.linkageBaseClass === "flash.display.Sprite");

        if (el.symbolType === SymbolType.button) {
            console.debug("== Button symbol ==");
        }

        if (is_static) {
            ++item.shapes;
        }

        if (timeline_frames_total > 1) {
            item.node.movie = new sg_movie_data();
            item.node.movie.frames = timeline_frames_total;
        }

        let layer_key = 1;
        const layers = el.timeline.layers;
        for (let i = layers.length - 1; i >= 0; --i) {
            const layer = layers[i];
            const layer_data = new movie_layer_data();
            layer_data.key = layer_key;
            let animation_key = 1;
            for (const frame_data of layer.frames) {
                if (is_hit_rect(layer.name)) {
                    item.node.hitRect.copyFrom(
                        estimateBounds(this.doc, frame_data.elements) as Rect
                    );
                } else if (is_clip_rect(layer.name)) {
                    item.node.clipRect.copyFrom(
                        estimateBounds(this.doc, frame_data.elements) as Rect
                    );
                }

                item.node.script = frame_data.script;
                if (item.node.script !== undefined && item.node.script.length !== 0) {
                    console.trace("== SCRIPT: ", item.node.script);
                }

                switch (layer.layerType) {
                    case LayerType.normal:
                        if (frame_data.elements.length !== 0 && !is_static) {
                            for (const frame_element of frame_data.elements) {
                                this.process_element(frame_element, item);
                            }
                            if (item.node.movie
                                // if we don't have added children there is nothing to animate
                                && item.children.length !== 0) {

                                const ef = new movie_frame_data();
                                ef.index = frame_data.index;
                                ef.duration = frame_data.duration;
                                ef.key = animation_key;
                                if (frame_data.tweenType == TweenType.none) {
                                    ef.motion_type = 0;
                                } else {
                                    ef.motion_type = 1;
                                    for (const fd of frame_data.tweens) {
                                        const g = new easing_data_t();
                                        g.attribute = tweenTargetToAttribute(fd.target);
                                        g.ease = fd.intensity / 100;
                                        g.curve = fd.custom_ease ?? [];
                                        ef.tweens.push(g);
                                    }
                                    if (ef.tweens.length === 0) {
                                        const g = new easing_data_t();
                                        g.attribute = 0;
                                        g.ease = frame_data.acceleration / 100;
                                        ef.tweens.push(g);
                                    }
                                }

                                const m = frame_data.elements[0].matrix;
                                const c = frame_data.elements[0].color;
                                const p = frame_data.elements[0].transformationPoint;
                                ef.pivot.copyFrom(p);
                                p.transform(m);
                                ef.position.copyFrom(p);
                                m.extractScale(ef.scale);
                                m.extractSkew(ef.skew);
                                ef.color.copyFrom(c);

                                layer_data.frames.push(ef);

                                const child = item.children[item.children.length - 1];
                                child.node.animationKey = animation_key;
                                child.node.layerKey = layer_key;
                            }
                        }
                        break;
                    default:
                        break;
                }
                ++animation_key;
            }
            const keyframe_count = layer_data.frames.length;
            if (keyframe_count > 1) {
                normalize_rotation(layer_data);
                add_rotation(layer_data, layer.frames);
            }
            if (item.node.movie !== undefined) {
                item.node.movie.layers.push(layer_data);
            }
            ++layer_key;
        }

        item.append_to(parent);
    }

    process_bitmap_instance(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.bitmap_instance);

        const item = new ExportItem();
        item.ref = el;
        process_transform(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";
        item.node.sprite = el.libraryItemName;

        process_filters(el, item);

        item.append_to(parent);
    }

    process_bitmap_item(el: Element, library: ExportItem) {
        const item = new ExportItem();
        item.ref = el;
        item.node.libraryName = el.item.name;
        item.append_to(library);
    }

    process_dynamic_text(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.dynamic_text);

        const item = new ExportItem();
        item.ref = el;
        process_transform(el, item);
        item.node.name = el.item.name;

        //if(dynamicText.rect != null) {
//    item->node.matrix.tx += el.rect.x - 2;
//    item->node.matrix.ty += el.rect.y - 2;
        //}
        let face = el.textRuns[0].attributes.face;
        if (face !== undefined && face.length !== 0 && face[face.length - 1] === '*') {
            face = face.substr(0, face.length - 1);
            const fontItem = this.doc.find(face, ElementType.font_item);
            if (fontItem) {
                face = fontItem.font;
            }
        }

        item.node.dynamicText = new dynamic_text_data();
        item.node.dynamicText.rect.copyFrom(el.rect).expand(2, 2);
        item.node.dynamicText.text = el.textRuns[0].characters.replace(/\r/g, '\n');
        item.node.dynamicText.alignment.copyFrom(el.textRuns[0].attributes.alignment);
        item.node.dynamicText.face = face ?? "";
        item.node.dynamicText.size = el.textRuns[0].attributes.size;
        item.node.dynamicText.line_height = el.textRuns[0].attributes.line_height;
        item.node.dynamicText.line_spacing = el.textRuns[0].attributes.line_spacing;
        item.node.dynamicText.color = el.textRuns[0].attributes.color.argb32;

        process_filters(el, item);

        item.append_to(parent);
    }

    process_group(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.group);
        for (const member of el.members) {
            this.process_element(member, parent);
        }
    }

    process_shape(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.shape);
        //if (parent) {
        ++parent.shapes;
        //}
    }

    render(item: ExportItem, to_atlas: Atlas) {
        const el = item.ref;
        console.info("RENDER: " + item.node.libraryName);
        if (el === undefined) {
            console.warn('skip element with undefined ref');
            return;
        }
        const options = {
            scale: 1
        };
        for (const resolution of to_atlas.resolutions) {
            options.scale = Math.min(
                item.max_abs_scale,
                resolution.scale * Math.min(1, item.estimated_scale)
            );
            // if(item.node.libraryName === 'bella/parts/pupils') {
            //     const scanner = new DomScanner(this.doc);
            //     scanner.scanTrace(el);
            // }
            const result = renderElement(this.doc, el, options);
            result.name = el.item.name;
            resolution.sprites.push(result);
        }
    }

    export_library(): sg_file {
        return new sg_file(this.library.node, this.linkages);
    }

}