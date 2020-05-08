import {RenderOp} from "./RenderOp";
import {Bitmap, FillStyle, StrokeStyle} from "../xfl/types";

export class RenderCommand {
    v: number[];
    fill: FillStyle | undefined = undefined;
    stroke: StrokeStyle | undefined = undefined;
    bitmap: Bitmap | undefined = undefined;

    constructor(
        readonly op: RenderOp,
        ...args: number[]
    ) {
        this.v = args;
    }
}
