import {ExportItem} from "./ExportItem";
import {
    AnimateDoc,
    DOMFilterKind,
    Element,
    ElementType,
    Frame,
    Layer,
    LayerType,
    SymbolType,
    TweenTarget,
    TweenType
} from "@highduck/xfl";
import {SgDynamicText, SgEasing, SgFile, SgFilterData, SgMovie, SgMovieFrame, SgMovieLayer, SgNode} from "./SgModel";
import {Matrix2D, Recta} from "@highduck/math";
import {DomScanner, estimateBounds} from "./render/DomScanner";
import {EAtlas} from "../spritepack/EAtlas";
import {renderShapes} from "./rasterizer/RenderToSprite";
import {FilterType, TweenTargetType} from "@highduck/anijson";
import {extractTweenDelta, KeyframeTransform, setupFrameFromElement} from "./AnimationUtils";
import {logAssert, logDebug, logWarning} from "../env";

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

const SHAPE_ID = '$';
// we need global across all libraries to avoid multiple FLA exports overlapping
let NEXT_SHAPE_IDX = 0;

function createFrameModel(frame: Frame): SgMovieFrame {
    const ef = new SgMovieFrame();
    ef.index = frame.index;
    ef.duration = frame.duration;
    if (frame.tweenType === TweenType.Classic) {
        ef.motionType = 1;
        for (const fd of frame.tweens) {
            ef.easing.push(new SgEasing(
                convertTweenTarget(fd.target),
                fd.intensity / 100,
                fd.customEase
            ));
        }
        if (ef.easing.length === 0) {
            ef.easing.push(new SgEasing(
                TweenTargetType.All,
                frame.acceleration / 100
            ));
        }
        ef.rotate = frame.motionTweenRotate;
        ef.rotateTimes = frame.motionTweenRotateTimes;
    } else if (frame.tweenType === TweenType.MotionObject) {
        logWarning('motion object is not supported');
    }
    return ef;
}

export class AnimateDocExporter {
    readonly library = new ExportItem();
    readonly linkages = new Map<string, string>();
    readonly scenes = new Map<string, string>();

    private _animationSpan0: number = 0;
    private _animationSpan1: number = 0;

    constructor(readonly doc: AnimateDoc) {

    }

    dispose() {

    }

    buildLibrary() {
        for (const item of this.doc.library) {
            this.process(item, this.library);
        }

        for (const item of this.doc.scenes) {
            const sceneName = item.timeline.name;
            const libraryName = item.item.name;
            logDebug('SCENE: ', sceneName, libraryName);
            if (sceneName && libraryName.length > 0) {
                this.scenes.set(sceneName, libraryName);
            }
        }

        for (const item of this.library.children) {
            if (item.ref !== undefined && item.ref.item.linkageExportForAS) {
                const linkageName = item.ref.item.linkageClassName;
                if (linkageName !== undefined && linkageName.length > 0) {
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
            // if (item.node.sprite !== undefined && item.node.scaleGrid.empty) {
            // if (item.ref !== undefined && (item.shapes > 0 || item.ref.bitmap !== undefined)) {
            // item.node.sprite = item.node.libraryName;
            // just strip symbol from global table
            // item.node.libraryName = "";
            // }
            for (const child of item.children) {
                item.node.children.push(child.node);
                // if (child.node.sprite) {
                // clear refs from sprite objects
                // child.node.libraryName = "";
                // }
            }

            // if (item.node.children.length === 1
            //     && item.node.children[0].sprite) {
            //     item.node.sprite = item.node.children[0].sprite;
            //     item.node.children.length = 0;
            // }

            // if item should be in global registry,
            // but if it's inline sprite - it's ok to throw it away
            if (item.node.libraryName.length > 0) {
                this.library.node.children.push(item.node);
            }
        }
    }

    buildSprites(toAtlas: EAtlas) {
        for (const item of this.library.children) {
            if (item.renderThis) {
                if (item.parent !== undefined && item.parent.ref !== undefined) {
                    console.warn(item.parent.ref.item.name);
                }
                this.render(item, toAtlas);
            }
        }
    }

    process(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        const type = el.elementType;
        switch (type) {
            case ElementType.symbol_instance:
                this.onSymbolInstance(el, parent, bag);
                break;
            case ElementType.bitmap_instance:
                this.onBitmapInstance(el, parent, bag);
                break;
            case ElementType.bitmap_item:
                this.onBitmapItem(el, parent, bag);
                break;
            case ElementType.SceneTimeline:
            case ElementType.symbol_item:
                this.onSymbolItem(el, parent, bag);
                break;
            case ElementType.dynamic_text:
                this.onDynamicText(el, parent, bag);
                break;
            case ElementType.group:
                this.onGroup(el, parent, bag);
                break;

            case ElementType.shape:
            case ElementType.OvalObject:
            case ElementType.RectangleObject:
                this.onShape(el, parent, bag);
                break;

            case ElementType.static_text:
            case ElementType.font_item:
            case ElementType.sound_item:
                logWarning('element type is not supported yet:', type);
                break;
            default:
                logWarning('unknown element type:', type)
                break;
        }
    }

    onSymbolInstance(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        logAssert(el.elementType === ElementType.symbol_instance, `wrong type ${el.elementType} symbol instance`);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";
        item.node.button = el.symbolType === SymbolType.button;
        item.node.touchable = !el.silent;

        processFilters(el, item);

        item.appendTo(parent);
        bag?.push(item);
    }

    onSymbolItem(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        logDebug(`Process _SymbolItem_ "${el.item.name}"`);
        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.libraryName = el.item.name;
        logAssert(el.libraryItemName === undefined || el.libraryItemName.length === 0, `symbol item has no libraryItemName! ${el.item.name}`);
        item.node.scaleGrid.copyFrom(el.scaleGrid);

        collectFramesMetaInfo(this.doc, item);

        const framesCount = el.timeline.getFramesCount();
        const elementsCount = el.timeline.getElementsCount();

        if (shouldConvertItemToSprite(item)) {
            item.renderThis = true;
            item.children.length = 0;
        } else {
            const withoutTimeline = framesCount <= 1 ||
                elementsCount === 0 ||
                el.item.linkageBaseClass === "flash.display.Sprite" ||
                el.item.linkageBaseClass === "flash.display.Shape";

            if (withoutTimeline) {
                const layers = el.timeline.layers;
                for (let layerIndex = layers.length - 1; layerIndex >= 0; --layerIndex) {
                    const layer = layers[layerIndex];
                    if (layer.layerType === LayerType.normal) {
                        for (const frame of layer.frames) {
                            for (const frameElement of frame.elements) {
                                this._animationSpan0 = 0;
                                this._animationSpan1 = 0;
                                this.process(frameElement, item);
                            }
                        }
                    }
                }
                if(item.children.length === 1 && item.children[0].drawingLayer) {
                    item.renderThis = true;
                    item.children.length = 0;
                }
            } else {
                this.processTimeline(el, item);
            }
        }

        item.appendTo(parent);
        bag?.push(item);
    }

    processTimeline(el: Element, item: ExportItem) {
        const movie = new SgMovie();
        movie.frames = el.timeline.getFramesCount();
        movie.fps = this.doc.fps;

        const layers = el.timeline.layers;
        for (let layerIndex = layers.length - 1; layerIndex >= 0; --layerIndex) {
            const layer = layers[layerIndex];
            logDebug(` = Layer #${layerIndex} : ${layer.name}`);
            // ignore other layers.
            // TODO: mask layer
            if (layer.layerType !== LayerType.normal) {
                continue;
            }

            for (let frameIndex = 0; frameIndex < layer.frames.length; ++frameIndex) {
                const frame = layer.frames[frameIndex];
                logDebug(` == Frame #${frameIndex}`);

                // TODO: multiple transformation for tween or state
                const targets: ExportItem[] = [];
                for (const frameElement of frame.elements) {
                    let found = false;
                    for (const prevItem of item.children) {
                        if (prevItem.ref &&
                            prevItem.ref.libraryItemName === frameElement.libraryItemName &&
                            prevItem.ref.item.name === frameElement.item.name &&
                            prevItem.fromLayer === layerIndex &&
                            prevItem.linkedMovieLayer !== undefined) {
                            targets.push(prevItem);
                            // copy new transform
                            prevItem.ref = frameElement;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        this._animationSpan0 = frame.index;
                        this._animationSpan1 = frame.endFrame;
                        this.process(frameElement, item, targets);
                    }
                }
                const k0 = createFrameModel(frame);
                let delta: undefined | KeyframeTransform = undefined;
                if (k0.motionType === 1
                    && frame.elements.length > 0
                    && (frameIndex + 1) < layer.frames.length) {
                    const nextFrame = layer.frames[frameIndex + 1];
                    if (nextFrame.elements.length > 0) {
                        logDebug("--- SCAN:");
                        const el0 = frame.elements[frame.elements.length - 1];
                        const el1 = nextFrame.elements[0];
                        delta = extractTweenDelta(frame, el0, el1);
                    }
                }
                for (const target of targets) {
                    if (target.ref) {
                        let targetLayer = target.linkedMovieLayer;
                        if (targetLayer === undefined) {
                            targetLayer = new SgMovieLayer();
                            movie.layers.push(targetLayer);
                            targetLayer.targets.push(target.node);
                            target.fromLayer = layerIndex;
                            target.linkedMovieLayer = targetLayer;
                        }

                        let kf0: SgMovieFrame | undefined = undefined;
                        kf0 = createFrameModel(frame);
                        targetLayer.frames.push(kf0);
                        setupFrameFromElement(kf0, target.ref);
                        if (delta !== undefined) {
                            const kf1 = new SgMovieFrame();
                            kf1.index = kf0.index + kf0.duration;
                            kf1.duration = 0;
                            kf1.position.copyFrom(kf0.position).add(delta.position);
                            kf1.pivot.copyFrom(kf0.pivot).add(delta.pivot);
                            kf1.scale.copyFrom(kf0.scale).add(delta.scale);
                            kf1.skew.copyFrom(kf0.skew).add(delta.skew);
                            kf1.colorMultiplier.copyFrom(kf0.colorMultiplier).add(delta.colorMultiplier);
                            kf1.colorOffset.copyFrom(kf0.colorOffset).add(delta.colorOffset);
                            kf1.visible = false;
                            targetLayer.frames.push(kf1);
                        }
                    }
                }
            }
        }

        movie.layers = movie.layers.filter((targetLayer) => {
            let empty = false;
            if (targetLayer.frames.length === 0) {
                empty = true;
            }
            if (targetLayer.frames.length === 1) {
                const frame = targetLayer.frames[0];
                if (frame.index === 0 && frame.motionType !== 2 && frame.duration === movie.frames) {
                    empty = true;
                }
            }
            return !empty;
        });

        if (movie.frames > 1 && movie.layers.length > 0) {
            item.node.movie = movie;
            for (let i = 0; i < movie.layers.length; ++i) {
                for (const target of movie.layers[i].targets) {
                    target.movieTargetId = i;
                }
            }
        }

        this._animationSpan0 = 0;
        this._animationSpan1 = 0;
    }

    onBitmapInstance(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        logAssert(el.elementType === ElementType.bitmap_instance, `wrong type ${el.elementType} bitmap instance`);

        const item = new ExportItem();
        item.ref = el;
        processElementCommons(el, item);
        item.node.name = el.item.name;
        item.node.libraryName = el.libraryItemName ?? "";

        processFilters(el, item);

        item.appendTo(parent);
        bag?.push(item);
    }

    onBitmapItem(el: Element, library: ExportItem, bag?: ExportItem[]) {
        const item = new ExportItem();
        item.ref = el;
        item.node.libraryName = el.item.name;
        item.renderThis = true;
        item.appendTo(library);
        bag?.push(item);
    }

    onDynamicText(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        logAssert(el.elementType === ElementType.dynamic_text, `wrong type ${el.elementType} dynamic text`);

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
        dynamicText.lineHeight = textRun0.attributes.lineHeight;
        dynamicText.lineSpacing = textRun0.attributes.lineSpacing;
        dynamicText.color = textRun0.attributes.color.argb32;
        item.node.dynamicText = dynamicText;

        processFilters(el, item);

        item.appendTo(parent);
        bag?.push(item);
    }

    onGroup(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        logAssert(el.elementType === ElementType.group, `wrong type ${el.elementType} group`);
        for (const member of el.members) {
            this.process(member, parent, bag);
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
                logDebug(`  Found drawing layer ${child.ref.item.name}`);
                child.ref.members.push(element);
                ++child.shapes;
                return child;
            }
        }
        const layer = new ExportItem();
        layer.ref = new Element();
        const name = SHAPE_ID + (++NEXT_SHAPE_IDX);
        layer.ref.libraryItemName = name;
        layer.ref.item.name = name;
        layer.ref.elementType = ElementType.group;
        layer.node.libraryName = name;
        layer.renderThis = true;
        layer.drawingLayer = true;
        layer.animationSpan0 = this._animationSpan0;
        layer.animationSpan1 = this._animationSpan1;
        item.add(layer);
        this.library.add(layer);

        logDebug(`  Created drawing layer ${layer.ref.item.name}`);

        layer.ref.members.push(element);
        ++layer.shapes;
        return layer;
    }

    onShape(el: Element, parent: ExportItem, bag?: ExportItem[]) {
        logAssert(
            el.elementType === ElementType.shape
            || el.elementType === ElementType.OvalObject
            || el.elementType === ElementType.RectangleObject,
            `Wrong shape type: ${el.elementType}`
        );
        logDebug(`  Process Shape ${el.item.name}`);
        const affectedItems = this.addElementToDrawingLayer(parent, el);
        bag?.push(affectedItems);
    }

    render(item: ExportItem, toAtlas: EAtlas) {
        const el = item.ref;
        if (el === undefined) {
            logWarning('skip element with undefined ref');
            return;
        }
        logDebug("RENDER: ", item.node.libraryName, el.item.name, el.elementType);
        const spriteId = el.item.name;
        item.node.sprite = spriteId;
        const options = {
            name: spriteId,
            scale: 1
        };

        const scanner = new DomScanner(this.doc);
        scanner.scan(el);
        for (const resolution of toAtlas.resolutions) {
            options.scale = Math.min(
                item.max_abs_scale,
                resolution.scale * Math.min(1, item.estimated_scale)
            );
            //logDebug(`Render x${resolution.scale} : ${options.scale ?? 1}`);
            const result = renderShapes(scanner.output, options);
            if (result !== undefined) {
                result.name = spriteId;
                resolution.sprites.push(result);
                result.trim = item.node.scaleGrid.empty;
                //savePNG("_dump" + resolution.scale + "/" + options.name + ".png", result.image!);
            }
        }
    }

    exportLibrary(): SgFile {

        for (const item of this.library.node.children) {
            for (const child of item.children) {
                const ref = this.library.find_library_item(child.libraryName);
                if (ref !== undefined
                    && ref.node.sprite === ref.node.libraryName
                    && ref.node.scaleGrid.empty
                ) {
                    child.sprite = ref.node.sprite;
                    child.libraryName = "";
                }
            }
        }

        // for (const item of this.library.node.children) {
        //     if (item.children.length === 1) {
        //         const child = item.children[0];
        //         if(child.sprite && child.scaleGrid.empty) {
        //             item.sprite = child.sprite;
        //             item.children.length = 0;
        //         }
        //     }
        // }

        const isInLinkages = (id: string) => {
            for (const linkage of this.linkages.values()) {
                if (linkage === id) {
                    return true;
                }
            }
            return false;
        }

        const lib = new SgNode();
        for (const item of this.library.node.children) {
            if (item.sprite === item.libraryName
                && item.scaleGrid.empty
                && !isInLinkages(item.libraryName)) {
                continue;
            }
            lib.children.push(item);
        }

        return new SgFile(
            lib,
            this.linkages,
            this.scenes
        );
    }
}

function shouldConvertItemToSprite(item: ExportItem) {
    if (item.children.length === 1 && item.children[0].drawingLayer && item.children[0].shapes > 0) {
        return true;
    } else if (item.node.labels.get(0) === '*static') {
        // special user TAG
        return true;
    } else if (!item.node.scaleGrid.empty) {
        // scale 9 grid items
        return true;
    }
    return false;
}

function setupSpecialLayer(doc: AnimateDoc, layer: Layer, toItem: ExportItem): boolean {
    if (isHitRect(layer.name)) {
        toItem.node.hitRect.copyFrom(
            estimateBounds(doc, layer.frames[0].elements) as Recta
        );
        return true;
    } else if (isClipRect(layer.name)) {
        toItem.node.clipRect.copyFrom(
            estimateBounds(doc, layer.frames[0].elements) as Recta
        );
        return true;
    }
    return false;
}

function collectFramesMetaInfo(doc: AnimateDoc, item: ExportItem) {
    if (item.ref === undefined) {
        return;
    }
    const layers = item.ref.timeline.layers;
    for (const layer of layers) {
        if (setupSpecialLayer(doc, layer, item)) {
            continue;
        }
        for (const frame of layer.frames) {
            if (frame.script !== undefined) {
                item.node.scripts.set(frame.index, frame.script);
            }
            if (frame.name !== undefined) {
                item.node.labels.set(frame.index, frame.name);
            }
        }
    }
}