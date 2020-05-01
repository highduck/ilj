import {BoundsBuilder, Rect, Vec2} from "@highduck/math";
import {Bitmap, Element} from "../xfl/types";
import {TransformModel} from "./TransformModel";
import {ElementType} from "../xfl/dom";
import {RenderBatch} from "./RenderBatch";
import {ShapeDecoder} from "./ShapeDecoder";

export class ShapeRenderer {
    batches: RenderBatch[] = [];
    readonly bounds = new BoundsBuilder();

    constructor() {
    }

    reset() {
        this.batches = [];
        this.bounds.reset();
    }

    add(batch: RenderBatch): boolean {
        if (batch.total > 0 && !batch.bounds.empty) {
            this.batches.push(batch);
            const rc = batch.bounds.getResultRect();
            this.bounds.addRect(rc.x, rc.y, rc.width, rc.height);
            return true;
        }
        return false;
    }

    addElement(el: Element, world: TransformModel): boolean {
        if (el.elementType === ElementType.bitmap_item) {
            if (el.bitmap !== undefined) {
                return this.addBitmap(el.bitmap, world);
            }
            return false;
        }
        const decoder = new ShapeDecoder(world);
        decoder.decode(el);
        return !decoder.empty && this.add(decoder.getResult());
    }

    addBitmap(bitmap: Bitmap, world: TransformModel): boolean {
        const batch = new RenderBatch();
        batch.transform.copyFrom(world);
        batch.bitmap = bitmap;
        batch.total = 1;

        const m = world.matrix;
        const lt = new Vec2();
        const rb = new Vec2();
        m.transform(0, 0, lt);
        m.transform(bitmap.width, bitmap.height, rb);
        batch.bounds.addPoint(lt.x, lt.y);
        batch.bounds.addPoint(rb.x, rb.y);

        return this.add(batch);
    }
}