import {RenderOp} from "./RenderOp";
import {DecodedBitmap, FillStyle, StrokeStyle} from "@highduck/xfl";

export class RenderCommand {
    v: number[];
    fill: FillStyle | undefined = undefined;
    stroke: StrokeStyle | undefined = undefined;
    bitmap: DecodedBitmap | undefined = undefined;

    constructor(readonly op: RenderOp, ...args: number[]) {
        this.v = args;
    }
}
