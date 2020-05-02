import {FlashFile} from "../xfl/FlashFile";
import {ExportItem} from "./ExportItem";
import {Element, Frame} from "../xfl/types";
import {DOMFilterKind, ElementType, LayerType, RotationDirection, SymbolType, TweenTarget, TweenType} from "../xfl/dom";
import {SgDynamicText, SgEasing, SgFile, SgFilterData, SgMovie, SgMovieFrame, SgMovieLayer} from "../anif/SgModel";
import {Matrix2D, Rect} from "@highduck/math";
import {estimateBounds} from "../render/DomScanner";
import {Atlas} from "../spritepack/SpritePack";
import {renderElement} from "../rasterizer/RenderToSprite";
import {FilterType, TweenTargetType} from "@highduck/anijson";

function convertTweenTarget(target: TweenTarget): TweenTargetType {
    switch (target) {
        case TweenTarget.all:
            return TweenTargetType.All;
        case TweenTarget.position:
            return TweenTargetType.Position;
        case TweenTarget.rotation:
            return TweenTargetType.Rotation;
        case TweenTarget.scale:
            return TweenTargetType.Scale;
        case TweenTarget.color:
            return TweenTargetType.Color;
    }
    return TweenTargetType.All;
}

function sign(a: number): number {
    return a > 0 ? 1 : (a < 0 ? -1 : 0);
}

function isHitRect(str?: string): boolean {
    return str !== undefined && str.toLowerCase() === "hitrect";
}

function isClipRect(str?: string): boolean {
    return str !== undefined && str.toLowerCase() === "cliprect";
}

function processElementCommons(el: Element, item: ExportItem) {
    item.node.matrix.copyFrom(el.matrix as Matrix2D);
    item.node.colorMultiplier.copyFrom(el.colorMultiplier);
    item.node.colorOffset.copyFrom(el.colorOffset);
}

function processFilters(el: Element, item: ExportItem) {
    for (const filter of el.filters) {
        const a = filter.angle * Math.PI / 180;//toRadians(filter.angle);
        const d = filter.distance;

        const fd = new SgFilterData();
        fd.blur.copyFrom(filter.blur);
        fd.color = filter.color.argb32;
        fd.offset.set(Math.cos(a) * d, Math.sin(a) * d);
        fd.quality = 0;

        if (filter.type === DOMFilterKind.drop_shadow) {
            fd.type = FilterType.DropShadow;
        } else if (filter.type === DOMFilterKind.glow) {
            fd.type = FilterType.Glow;
        }

        if (fd.type !== FilterType.None) {
            item.node.filters.push(fd);
        }
    }
}

function normalizeRotation(layer: SgMovieLayer) {
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

function addRotation(layer: SgMovieLayer, frames: Frame[]) {
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

    buildLibrary() {
        for (const item of this.doc.library) {
            this.processElement(item, this.library);
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

    buildSprites(toAtlas: Atlas) {
        for (const item of this.library.children) {
            // todo: check `node.sprite` instead of these checkings?
            if (item.ref !== undefined && (item.shapes > 0 || item.ref.bitmap !== undefined)) {
                this.render(item, toAtlas);
                //item->node.sprite = item->node.libraryName;
            }
        }
    }

    processElement(el: Element, parent: ExportItem) {
        const type = el.elementType;
        switch (type) {
            case ElementType.symbol_instance:
                this.processSymbolInstance(el, parent);
                break;
            case ElementType.bitmap_instance:
                this.processBitmapInstance(el, parent);
                break;
            case ElementType.bitmap_item:
                this.processBitmapItem(el, parent);
                break;
            case ElementType.symbol_item:
                this.processSymbolItem(el, parent);
                break;
            case ElementType.dynamic_text:
                this.processDynamicText(el, parent);
                break;
            case ElementType.group:
                this.processGroup(el, parent);
                break;
            case ElementType.shape:
                this.processShape(el, parent);
                break;

            case ElementType.static_text:
            case ElementType.font_item:
            case ElementType.sound_item:
                console.warn('element type is not supported yet: ' + type);
                break;
            case ElementType.unknown:
                console.warn('unknown element type')
                // TODO:
                break;
        }
    }

    processSymbolInstance(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.symbol_instance);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";
        item.node.button = el.symbolType === SymbolType.button;
        item.node.touchable = !el.silent;
        item.node.visible = el.isVisible;

        processFilters(el, item);

        item.appendTo(parent);
    }

    processSymbolItem(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.symbol_item);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
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
            item.node.movie = new SgMovie();
            item.node.movie.frames = timeline_frames_total;
        }

        let layer_key = 1;
        const layers = el.timeline.layers;
        for (let i = layers.length - 1; i >= 0; --i) {
            const layer = layers[i];
            const layer_data = new SgMovieLayer();
            layer_data.key = layer_key;
            let animation_key = 1;
            for (const frame_data of layer.frames) {
                if (isHitRect(layer.name)) {
                    item.node.hitRect.copyFrom(
                        estimateBounds(this.doc, frame_data.elements) as Rect
                    );
                } else if (isClipRect(layer.name)) {
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
                                this.processElement(frame_element, item);
                            }
                            if (item.node.movie
                                // if we don't have added children there is nothing to animate
                                && item.children.length !== 0) {

                                const ef = new SgMovieFrame();
                                ef.index = frame_data.index;
                                ef.duration = frame_data.duration;
                                ef.key = animation_key;
                                if (frame_data.tweenType === TweenType.none) {
                                    ef.motion_type = 0;
                                } else {
                                    ef.motion_type = 1;
                                    for (const fd of frame_data.tweens) {
                                        ef.tweens.push(new SgEasing(
                                            convertTweenTarget(fd.target),
                                            fd.intensity / 100,
                                            fd.custom_ease
                                        ));
                                    }
                                    if (ef.tweens.length === 0) {
                                        ef.tweens.push(new SgEasing(
                                            TweenTargetType.All,
                                            frame_data.acceleration / 100
                                        ));
                                    }
                                }

                                const el0 = frame_data.elements[0];
                                const m = el0.matrix;
                                const p = el0.transformationPoint;
                                ef.pivot.copyFrom(p);
                                p.transform(m);
                                ef.position.copyFrom(p);
                                m.extractScale(ef.scale);
                                m.extractSkew(ef.skew);

                                ef.colorMultiplier.copyFrom(el0.colorMultiplier);
                                ef.colorOffset.copyFrom(el0.colorOffset);

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
                normalizeRotation(layer_data);
                addRotation(layer_data, layer.frames);
            }
            if (item.node.movie !== undefined) {
                item.node.movie.layers.push(layer_data);
            }
            ++layer_key;
        }

        item.appendTo(parent);
    }

    processBitmapInstance(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.bitmap_instance);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";
        item.node.sprite = el.libraryItemName;

        processFilters(el, item);

        item.appendTo(parent);
    }

    processBitmapItem(el: Element, library: ExportItem) {
        const item = new ExportItem();
        item.ref = el;
        item.node.libraryName = el.item.name;
        item.appendTo(library);
    }

    processDynamicText(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.dynamic_text);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.name = el.item.name;

        //if(dynamicText.rect != null) {
//    item->node.matrix.tx += el.rect.x - 2;
//    item->node.matrix.ty += el.rect.y - 2;
        //}
        const textRun0 = el.textRuns[0];

        let face = textRun0.attributes.face;
        if (face !== undefined && face.length > 0 && face[face.length - 1] === '*') {
            face = face.substr(0, face.length - 1);
            const fontItem = this.doc.find(face, ElementType.font_item);
            if (fontItem) {
                face = fontItem.font;
            }
        }

        const dynamicText = new SgDynamicText();
        dynamicText.rect.copyFrom(el.rect).expand(2, 2);
        dynamicText.text = textRun0.characters.replace(/\r/g, '\n');
        dynamicText.alignment.copyFrom(textRun0.attributes.alignment);
        dynamicText.face = face ?? "";
        dynamicText.size = textRun0.attributes.size;
        dynamicText.line_height = textRun0.attributes.line_height;
        dynamicText.line_spacing = textRun0.attributes.line_spacing;
        dynamicText.color = textRun0.attributes.color.argb32;
        item.node.dynamicText = dynamicText;

        processFilters(el, item);

        item.appendTo(parent);
    }

    processGroup(el: Element, parent: ExportItem) {
        console.assert(el.elementType === ElementType.group);
        for (const member of el.members) {
            this.processElement(member, parent);
        }
    }

    processShape(el: Element, parent: ExportItem) {
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
            const result = renderElement(this.doc, el, options);
            result.name = el.item.name;
            resolution.sprites.push(result);
        }
    }

    exportLibrary(): SgFile {
        return new SgFile(
            this.library.node,
            this.linkages
        );
    }

}