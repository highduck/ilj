import {FlashFile} from "../xfl/FlashFile";
import {ExportItem} from "./ExportItem";
import {Element, FillStyle, Frame} from "../xfl/types";
import {DOMFilterKind, ElementType, LayerType, RotationDirection, SymbolType, TweenTarget, TweenType} from "../xfl/dom";
import {SgDynamicText, SgEasing, SgFile, SgFilterData, SgMovie, SgMovieFrame, SgMovieLayer} from "../anif/SgModel";
import {Matrix2D, Rect} from "@highduck/math";
import {estimateBounds} from "../render/DomScanner";
import {Atlas} from "../spritepack/SpritePack";
import {renderElement} from "../rasterizer/RenderToSprite";
import {FilterType, TweenTargetType} from "@highduck/anijson";

function initFill(doc: FlashFile, fill: FillStyle) {
    if (fill.bitmapPath === undefined) {
        return;
    }
    fill.bitmap = doc.find(fill.bitmapPath, ElementType.bitmap_item)?.bitmap;
    if (fill.bitmap === undefined) {
        console.warn('[BitmapFill] bitmap item not found: ', fill.bitmapPath);
    }
}

function initElementFills(doc: FlashFile, el: Element) {
    for (const fill of el.fills) {
        initFill(doc, fill);
    }

    for (const stroke of el.strokes) {
        initFill(doc, stroke.solid.fill);
    }
}

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
    item.node.visible = el.isVisible;
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

function log(msg: string) {
    console.warn(msg);
}

const SHAPE_ID = '$';

export class FlashDocExporter {
    readonly library = new ExportItem();
    readonly linkages = new Map<string, string>();
    readonly scenes = new Map<string, string>();

    private _animationSpan0: number = 0;
    private _animationSpan1: number = 0;
    // private _currentKeyFrame: number = 0;
    // private _currentLayer: number = 0;

    private _nextShapeIndex: number = 0;

    constructor(readonly doc: FlashFile) {

    }

    dispose() {

    }

    buildLibrary() {
        for (const item of this.doc.library) {
            this.processElement(item, this.library);
        }

        for (const item of this.doc.scenes) {
            this.processElement(item, this.library);
            const sceneName = item.timeline.name;
            const libraryName = item.item.name;
            console.log('SCENE: ', sceneName, libraryName);
            if (sceneName && libraryName.length > 0) {
                this.scenes.set(sceneName, libraryName);
            }
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
                // just strip symbol from global table
                item.node.libraryName = "";
            }
            for (const child of item.children) {
                item.node.children.push(child.node);
            }

            // if item should be in global registry, but if it's inline sprite - it's ok to throw it away
            if (item.node.libraryName.length > 0) {
                this.library.node.children.push(item.node);
            }
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

    processElement(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        initElementFills(this.doc, el);

        const type = el.elementType;
        switch (type) {
            case ElementType.symbol_instance:
                this.processSymbolInstance(el, parent, bag);
                break;
            case ElementType.bitmap_instance:
                this.processBitmapInstance(el, parent, bag);
                break;
            case ElementType.bitmap_item:
                this.processBitmapItem(el, parent, bag);
                break;
            case ElementType.symbol_item:
                this.processSymbolItem(el, parent, bag);
                break;
            case ElementType.dynamic_text:
                this.processDynamicText(el, parent, bag);
                break;
            case ElementType.group:
                this.processGroup(el, parent, bag);
                break;

            case ElementType.shape:
            case ElementType.OvalObject:
            case ElementType.RectangleObject:
                this.processShape(el, parent, bag);
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

    processSymbolInstance(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        console.assert(el.elementType === ElementType.symbol_instance, `wrong type ${el.elementType} symbol instance`);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";
        item.node.button = el.symbolType === SymbolType.button;
        item.node.touchable = !el.silent;
        if (el.symbolType === SymbolType.graphic) {
            item.node.loop = el.loop;
            item.node.firstFrame = el.firstFrame;
        }

        processFilters(el, item);

        item.appendTo(parent);
        bag?.push(item);
    }

    processSymbolItem(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        console.assert(el.elementType === ElementType.symbol_item, `wrong type ${el.elementType} symbol item`);

        log(`Process _SymbolItem_ "${el.item.name}"`);
        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.libraryName = el.item.name;
        console.assert(el.libraryItemName === undefined || el.libraryItemName.length === 0, `symbol item has no libraryItemName! ${el.item.name}`);
        item.node.scaleGrid.copyFrom(el.scaleGrid);

        const timelineFramesTotal = el.timeline.getTotalFrames();
        const timelineIsStatic = timelineFramesTotal === 1
            && (el.symbolType === SymbolType.graphic
                || !el.scaleGrid.empty
                || el.item.linkageBaseClass === "flash.display.Sprite");

        if (el.symbolType === SymbolType.button) {
            console.debug("== Button symbol ==");
        }

        // if (timelineIsStatic) {
        //     ++item.shapes;
        // }

        if (timelineFramesTotal > 1) {
            item.node.movie = new SgMovie();
            item.node.movie.frames = timelineFramesTotal;
            item.node.movie.fps = this.doc.doc._frameRate ?? 24;
        }

        let layer_key = 1;
        const layers = el.timeline.layers;
        for (let i = layers.length - 1; i >= 0; --i) {
            const layer = layers[i];
            // this._currentLayer = layer_key;
            log(` = Layer #${i} : ${layer.name}`);

            const layerData = new SgMovieLayer();
            layerData.key = layer_key;
            let animationKey = 1;
            let usedAnimationKey = 0;
            this._animationSpan0 = 0;
            for (let frameIndex = 0; frameIndex < layer.frames.length; ++frameIndex) {
                const frameData = layer.frames[frameIndex];

                // this._currentKeyFrame = animationKey;
                this._animationSpan1 = this._animationSpan0 + frameData.duration - 1;
                log(` == Frame #${frameData.index}`);
                if (isHitRect(layer.name)) {
                    item.node.hitRect.copyFrom(
                        estimateBounds(this.doc, frameData.elements) as Rect
                    );
                } else if (isClipRect(layer.name)) {
                    item.node.clipRect.copyFrom(
                        estimateBounds(this.doc, frameData.elements) as Rect
                    );
                }

                item.node.script = frameData.script;
                if (item.node.script !== undefined && item.node.script.length !== 0) {
                    console.trace("== SCRIPT: ", item.node.script);
                }

                // ignore other layers.
                // TODO: mask layer
                if (layer.layerType === LayerType.normal) {
                    usedAnimationKey = animationKey;
                    const items: ExportItem[] = [];
                    for (const frameElement of frameData.elements) {
                        let animationTarget: undefined | ExportItem = undefined;
                        for (const prevItem of item.children) {
                            if (prevItem.ref &&
                                prevItem.ref.libraryItemName === frameElement.libraryItemName &&
                                prevItem.node.layerKey === layer_key) {
                                animationTarget = prevItem;
                                usedAnimationKey = prevItem.node.animationKey;
                                items.push(animationTarget);
                                break;
                            }
                        }
                        if (animationTarget === undefined) {
                            this.processElement(frameElement, item, items);
                        }
                    }
                    if (item.node.movie
                        // if we don't have added children there is nothing to animate
                        && items.length !== 0) {
                        const ef = new SgMovieFrame();

                        ef.index = frameData.index;
                        ef.duration = frameData.duration;
                        ef.key = usedAnimationKey;
                        if (frameData.tweenType === TweenType.none) {
                            ef.motion_type = 0;
                        } else {
                            ef.motion_type = 1;
                            for (const fd of frameData.tweens) {
                                ef.tweens.push(new SgEasing(
                                    convertTweenTarget(fd.target),
                                    fd.intensity / 100,
                                    fd.custom_ease
                                ));
                            }
                            if (ef.tweens.length === 0) {
                                ef.tweens.push(new SgEasing(
                                    TweenTargetType.All,
                                    frameData.acceleration / 100
                                ));
                            }
                        }

                        const el0 = frameData.elements[0];
                        const m = el0.matrix;
                        const p = el0.transformationPoint;
                        ef.pivot.copyFrom(p);
                        p.transform(m);
                        ef.position.copyFrom(p);
                        m.extractScale(ef.scale);
                        m.extractSkew(ef.skew);

                        ef.colorMultiplier.copyFrom(el0.colorMultiplier);
                        ef.colorOffset.copyFrom(el0.colorOffset);

                        layerData.frames.push(ef);

                        for (const child of items) {
                            child.node.animationKey = usedAnimationKey;
                            child.node.layerKey = layer_key;
                        }
                    }
                }
                ++animationKey;

                this._animationSpan0 += frameData.duration;
            }
            const keyframe_count = layerData.frames.length;
            if (keyframe_count > 1) {
                normalizeRotation(layerData);
                addRotation(layerData, layer.frames);
            }
            if (item.node.movie !== undefined) {
                item.node.movie.layers.push(layerData);
            }
            ++layer_key;
        }

        item.appendTo(parent);
        bag?.push(item);

        // this._currentKeyFrame = 0;
        // this._currentLayer = 0;
        this._animationSpan0 = 0;
        this._animationSpan1 = 0;
    }

    processBitmapInstance(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        console.assert(el.elementType === ElementType.bitmap_instance, `wrong type ${el.elementType} bitmap instance`);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";
        item.node.sprite = el.libraryItemName;

        processFilters(el, item);

        item.appendTo(parent);
        bag?.push(item);
    }

    processBitmapItem(el: Element, library: ExportItem, bag?: ExportItem[]) {
        const item = new ExportItem();
        item.ref = el;
        item.node.libraryName = el.item.name;
        item.appendTo(library);
        bag?.push(item);
    }

    processDynamicText(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        console.assert(el.elementType === ElementType.dynamic_text, `wrong type ${el.elementType} dynamic text`);

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
        bag?.push(item);
    }

    processGroup(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        console.assert(el.elementType === ElementType.group, `wrong type ${el.elementType} group`);
        for (const member of el.members) {
            this.processElement(member, parent, bag);
        }
    }

    addElementToDrawingLayer(item: ExportItem, element: Element): ExportItem {
        // for (let i = item.children.length - 1; i >= 0; --i) {
        //     const child = item.children[i];
        //     if (child.drawingLayer) {
        //         return child;
        //     }
        // }
        if (item.children.length > 0) {
            const child = item.children[item.children.length - 1];
            if (child.drawingLayer && child.ref &&
                child.animationSpan0 === this._animationSpan0 &&
                child.animationSpan1 === this._animationSpan1
            ) {
                log(`  Found drawing layer ${child.ref.item.name}`);
                child.ref.members.push(element);
                ++child.shapes;
                return child;
            }
        }
        const layer = new ExportItem();
        layer.ref = new Element();
        const name = SHAPE_ID + (++this._nextShapeIndex);
        layer.ref.libraryItemName = name;
        layer.ref.item.name = name;
        layer.ref.elementType = ElementType.group;
        layer.node.libraryName = name;
        layer.node.sprite = name;
        layer.drawingLayer = true;
        layer.animationSpan0 = this._animationSpan0;
        layer.animationSpan1 = this._animationSpan1;
        item.add(layer);
        this.library.add(layer);

        log(`  Created drawing layer ${layer.ref.item.name}`);

        layer.ref.members.push(element);
        ++layer.shapes;
        return layer;
    }

    processShape(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        console.assert(
            el.elementType === ElementType.shape
            || el.elementType === ElementType.OvalObject
            || el.elementType === ElementType.RectangleObject,
            `Wrong shape type: ${el.elementType}`
        );
        log(`  Process Shape ${el.item.name}`);
        const affectedItems = this.addElementToDrawingLayer(parent, el);
        bag?.push(affectedItems);
    }

    render(item: ExportItem, to_atlas: Atlas) {
        const el = item.ref;
        if (el === undefined) {
            console.warn('skip element with undefined ref');
            return;
        }
        console.info("RENDER: ", item.node.libraryName, el.item.name, el.elementType);
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
            this.linkages,
            this.scenes
        );
    }

}