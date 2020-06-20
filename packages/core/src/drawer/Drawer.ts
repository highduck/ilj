import {BlendMode} from "../graphics/BlendMode";
import {Buffer} from "../graphics/Buffer";
import {Rect} from "@highduck/math";
import {Batcher} from "./Batcher";
import {CheckFlag, DrawingState} from "./DrawingState";

import {Color32_ABGR, Color32_ABGR_PMA, Color32_ARGB, color32_pack_floats,} from "@highduck/math";
import {assert} from "../util/assert";

const packFloats = color32_pack_floats;

export class Drawer {

    readonly state: DrawingState;

    f32: Float32Array;
    u32: Uint32Array;
    vi = 0;

    indexData: Uint16Array;
    ii = 0;

    vertexColorMultiplier: Color32_ABGR_PMA = 0xFFFFFFFF;
    vertexColorOffset: Color32_ABGR = 0x0;

    constructor(readonly batcher: Batcher) {
        this.state = new DrawingState();
        this.indexData = batcher.indexMemory;
        this.f32 = new Float32Array(batcher.vertexMemory.buffer, 0);
        this.u32 = new Uint32Array(batcher.vertexMemory.buffer, 0);
    }

    begin(dest: Rect) {
        const GL = this.batcher.graphics.gl;
        GL.depthMask(false);
        GL.enable(GL.BLEND);
        GL.disable(GL.DEPTH_TEST);
        GL.disable(GL.STENCIL_TEST);
        GL.disable(GL.DITHER);
        GL.disable(GL.CULL_FACE);

        this.state.texture = this.state.defaultTexture;
        this.state.program = this.state.defaultProgram;
        this.state.blending = BlendMode.Premultiplied;
        this.state.mvp.ortho2D(dest.x, dest.y, dest.width, dest.height);
        this.state.scissorsEnabled = false;
        this.state.checkFlags = 0;
        this.state.canvas.copyFrom(dest);

        const batchingState = this.batcher.state;
        batchingState.clear();
        batchingState.setProgram(this.state.program);
        batchingState.setTexture(this.state.texture);
        batchingState.setMVP(this.state.mvp);
        batchingState.setBlendMode(this.state.blending);
    }

    end() {
        this.batcher.state.apply();
        this.batcher.flush();
        this.state.finish();

        // maybe place explicit somewhere else
        this.batcher.nextFrame();
    }

    writeIndex(index: number /* u16 */) {
        this.indexData[this.ii++] = this.batcher.getVertexIndex(index);
    }

    commitState() {
        if ((this.state.checkFlags & CheckFlag.Blending) !== 0) {
            this.batcher.state.setBlendMode(this.state.blending);
        }
        if ((this.state.checkFlags & CheckFlag.Texture) !== 0) {
            this.batcher.state.setTexture(this.state.texture);
        }
        if ((this.state.checkFlags & CheckFlag.Program) !== 0) {
            this.batcher.state.setProgram(this.state.program);
        }
        if ((this.state.checkFlags & CheckFlag.MVP) !== 0) {
            this.batcher.state.setMVP(this.state.mvp);
        }
        if ((this.state.checkFlags & CheckFlag.Scissors) !== 0) {
            this.batcher.state.setScissors(this.state.scissorsEnabled ? this.state.scissors : undefined);
        }
        this.state.checkFlags = 0;
    }

    invalidateForce() {
        this.commitState();
        this.batcher.invalidateForce();
    }

    drawMesh(vb: Buffer, ib: Buffer, indices_count: number) {
        this.batcher.drawMesh(vb, ib, indices_count);
    }

    flushBatcher() {
        this.batcher.flush();
    }

    prepare() {
        const mul = this.state.colorMultiplier;
        const off = this.state.colorOffset;
        const a = mul.a;
        this.vertexColorMultiplier = packFloats(a * (1 - off.a), a * mul.b, a * mul.g, a * mul.r);
        // for offset: delete alpha, flip R vs B channels
        this.vertexColorOffset = packFloats(0, off.b, off.g, off.r);
    }

    triangles(verticesCount: number, indicesCount: number) {
        this.commitState();
        this.batcher.allocTriangles(verticesCount, indicesCount);
        this.vi = this.batcher.vertexPointer;
        this.ii = this.batcher.indexPointer;
    }

    quadFast(x: number, y: number, w: number, h: number, normalUV: boolean) {
        this.prepare();
        this.triangles(4, 6);
        if (normalUV) {
            this.writeQuad_opt(x, y, x + w, y + h);
        } else {
            this.writeQuad_rotated_opt(x, y, x + w, y + h);
        }
    }

    writeQuad_opt(l: number, t: number, r: number, b: number) {
        const m = this.state.matrix;
        const lax = l * m.a + m.x;
        const lby = l * m.b + m.y;
        const rax = r * m.a + m.x;
        const rby = r * m.b + m.y;
        const tc = t * m.c;
        const td = t * m.d;
        const bc = b * m.c;
        const bd = b * m.d;

        const f32 = this.f32;
        let i = this.vi | 0;
        f32[i] = lax + tc;
        f32[i + 1] = lby + td;
        f32[i + 6] = rax + tc;
        f32[i + 7] = rby + td;
        f32[i + 12] = rax + bc;
        f32[i + 13] = rby + bd;
        f32[i + 18] = lax + bc;
        f32[i + 19] = lby + bd;

        const uv = this.state.uv;
        f32[i + 2] = f32[i + 20] = uv.x;
        f32[i + 3] = f32[i + 9] = uv.y;
        f32[i + 8] = f32[i + 14] = uv.x + uv.width;
        f32[i + 15] = f32[i + 21] = uv.y + uv.height;

        const u32 = this.u32;
        u32[i + 4] = u32[i + 10] = u32[i + 16] = u32[i + 22] = this.vertexColorMultiplier | 0;
        u32[i + 5] = u32[i + 11] = u32[i + 17] = u32[i + 23] = this.vertexColorOffset | 0;

        this.vi = i + 24;
        const index = this.batcher.baseVertex | 0;
        const indices = this.indexData;
        i = this.ii | 0;
        indices[i] = indices[i + 5] = index;
        indices[i + 1] = index + 1;
        indices[i + 2] = indices[i + 3] = index + 2;
        indices[i + 4] = index + 3;
        this.ii = i + 6;
    }

    writeQuad_rotated_opt(l: number, t: number, r: number, b: number) {
        const m = this.state.matrix;
        // 8 muls + 4 adds + 8 adds
        const lax = l * m.a + m.x;
        const lby = l * m.b + m.y;
        const rax = r * m.a + m.x;
        const rby = r * m.b + m.y;
        const tc = t * m.c;
        const td = t * m.d;
        const bc = b * m.c;
        const bd = b * m.d;

        const f32 = this.f32;
        let i = this.vi | 0;
        f32[i] = lax + tc;
        f32[i + 1] = lby + td;
        f32[i + 6] = rax + tc;
        f32[i + 7] = rby + td;
        f32[i + 12] = rax + bc;
        f32[i + 13] = rby + bd;
        f32[i + 18] = lax + bc;
        f32[i + 19] = lby + bd;

        const uv = this.state.uv;
        f32[i + 2] = f32[i + 8] = uv.x;
        f32[i + 9] = f32[i + 15] = uv.y;
        f32[i + 3] = f32[i + 21] = uv.y + uv.height;
        f32[i + 14] = f32[i + 20] = uv.x + uv.width;

        const u32 = this.u32;
        u32[i + 4] = u32[i + 10] = u32[i + 16] = u32[i + 22] = this.vertexColorMultiplier | 0;
        u32[i + 5] = u32[i + 11] = u32[i + 17] = u32[i + 23] = this.vertexColorOffset | 0;

        this.vi = i + 24;
        const index = this.batcher.baseVertex | 0;
        const indices = this.indexData;
        i = this.ii | 0;
        indices[i] = indices[i + 5] = index;
        indices[i + 1] = index + 1;
        indices[i + 2] = indices[i + 3] = index + 2;
        indices[i + 4] = index + 3;
        this.ii = i + 6;
    }

    // writeQuad(l: number, t: number, r: number, b: number) {
    //     let i = this.vi | 0;
    //     const f32 = this.f32;
    //     const u32 = this.u32;
    //     const m = this.state.matrix;
    //     const uv = this.state.uv;
    //     const cm = this.vertexColorMultiplier | 0;
    //     const co = this.vertexColorOffset | 0;
    //
    // 16 muls + 16 adds
    //     f32[i++] = l * m.a + t * m.c + m.x;
    //     f32[i++] = l * m.b + t * m.d + m.y;
    //     f32[i++] = uv.x;
    //     f32[i++] = uv.y;
    //     u32[i++] = cm;
    //     u32[i++] = co;
    //
    //     f32[i++] = r * m.a + t * m.c + m.x;
    //     f32[i++] = r * m.b + t * m.d + m.y;
    //     f32[i++] = uv.x + uv.width;
    //     f32[i++] = uv.y;
    //     u32[i++] = cm;
    //     u32[i++] = co;
    //
    //     f32[i++] = r * m.a + b * m.c + m.x;
    //     f32[i++] = r * m.b + b * m.d + m.y;
    //     f32[i++] = uv.x + uv.width;
    //     f32[i++] = uv.y + uv.height;
    //     u32[i++] = cm;
    //     u32[i++] = co;
    //
    //     f32[i++] = l * m.a + b * m.c + m.x;
    //     f32[i++] = l * m.b + b * m.d + m.y;
    //     f32[i++] = uv.x;
    //     f32[i++] = uv.y + uv.height;
    //     u32[i++] = cm;
    //     u32[i++] = co;
    //
    //     this.vi = i;
    //
    //     const index = this.batcher.baseVertex | 0;
    //     const indices = this.indexData;
    //     i = this.ii | 0;
    //     indices[i++] = index;
    //     indices[i++] = index + 1;
    //     indices[i++] = index + 2;
    //     indices[i++] = index + 2;
    //     indices[i++] = index + 3;
    //     indices[i++] = index;
    //     this.ii = i;
    // }

    writeVertex(x: number, y: number, u: number, v: number, cm: Color32_ABGR_PMA, co: Color32_ABGR) {
        const m = this.state.matrix;
        const uv = this.state.uv;

        const f32 = this.f32;
        const u32 = this.u32;
        let vi = this.vi;
        f32[vi++] = x * m.a + y * m.c + m.x;
        f32[vi++] = x * m.b + y * m.d + m.y;
        f32[vi++] = uv.x + u * uv.width;
        f32[vi++] = uv.y + v * uv.height;
        u32[vi++] = cm;
        u32[vi++] = co;
        this.vi = vi;
    }

    writeQuadIndices(i0: number, i1: number, i2: number, i3: number, baseVertex: number) {
        const index = this.batcher.getVertexIndex(baseVertex);
        const indices = this.indexData;
        let ii = this.ii;
        indices[ii++] = index + i0;
        indices[ii++] = index + i1;
        indices[ii++] = index + i2;
        indices[ii++] = index + i2;
        indices[ii++] = index + i3;
        indices[ii++] = index + i0;
        this.ii = ii;
    }

    quadColor(x: number, y: number, w: number, h: number, color: Color32_ARGB) {
        this.prepare();

        this.triangles(4, 6);

        const cm = this.state.calcVertexColorMultiplier32(color);
        const co = this.vertexColorOffset;

        this.writeVertex(x, y, 0, 0, cm, co);
        this.writeVertex(x + w, y, 1, 0, cm, co);
        this.writeVertex(x + w, y + h, 1, 1, cm, co);
        this.writeVertex(x, y + h, 0, 1, cm, co);

        this.writeQuadIndices(0, 1, 2, 3, 0);
    }

    quadColor4(x: number, y: number, w: number, h: number, c1: Color32_ARGB, c2: Color32_ARGB, c3: Color32_ARGB, c4: Color32_ARGB) {
        this.prepare();

        this.triangles(4, 6);

        const co = this.vertexColorOffset;

        this.writeVertex(x, y, 0, 0, this.state.calcVertexColorMultiplier32(c1), co);
        this.writeVertex(x + w, y, 1, 0, this.state.calcVertexColorMultiplier32(c2), co);
        this.writeVertex(x + w, y + h, 1, 1, this.state.calcVertexColorMultiplier32(c3), co);
        this.writeVertex(x, y + h, 0, 1, this.state.calcVertexColorMultiplier32(c4), co);

        this.writeQuadIndices(0, 1, 2, 3, 0);
    }

    fillCircle(x: number, y: number, r: number, inner_color: Color32_ARGB, outer_color: Color32_ARGB, segments: number) {
        this.prepare();
        this.triangles(1 + segments, 3 * segments);

        const innerColor = this.state.calcVertexColorMultiplier32(inner_color);
        const outerColor = this.state.calcVertexColorMultiplier32(outer_color);
        this.writeVertex(x, y, 0, 0, innerColor, this.vertexColorOffset);

        const da = 2 * Math.PI / segments;
        for (let a = 0.0; a < 2 * Math.PI; a += da) {
            this.writeVertex(x + r * Math.cos(a), y + r * Math.sin(a), 1, 1, outerColor, this.vertexColorOffset);
        }

        const end = segments - 1;
        for (let i = 0; i < end; ++i) {
            this.writeIndex(0);
            this.writeIndex(i + 1);
            this.writeIndex(i + 2);
        }
        this.writeIndex(0);
        this.writeIndex(segments);
        this.writeIndex(1);
    }

    writeIndices(indices: Uint16Array, base_vertex = 0 /* u16 */) {
        if (!!DEBUG) {
            assert((indices.length % 3) === 0);
        }
        const index = this.batcher.getVertexIndex(base_vertex);
        let i = 0;
        while (i < indices.length) {
            this.indexData[this.ii++] = indices[i++] + index;
            this.indexData[this.ii++] = indices[i++] + index;
            this.indexData[this.ii++] = indices[i++] + index;
        }
    }

    drawIndexedTriangles(positions: Float32Array, colors: Uint32Array, indices: Uint16Array) {
        this.prepare();
        this.triangles(colors.length, indices.length);

        for (let i = 0; i < colors.length; ++i) {
            this.writeVertex(
                positions[i << 1],
                positions[(i << 1) + 1],
                0.5,
                0.5,
                this.state.calcVertexColorMultiplier32(colors[i]),
                this.vertexColorOffset,
            );
        }
        this.writeIndices(indices);
    }

    line(x1: number, y1: number, x2: number, y2: number, color1: Color32_ARGB, color2: Color32_ARGB, lineWidth1: number, lineWidth2: number) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const sn = 0.5 * Math.sin(angle);
        const cs = 0.5 * Math.cos(angle);
        const t2sina1 = sn * lineWidth1;
        const t2cosa1 = cs * lineWidth1;
        const t2sina2 = sn * lineWidth2;
        const t2cosa2 = cs * lineWidth2;

        this.prepare();
        this.triangles(4, 6);

        const m1 = this.state.calcVertexColorMultiplier32(color1);
        const m2 = this.state.calcVertexColorMultiplier32(color2);
        const co = this.vertexColorOffset;

        this.writeVertex(x1 + t2sina1, y1 - t2cosa1, 0, 0, m1, co);
        this.writeVertex(x2 + t2sina2, y2 - t2cosa2, 1, 0, m2, co);
        this.writeVertex(x2 - t2sina2, y2 + t2cosa2, 1, 1, m2, co);
        this.writeVertex(x1 - t2sina1, y1 + t2cosa1, 0, 1, m1, co);

        this.writeQuadIndices(0, 1, 2, 3, 0);
    }

    lineArc(x: number, y: number, r: number,
            angle1: number, angle2: number,
            lineWidth: number, segments: number,
            colorInner: Color32_ARGB, colorOuter: Color32_ARGB) {
        const pi2 = Math.PI * 2;
        const da = pi2 / segments;
        let a = angle1;
        this.prepare();
        const m1 = this.state.calcVertexColorMultiplier32(colorInner);
        const m2 = this.state.calcVertexColorMultiplier32(colorOuter);
        const co = this.vertexColorOffset;
        const hw = lineWidth / 2;
        const r0 = r - hw;
        const r1 = r + hw;
        while (a < angle2) {

            this.triangles(4, 6);
            const ae = Math.min(angle2, a + da);
            const cs0 = Math.cos(a);
            const sn0 = Math.sin(a);
            const cs1 = Math.cos(ae);
            const sn1 = Math.sin(ae);

            this.writeVertex(x + r1 * cs0, y + r1 * sn0, 0, 0, m2, co);
            this.writeVertex(x + r1 * cs1, y + r1 * sn1, 1, 0, m2, co);
            this.writeVertex(x + r0 * cs1, y + r0 * sn1, 1, 1, m1, co);
            this.writeVertex(x + r0 * cs0, y + r0 * sn0, 0, 1, m1, co);

            this.writeQuadIndices(0, 1, 2, 3, 0);

            a += da;
        }
    }
}
