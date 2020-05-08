import {BoundsBuilder, Rect} from "@highduck/math";
import {Bitmap, Element, FillStyle, StrokeStyle} from "../xfl/types";
import {TransformModel} from "./TransformModel";
import {DOMOvalObject, DOMRectangleObject, ElementType} from "../xfl/dom";
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

    addRectangle(obj: DOMRectangleObject, world: TransformModel): boolean {
        const batch = new RenderBatch();
        const rc = new Rect(
            obj._x ?? 0,
            obj._y ?? 0,
            obj._objectWidth ?? 0,
            obj._objectHeight ?? 0
        );
        const rcWithStrokes = new Rect().copyFrom(rc);
        // rc.transform(world.matrix);

        const cmd = new RenderCommand(
            RenderOp.Rectangle,
            rc.x, rc.y, rc.right, rc.bottom,
            obj._topLeftRadius ?? 0,
            obj._topRightRadius ?? 0,
            obj._bottomRightRadius ?? 0,
            obj._bottomLeftRadius ?? 0
        );
        batch.transform.copyFrom(world);
        batch.total = 1;
        batch.commands.push(cmd);
        ShapeProcessor.fillObjectPropsToCommand(obj, cmd);

        const hw = (obj.stroke?.SolidStroke?._weight ?? 0) / 2;
        rcWithStrokes.expand(hw, hw);
        rcWithStrokes.transform(world.matrix);
        batch.bounds.addRect(rcWithStrokes.x, rcWithStrokes.y, rcWithStrokes.width, rcWithStrokes.height);
        return this.add(batch);
    }

    private static fillObjectPropsToCommand(obj: DOMOvalObject | DOMRectangleObject, cmd: RenderCommand) {
        if (obj.fill) {
            cmd.fill = new FillStyle();
            cmd.fill.parse(obj.fill);
        }
        if (obj.stroke) {
            cmd.stroke = new StrokeStyle();
            cmd.stroke.parse(obj.stroke);
        }
    }

    addOval(obj: DOMOvalObject, world: TransformModel): boolean {
        const batch = new RenderBatch();
        const rc = new Rect(
            obj._x ?? 0,
            obj._y ?? 0,
            obj._objectWidth ?? 0,
            obj._objectHeight ?? 0
        );
        const rcWithStrokes = new Rect().copyFrom(rc);
        // rc.transform(world.matrix);

        const cmd = new RenderCommand(
            RenderOp.oval,
            rc.x, rc.y, rc.right, rc.bottom,
            obj._startAngle ?? 0,
            obj._endAngle ?? 0,
            (obj._closePath ?? true) ? 1 : 0,
            (obj._innerRadius ?? 0) / 100
        );

        batch.transform.copyFrom(world);
        batch.total = 1;
        batch.commands.push(cmd);
        ShapeProcessor.fillObjectPropsToCommand(obj, cmd);

        const hw = (obj.stroke?.SolidStroke?._weight ?? 0) / 2;
        rcWithStrokes.expand(hw, hw);
        rcWithStrokes.transform(world.matrix);
        batch.bounds.addRect(rcWithStrokes.x, rcWithStrokes.y, rcWithStrokes.width, rcWithStrokes.height);
        return this.add(batch);
    }

    addBitmap(bitmap: Bitmap, world: TransformModel): boolean {
        const batch = new RenderBatch();
        batch.transform.copyFrom(world);
        const cmd = new RenderCommand(RenderOp.bitmap);
        cmd.bitmap = bitmap;
        batch.commands.push(cmd);
        batch.total = 1;

        const rc = new Rect(0, 0, bitmap.width, bitmap.height).transform(world.matrix);
        batch.bounds.addRect(rc.x, rc.y, rc.width, rc.height);

        return this.add(batch);
    }
}