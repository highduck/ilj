import {BlendMode} from "../graphics/BlendMode";
import {Program} from "../graphics/Program";
import {Texture} from "../graphics/Texture";
import {Rect} from "@highduck/math";

export class BatchState {

    static readonly EMPTY = new BatchState();

    blend: BlendMode = BlendMode.Nop;
    program?: Program = undefined;
    texture?: Texture = undefined;
    scissorsEnabled = false;
    readonly scissors = new Rect();

    // equals(x: BatchState): boolean {
    //     return this.blend === x.blend
    //         && this.program === x.program
    //         && this.texture === x.texture;
    // }

    copyFrom(x: BatchState) {
        this.blend = x.blend;
        this.program = x.program;
        this.texture = x.texture;
        this.scissors.copyFrom(x.scissors);
        this.scissorsEnabled = x.scissorsEnabled;
    }
}