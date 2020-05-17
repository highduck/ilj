import {Matrix2D, Vec2} from "@highduck/math";
import {Element} from '../xfl/types';
import {SgMovieLayer, SgNode} from "../anif/SgModel";
import {ElementType} from "../xfl/dom";

export class ExportItem {
    readonly node = new SgNode();

    // TODO: add movie frames scale, so
    // estimated_scale = 1;
    estimated_scale = 0.001;

    max_abs_scale = 100000.0;
    ref: undefined | Element = undefined;
    children: ExportItem[] = [];
    parent: undefined | ExportItem = undefined;
    usage = 0;
    shapes = 0;

    drawingLayer: boolean = false;
    animationSpan0 = 0;
    animationSpan1 = 0;
    renderThis = false;

    fromLayer: number = 0;
    linkedMovieLayer: undefined | SgMovieLayer = undefined;

    constructor() {
    }

    dispose() {

    }

    add(item: ExportItem) {
        this.children.push(item);
        item.parent = this;
    }

    appendTo(parent: ExportItem) {
        parent.add(this);
    }

    find_library_item(libraryName: string): ExportItem | undefined {
        for (const child of this.children) {
            if (child.node.libraryName === libraryName) {
                return child;
            }
        }
        return undefined;
    }

    inc_ref(lib: ExportItem) {
        ++this.usage;
        if (this.node.libraryName.length !== 0) {
            const dependency = lib.find_library_item(this.node.libraryName);
            if (dependency !== undefined && dependency !== this) {
                dependency.inc_ref(lib);
            }
        }
        for (const child of this.children) {
            child.inc_ref(lib);
        }
    }

    update_scale(lib: ExportItem, parent_matrix: Matrix2D) {
        if (!this.node.scaleGrid.empty) {
            this.estimated_scale = 1.0;
            return;
        }

        const scale = new Vec2();
        const global_matrix = new Matrix2D();
        global_matrix.copyFrom(parent_matrix);
        global_matrix.mult(this.node.matrix);
        global_matrix.extractScale(scale);

        const s = Math.max(scale.x, scale.y);
        this.estimated_scale = Math.max(s, this.estimated_scale);
        if (this.ref !== undefined && this.ref.elementType === ElementType.bitmap_item) {
            this.max_abs_scale = 1;
        }

        if (this.node.libraryName.length !== 0) {
            const dependency = lib.find_library_item(this.node.libraryName);
            if (dependency !== undefined && dependency !== this) {
                dependency.update_scale(lib, global_matrix);
            }
        }
        for (const child of this.children) {
            child.update_scale(lib, global_matrix);
        }
    }

}