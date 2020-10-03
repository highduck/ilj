import {Matrix2D} from "./Matrix2D";

export class Matrix4 {
    static readonly IDENTITY: Readonly<Matrix4> = new Matrix4(1.0);

    readonly data = new Float32Array(16);

    constructor(n = 1.0) {
        this.setIdentity(n);
    }

    setIdentity(n = 1.0) {
        this.data.set([
            n, 0, 0, 0,
            0, n, 0, 0,
            0, 0, n, 0,
            0, 0, 0, n,
        ]);
    }

    copyFrom(matrix: Matrix4) {
        this.data.set(matrix.data);
    }

    orthoProjectionRH(left: number, right: number, bottom: number, top: number, z_near: number, z_far: number): this {
        const m = this.data;
        m.fill(0);
        m[0] = 2 / (right - left);
        m[5] = 2 / (top - bottom);
        m[10] = -2 / (z_far - z_near);
        m[12] = -(right + left) / (right - left);
        m[13] = -(top + bottom) / (top - bottom);
        m[14] = -(z_far + z_near) / (z_far - z_near);
        m[15] = 1;
        return this;
    }

    ortho2D(x: number, y: number, width: number, height: number): this {
        return this.orthoProjectionRH(x, x + width, y + height, y, -1, 1);
    }

    writeToArray(arr: number[], start: number) {
        for (let i = 0; i < 16; ++i) {
            arr[start + i] = this.data[i];
        }
    }

    readFromArray(arr: number[], start: number) {
        for (let i = 0; i < 16; ++i) {
            this.data[i] = arr[start + i];
        }
    }

    static multiply(a: Float32Array, b: Float32Array, out: Float32Array) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
            a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
            a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
            a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        // Cache only the current line of the second matrix
        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }

    static invert(a: Float32Array, out: Float32Array) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
            a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
            a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
            a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32;

        // Calculate the determinant
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
            return;
        }
        det = 1.0 / det;

        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    }

    static multiply4x4by3x2(a: Float32Array, b: Matrix2D, out: Float32Array) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];

        let b0 = b.a;
        let b1 = b.b;
        out[0] = b0 * a00 + b1 * a10;
        out[1] = b0 * a01 + b1 * a11;
        out[2] = b0 * a02 + b1 * a12;
        out[3] = b0 * a03 + b1 * a13;

        b0 = b.c;
        b1 = b.d;
        out[4] = b0 * a00 + b1 * a10;
        out[5] = b0 * a01 + b1 * a11;
        out[6] = b0 * a02 + b1 * a12;
        out[7] = b0 * a03 + b1 * a13;

        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];

        b0 = b.x;
        b1 = b.y;
        out[12] = b0 * a00 + b1 * a10 + a[12];
        out[13] = b0 * a01 + b1 * a11 + a[13];
        out[14] = b0 * a02 + b1 * a12 + a[14];
        out[15] = b0 * a03 + b1 * a13 + a[15];
    }
}
