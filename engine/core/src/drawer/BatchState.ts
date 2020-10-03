import {BlendMode} from "../graphics/BlendMode";
import {Program} from "../graphics/Program";
import {Texture} from "../graphics/Texture";
import {Recta} from "@highduck/math";

export class BatchState {

    static readonly EMPTY = new BatchState();

    blend = BlendMode.Nop;
    program: Program | null = null;
    texture: Texture | null = null;
    readonly scissors = new Recta();

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
    }
}