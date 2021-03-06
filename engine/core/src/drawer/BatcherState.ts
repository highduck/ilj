import {BatchState} from "./BatchState";
import {Matrix4, Recta} from "@highduck/math";
import {Graphics} from "../graphics/Graphics";
import {Program} from "../graphics/Program";
import {Texture} from "../graphics/Texture";
import {BlendMode} from "../graphics/BlendMode";
import {ProgramUniform} from "../graphics/ProgramUniform";

export class BatcherState {
    readonly prev = new BatchState();
    readonly curr = new BatchState();
    readonly next = new BatchState();

    readonly mvp = new Matrix4();

    mvpChanged = false;
    anyChanged = true;

    constructor(private graphics: Graphics) {
    }

    apply() {
        const bl = this.curr.blend;
        if (bl !== this.prev.blend) {
            this.graphics.blendMode(bl);
            this.prev.blend = bl;
        }

        const isProgramChanged = this.prev.program !== this.curr.program;
        let isTextureChanged = this.prev.texture !== this.curr.texture;

        if (isProgramChanged) {
            if (this.prev.program) {
                this.prev.program.disableVertexAttributes();
            }
            if (this.curr.program) {
                this.curr.program.use();
                this.curr.program.enableVertexAttributes();
                this.curr.program.enableImageUnits();
            }
            this.prev.program = this.curr.program;
            isTextureChanged = true;
            this.mvpChanged = true;
        }

        if (isTextureChanged) {
            if (this.curr.texture && this.curr.program) {
                this.curr.texture.bind(this.curr.program.uImage0Unit);
            }
            this.prev.texture = this.curr.texture;
        }

        if (this.mvpChanged && this.curr.program) {
            this.curr.program.setUniform(ProgramUniform.MVP, this.mvp);
        }
        this.mvpChanged = false;

        if (!this.prev.scissors.equals(this.curr.scissors)) {
            this.graphics.scissorsEnable(this.curr.scissors);
            this.prev.scissors.copyFrom(this.curr.scissors);
        }
    }

    setScissors(rc: Recta) {
        if (!rc.equals(this.curr.scissors)) {
            this.anyChanged = true;
        }
        this.next.scissors.copyFrom(rc);
    }

    setBlendMode(blending: BlendMode) {
        if (this.curr.blend !== blending) {
            this.anyChanged = true;
        }
        this.next.blend = blending;
    }

    setTexture(texture: Texture | null) {
        if (this.curr.texture !== texture) {
            this.anyChanged = true;
        }
        this.next.texture = texture;
    }

    setProgram(program: Program | null) {
        if (this.curr.program !== program) {
            this.anyChanged = true;
        }
        this.next.program = program;
    }

    setMVP(mvp: Matrix4) {
        this.mvp.copyFrom(mvp);
        this.mvpChanged = true;
        this.anyChanged = true;
    }

    clear() {
        this.anyChanged = true;
        this.prev.copyFrom(BatchState.EMPTY);
        this.curr.copyFrom(BatchState.EMPTY);
        this.next.copyFrom(BatchState.EMPTY);
    }

    invalidate() {
        if (this.anyChanged) {
            this.curr.copyFrom(this.next);
            this.anyChanged = false;
        }
    }
}
