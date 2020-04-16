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
        this.data.set([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -2 / (z_far - z_near), 0,
            -(right + left) / (right - left),
            -(top + bottom) / (top - bottom),
            -(z_far + z_near) / (z_far - z_near),
            1,
        ]);
        return this;
    }

    ortho2D(x: number, y: number, width: number, height: number, z_near = -1, z_far = 1): this {
        return this.orthoProjectionRH(x, x + width, y + height, y, z_near, z_far);
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
