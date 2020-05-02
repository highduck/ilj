import {FlashFile} from "../xfl/FlashFile";
import {Element} from "../xfl/types";
import {Rect} from "@highduck/math";
import {TransformModel} from "./TransformModel";
import {ShapeRenderer} from "./ShapeRenderer";
import {ElementType, LayerType} from "../xfl/dom";

export class DomScanner {
    name?: string;
    readonly output = new ShapeRenderer();
    stack: TransformModel[] = [];

    constructor(readonly doc: FlashFile) {
        this.reset();
    }

    reset() {
        this.stack = [new TransformModel()];
        this.output.reset();
    }

    scan(element: Element) {
        const type = element.elementType;
        switch (type) {
            case ElementType.symbol_instance:
                this.scan_symbol_instance(element);
                break;
            case ElementType.group:
                this.scan_group(element);
                break;
            case ElementType.shape:
                this.scan_shape(element);
                break;
            case ElementType.symbol_item:
                this.scan_symbol_item(element);
                break;
            case ElementType.bitmap_instance:
                this.scan_bitmap_instance(element);
                break;
            case ElementType.bitmap_item:
                this.scan_bitmap_item(element);
                break;
            default:
                console.warn("Unknown ElementType: " + type);
                break;
        }
    }

    scan_group(element: Element) {
        // ! Group Transformation is not applied !
        for (const member of element.members) {
            this.scan(member);
        }
    }

    getTopTransform(): TransformModel {
        return this.stack[this.stack.length - 1];
    }

    scan_shape(element: Element) {
        this.push_transform(element);
        this.output.addElement(element, this.getTopTransform());
        this.pop_transform();
    }

    scan_symbol_instance(element: Element) {
        if (element.libraryItemName !== undefined) {
            const s = this.doc.find(element.libraryItemName, ElementType.symbol_item);
            if (s !== undefined) {
                this.push_transform(element);
                this.scan(s);
                this.pop_transform();
            }
        }
    }

    scan_symbol_item(element: Element) {
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

    scan_bitmap_instance(element: Element) {
        if (element.libraryItemName !== undefined) {
            const s = this.doc.find(element.libraryItemName, ElementType.bitmap_item);
            if (s !== undefined) {
                this.push_transform(element);
                this.scan_bitmap_item(s);
                this.pop_transform();
            }
        }
    }

    scan_bitmap_item(element: Element) {
        this.push_transform(element);
        this.output.addElement(element, this.getTopTransform());
        this.pop_transform();
    }

    push_transform(element: Element) {
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

    pop_transform() {
        this.stack.pop();
    }
}

export function estimateBounds(doc: FlashFile, elements: Element[]): Rect {
    const scanner = new DomScanner(doc);
    for (const el of elements) {
        scanner.scan(el);
    }
    return scanner.output.bounds.getResultRect();
}
