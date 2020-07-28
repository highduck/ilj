import {BoundsBuilder, Recta} from "@highduck/math";
import {DecodedBitmap, Element, ElementType} from "@highduck/xfl";
import {TransformModel} from "./TransformModel";
import {RenderBatch} from "./RenderBatch";
import {ShapeDecoder} from "./ShapeDecoder";
import {RenderCommand} from "./RenderCommand";
import {RenderOp} from "./RenderOp";

export class ShapeProcessor {
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

    addShapeObject(el: Element, world: TransformModel): boolean {
        const rectangle = el.rectangle;
        const oval = el.oval;
        const shape = rectangle ?? oval ?? undefined;
        if (shape === undefined) {
            return false;
        }
        const rc = new Recta(
            shape._x ?? 0,
            shape._y ?? 0,
            shape._objectWidth ?? 0,
            shape._objectHeight ?? 0
        );
        let cmd: undefined | RenderCommand = undefined;
        if (rectangle) {
            cmd = new RenderCommand(
                RenderOp.Rectangle,
                rc.x, rc.y, rc.right, rc.bottom,
                rectangle._topLeftRadius ?? 0,
                rectangle._topRightRadius ?? 0,
                rectangle._bottomRightRadius ?? 0,
                rectangle._bottomLeftRadius ?? 0
            );
        } else if (oval) {
            cmd = new RenderCommand(
                RenderOp.oval,
                rc.x, rc.y, rc.right, rc.bottom,
                oval._startAngle ?? 0,
                oval._endAngle ?? 0,
                (oval._closePath ?? true) ? 1 : 0,
                (oval._innerRadius ?? 0) / 100
            );
        }
        if (cmd === undefined) {
            return false;
        }

        cmd.fill = el.fills.length > 0 ? el.fills[0] : undefined;
        cmd.stroke = el.strokes.length > 0 ? el.strokes[0] : undefined;

        const batch = new RenderBatch();
        batch.transform.copyFrom(world);
        batch.total = 1;
        batch.commands.push(cmd);

        const hw = (cmd.stroke?.solid.weight ?? 0) / 2;
        rc.expand(hw, hw);
        rc.transform(world.matrix);
        batch.bounds.addRect(rc.x, rc.y, rc.width, rc.height);
        return this.add(batch);
    }

    addBitmap(bitmap: DecodedBitmap, world: TransformModel): boolean {
        const batch = new RenderBatch();
        batch.transform.copyFrom(world);
        const cmd = new RenderCommand(RenderOp.bitmap);
        cmd.bitmap = bitmap;
        batch.commands.push(cmd);
        batch.total = 1;

        const rc = new Recta(0, 0, bitmap.width, bitmap.height).transform(world.matrix);
        batch.bounds.addRect(rc.x, rc.y, rc.width, rc.height);

        return this.add(batch);
    }
}