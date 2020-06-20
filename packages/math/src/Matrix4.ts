export class Matrix4 {
    static readonly IDENTITY: Readonly<Matrix4> = new Matrix4();

    readonly data = new Float32Array(16);

    constructor(n = 1) {
        this.setIdentity(n);
    }

    setIdentity(n = 1) {
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
}
