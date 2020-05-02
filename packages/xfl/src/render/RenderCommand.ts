import {RenderOp} from "./RenderOp";
import {FillStyle, StrokeStyle} from "../xfl/types";

export class RenderCommand {
    v: number[];
    fill: FillStyle | undefined = undefined;
    stroke: StrokeStyle | undefined = undefined;

    constructor(
        readonly op: RenderOp,
        ...args: number[]
    ) {
        this.v = args;
    }
}
