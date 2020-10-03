import {Graphics} from "./Graphics";
import {ProgramAttribute} from "./ProgramAttribute";
import {ProgramUniform} from "./ProgramUniform";
import {VERTEX_2D, VertexDecl} from "./VertexDecl";
import {Matrix4, Recta, Vec2, Vec3, Vec4} from "@highduck/math";
import {Color4} from "@highduck/math";
import {ResourceType} from "../util/Resources";
import {IntMap} from "../ds/IntMap";

function checkShader(GL: WebGLRenderingContext, shader: WebGLShader, source: string): boolean {
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        console.error("Compile error " + source);
        console.error(GL.getShaderInfoLog(shader));
        return false;
    }
    return true;
}

function checkProgram(GL: WebGLRenderingContext, program: WebGLProgram): boolean {
    if (!GL.getProgramParameter(program, GL.LINK_STATUS)) {
        console.error("Program link:");
        console.error(GL.getProgramInfoLog(program));
        return false;
    }
    return true;
}

function createShader(GL: WebGLRenderingContext, code: string, type: GLenum, info: string): WebGLShader | null {
    const sh = GL.createShader(type);
    if (sh != null) {
        GL.shaderSource(sh, code);
        GL.compileShader(sh);
        if (!checkShader(GL, sh, info)) {
            GL.deleteShader(sh);
            return null;
        }
    } else {
        console.error("can't create shader");
    }
    return sh;
}

function compile(GL: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {

    const vertexShader = createShader(GL, vs, GL.VERTEX_SHADER, "VERTEX_SHADER");
    const fragmentShader = createShader(GL, fs, GL.FRAGMENT_SHADER, "FRAGMENT_SHADER");
    if (vertexShader != null) {
        if (fragmentShader != null) {
            const program = GL.createProgram();
            if (program != null) {
                GL.attachShader(program, vertexShader);
                GL.attachShader(program, fragmentShader);
                GL.linkProgram(program);
                if (checkProgram(GL, program)) {
                    GL.detachShader(program, vertexShader);
                    GL.detachShader(program, fragmentShader);

                    GL.deleteShader(vertexShader);
                    GL.deleteShader(fragmentShader);
                    return program;
                }
                GL.deleteProgram(program);
            } else {
                console.error("can't alloc program");
            }
            GL.deleteShader(fragmentShader);
        }
        GL.deleteShader(vertexShader);
    }

    return null;
}

const VertexAttribMap = new IntMap<number>();

function enableVertexAttrib(GL: WebGLRenderingContext, loc: GLint): void {
    if (loc >= 0) {
        GL.enableVertexAttribArray(loc);
    }
}

function bindVertexAttrib(GL: WebGLRenderingContext, loc: GLint, comps: number, compsize: number, type: GLenum, normalized: boolean, stride: number, offset: number): number {
    if (loc >= 0) {
        GL.vertexAttribPointer(loc, comps, type, normalized, stride, offset);
    }
    return compsize * comps;
}

function disableVertexAttrib(GL: WebGLRenderingContext, loc: GLint): void {
    if (loc >= 0) {
        GL.disableVertexAttribArray(loc);
    }
}

type UniformDataType = number | Matrix4 | Recta | Vec2 | Vec3 | Vec4 | Color4;

export class Program {
    static current: Program | undefined;
    readonly vertex: VertexDecl;

    uImage0Unit = 0;
    private program: WebGLProgram | null;

    private uniforms = new Map<string, WebGLUniformLocation | null>();
    private attributes = new Map<string, GLint>();

    constructor(private graphics: Graphics, vs: string, fs: string, vertex: VertexDecl = VERTEX_2D) {
        this.program = compile(graphics.gl, vs, fs);
        this.vertex = vertex;
    }

    dispose() {
        if (this.program) {
            this.graphics.gl.deleteProgram(this.program);
            this.program = null;
        }
    }

    enableVertexAttributes() {
        const GL = this.graphics.gl;

        // ??
        // if (this.program) {
        //     GL.bindAttribLocation(this.program, 0, '');
        //     GL.enableVertexAttribArray(0);
        // }

        const v = this.vertex;

        enableVertexAttrib(GL, this.getAttrib(ProgramAttribute.Position));

        if (v.normals) {
            enableVertexAttrib(GL, this.getAttrib(ProgramAttribute.Normal));
        }

        enableVertexAttrib(GL, this.getAttrib(ProgramAttribute.TexCoord));
        enableVertexAttrib(GL, this.getAttrib(ProgramAttribute.ColorMultiplier));
        enableVertexAttrib(GL, this.getAttrib(ProgramAttribute.ColorOffset));
    }

    bindVertexAttrib() {
        const GL = this.graphics.gl;

        // ??
        // if (this.program) {
        //     GL.bindAttribLocation(this.program, 0, '');
        //     GL.enableVertexAttribArray(0);
        // }

        const v = this.vertex;
        let off = 0;

        off += bindVertexAttrib(GL, this.getAttrib(ProgramAttribute.Position),
            v.positionComps, 4, GL.FLOAT, false, v.size, off);

        if (v.normals) {
            off += bindVertexAttrib(GL, this.getAttrib(ProgramAttribute.Normal),
                3, 4, GL.FLOAT, false, v.size, off);
        }

        off += bindVertexAttrib(GL, this.getAttrib(ProgramAttribute.TexCoord),
            2, 4, GL.FLOAT, false, v.size, off);

        off += bindVertexAttrib(GL, this.getAttrib(ProgramAttribute.ColorMultiplier),
            4, 1, GL.UNSIGNED_BYTE, true, v.size, off);

        off += bindVertexAttrib(GL, this.getAttrib(ProgramAttribute.ColorOffset),
            4, 1, GL.UNSIGNED_BYTE, true, v.size, off);
    }

    disableVertexAttributes() {
        const GL = this.graphics.gl;
        disableVertexAttrib(GL, this.getAttrib(ProgramAttribute.Position));
        disableVertexAttrib(GL, this.getAttrib(ProgramAttribute.Normal));
        disableVertexAttrib(GL, this.getAttrib(ProgramAttribute.TexCoord));
        disableVertexAttrib(GL, this.getAttrib(ProgramAttribute.ColorMultiplier));
        disableVertexAttrib(GL, this.getAttrib(ProgramAttribute.ColorOffset));
    }

    enableImageUnits() {
        this.setUniform1i(ProgramUniform.Image0, this.uImage0Unit);
    }

    use() {
        if (Program.current) {
            //        current_program->unbind_attributes();
        }

        const GL = this.graphics.gl;
        GL.useProgram(this.program);

        Program.current = this;
        if (Program.current) {
//        current_program->bind_attributes();
//        current_program->bind_image();
        }
    }

    //
    // set_uniform2f(name: string, v2) {
    //     const uniform = this.get_uniform(name);
    //     if (uniform) {
    //         this.gl.uniform2fv(uniform, 1, v2);
    //
    //     }
    // }
    //
    // set_uniform3f(name: string, v3) {
    //     const uniform = this.get_uniform(name);
    //     if (uniform) {
    //         this.gl.uniform3fv(uniform, 1, v3);
    //
    //     }
    // }
    //
    // set_uniform4f(name: string, v4) {
    //     const uniform = this.get_uniform(name);
    //     if (uniform) {
    //         this.gl.uniform4fv(uniform, 1, v4);
    //     }
    // }
    //
    setUniform(name: string, value: UniformDataType) {
        const uniform = this.getUniform(name);
        if (uniform) {
            const GL = this.graphics.gl;
            if (value instanceof Matrix4) {
                GL.uniformMatrix4fv(uniform, false, value.data);
            } else if (value instanceof Vec2) {
                GL.uniform2f(uniform, value.x, value.y);
            } else if (value instanceof Vec3) {
                GL.uniform3f(uniform, value.x, value.y, value.z);
            } else if (value instanceof Vec4) {
                GL.uniform4f(uniform, value.x, value.y, value.z, value.w);
            } else if (value instanceof Recta) {
                GL.uniform4f(uniform, value.x, value.y, value.width, value.height);
            } else if (value instanceof Color4) {
                GL.uniform4f(uniform, value.r, value.g, value.b, value.a);
            }
            // else if(typeof value === 'number') {
            else {
                GL.uniform1f(uniform, value);
            }
        }
    }

    setUniformMatrix4f(name: string, mat4: Float32Array) {
        const uniform = this.getUniform(name);
        if (uniform) {
            const GL = this.graphics.gl;
            GL.uniformMatrix4fv(uniform, false, mat4);
        }
    }

    setUniformMatrix3f(name: string, mat3: Float32Array) {
        const uniform = this.getUniform(name);
        if (uniform) {
            const GL = this.graphics.gl;
            GL.uniformMatrix3fv(uniform, false, mat3);
        }
    }

    setUniform1f(name: string, v: number) {
        const uniform = this.getUniform(name);
        if (uniform) {
            const GL = this.graphics.gl;
            GL.uniform1f(uniform, v);
        }
    }

    setUniform1i(name: string, v: number) {
        const uniform = this.getUniform(name);
        if (uniform) {
            const GL = this.graphics.gl;
            GL.uniform1i(uniform, v);
        }
    }

    private getAttrib(name: string): GLint {
        if (!this.attributes.has(name) && this.program) {
            const loc = this.graphics.gl.getAttribLocation(this.program, name);
            this.attributes.set(name, loc);
            return loc;
        }
        return this.attributes.get(name) ?? -1;
    }

    private getUniform(name: string): WebGLUniformLocation | null {
        if (!this.uniforms.has(name) && this.program) {
            const GL = this.graphics.gl;
            const uniform = GL.getUniformLocation(this.program, name);
            this.uniforms.set(name, uniform);
            return uniform;
        }
        return this.uniforms.get(name) ?? null;
    }
}

export const ProgramResource = new ResourceType(Program);