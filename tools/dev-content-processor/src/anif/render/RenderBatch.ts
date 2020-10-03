import {TransformModel} from "./TransformModel";
import {RenderCommand} from "./RenderCommand";
import {BoundsBuilder} from "@highduck/math";

export class RenderBatch {
    readonly transform = new TransformModel();
    commands: RenderCommand[] = [];
    bounds = new BoundsBuilder();
    total = 0;
}