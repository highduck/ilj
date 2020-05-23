import {Rect} from "@highduck/math";
import {TransformModel} from "./TransformModel";
import {ShapeProcessor} from "./ShapeProcessor";
import {ElementType, LayerType, AnimateDoc, Element} from "@highduck/xfl";
import {logWarning} from "../../debug";

export class DomScanner {
    name?: string;
    readonly output = new ShapeProcessor();
    readonly stack: TransformModel[] = [new TransformModel()];

    constructor(readonly doc: AnimateDoc) {
        this.reset();
    }

    reset() {
        this.stack.length = 1;
        this.stack[0] = new TransformModel();
        this.output.reset();
    }

    scan(element: Element) {
        const type = element.elementType;
        switch (type) {
            case ElementType.symbol_instance:
                this.onSymbolInstance(element);
                break;
            case ElementType.group:
                this.onGroup(element);
                break;
            case ElementType.shape:
                this.onShape(element);
                break;
            case ElementType.OvalObject:
            case ElementType.RectangleObject:
                this.onShapeObject(element);
                break;
            case ElementType.symbol_item:
            case ElementType.SceneTimeline:
                this.onSymbolItem(element);
                break;
            case ElementType.bitmap_instance:
                this.onBitmapInstance(element);
                break;
            case ElementType.bitmap_item:
                this.onBitmapItem(element);
                break;
            default:
                logWarning("Unknown ElementType: ", type);
                break;
        }
    }

    onGroup(element: Element) {
        // ! Group Transformation is not applied !
        for (const member of element.members) {
            this.scan(member);
        }
    }

    getTopTransform(): TransformModel {
        return this.stack[this.stack.length - 1];
    }

    onShape(element: Element) {
        this.pushTransform(element);
        this.output.addElement(element, this.getTopTransform());
        this.popTransform();
    }

    onSymbolInstance(element: Element) {
        if (element.libraryItemName !== undefined) {
            const s = this.doc.find(element.libraryItemName, ElementType.symbol_item);
            if (s !== undefined) {
                this.pushTransform(element);
                this.scan(s);
                this.popTransform();
            }
        }
    }

    onSymbolItem(element: Element) {
        const layers = element.timeline.layers;
        for (let i = layers.length - 1; i >= 0; --i) {
            const layer = layers[i];
            if (layer.layerType === LayerType.normal) {
                if (layer.frames.length !== 0) {
                    for (const el of layer.frames[0].elements) {
                        this.scan(el);
                    }
                }
            }
        }
    }

    onBitmapInstance(element: Element) {
        if (element.libraryItemName !== undefined) {
            const s = this.doc.find(element.libraryItemName, ElementType.bitmap_item);
            if (s !== undefined) {
                this.pushTransform(element);
                this.onBitmapItem(s);
                this.popTransform();
            }
        }
    }

    onBitmapItem(element: Element) {
        this.pushTransform(element);
        this.output.addElement(element, this.getTopTransform());
        this.popTransform();
    }

    pushTransform(element: Element) {
        this.stack.push(
            new TransformModel()
                .copyFrom(this.getTopTransform())
                .mult(
                    element.matrix,
                    element.colorMultiplier,
                    element.colorOffset,
                    element.blendMode
                )
        );
    }

    popTransform() {
        this.stack.pop();
    }

    private onShapeObject(element: Element) {
        this.pushTransform(element);
        this.output.addShapeObject(element, this.getTopTransform());
        this.popTransform();
    }
}

export function estimateBounds(doc: AnimateDoc, elements: Element[]): Rect {
    const scanner = new DomScanner(doc);
    for (const el of elements) {
        scanner.scan(el);
    }
    return scanner.output.bounds.getResultRect();
}
