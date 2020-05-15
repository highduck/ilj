import {Vec2} from "@highduck/math";
import {RenderCommand} from "./RenderCommand";
import {RenderOp} from "./RenderOp";

export class ShapeEdge {
    fillStyleIndex = -1;
    readonly p0 = new Vec2();
    readonly c = new Vec2();
    readonly p1 = new Vec2();
    isQuadratic = false;

    toCommand(): RenderCommand {
        return this.isQuadratic ?
            new RenderCommand(RenderOp.curve_to, this.c.x, this.c.y, this.p1.x, this.p1.y) :
            new RenderCommand(RenderOp.line_to, this.p1.x, this.p1.y);
    }

    connects(next: ShapeEdge): boolean {
        return this.fillStyleIndex === next.fillStyleIndex && this.p1.equals(next.p0);
    }

    static curve(style: number, p0: Vec2, c: Vec2, p1: Vec2): ShapeEdge {
        const result = new ShapeEdge();
        result.fillStyleIndex = style;
        result.p0.copyFrom(p0);
        result.c.copyFrom(c);
        result.p1.copyFrom(p1);
        result.isQuadratic = true;
        return result;
    }

    static line(style: number, p0: Vec2, p1: Vec2): ShapeEdge {
        const result = new ShapeEdge();
        result.fillStyleIndex = style;
        result.p0.copyFrom(p0);
        result.p1.copyFrom(p1);
        result.isQuadratic = false;
        return result;
    }
}
