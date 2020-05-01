import {transform_model} from "./TransformModel";
import {RenderCommand} from "./RenderCommand";
import {BoundsBuilder} from "@highduck/math";
import {Bitmap} from "../xfl/types";

export class RenderBatch {
    readonly transform = new transform_model();
    commands: RenderCommand[] = [];
    bounds = new BoundsBuilder();
    bitmap: Bitmap | undefined = undefined;
    total = 0;
}