import {Matrix2D} from "./Matrix2D";
import {Vec2} from "./Vec2";

const TEMP_VEC2 = new Vec2();

export class Recta {
    static readonly EMPTY: Readonly<Recta> = new Recta(0.0, 0.0, 0.0, 0.0);
    static readonly UNIT: Readonly<Recta> = new Recta(0.0, 0.0, 1.0, 1.0);

    x = Number.NaN;
    y = Number.NaN;
    width = Number.NaN;
    height = Number.NaN;

    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    clone(): Recta {
        return new Recta(this.x, this.y, this.width, this.height);
    }

    copyFrom(rc: Recta): this {
        this.x = rc.x;
        this.y = rc.y;
        this.width = rc.width;
        this.height = rc.height;
        return this;
    }

    set(x: number, y: number, width: number, height: number): this {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }

    setZero(): this {
        this.x = 0.0;
        this.y = 0.0;
        this.width = 0.0;
        this.height = 0.0;
        return this;
    }

    setBounds(l: number, t: number, r: number, b: number): this {
        this.x = Math.min(l, r);
        this.y = Math.min(t, b);
        this.width = Math.abs(l - r);
        this.height = Math.abs(t - b);
        return this;
    }

    setTuple(values: [number, number, number, number]) {
        this.x = +values[0];
        this.y = +values[1];
        this.width = +values[2];
        this.height = +values[3];
    }

    intersect(rc: Recta) {
        const l = Math.max(this.x, rc.x);
        const t = Math.max(this.y, rc.y);
        const r = Math.min(this.right, rc.right);
        const b = Math.min(this.bottom, rc.bottom);
        this.set(l, t, r - l, b - t);
    }

    combine(rc: Recta) {
        const l = Math.min(this.x, rc.x);
        const t = Math.min(this.y, rc.y);
        const r = Math.max(this.right, rc.right);
        const b = Math.max(this.bottom, rc.bottom);
        this.set(l, t, r - l, b - t);
    }

    get right(): number {
        return this.x + this.width;
    }

    set right(v: number) {
        this.x = v - this.width;
    }

    get bottom(): number {
        return this.y + this.height;
    }

    set bottom(v: number) {
        this.y = v - this.height;
    }

    get centerX(): number {
        return this.x + 0.5 * this.width;
    }

    get centerY(): number {
        return this.y + 0.5 * this.height;
    }

    scale(x: number, y: number): this {
        this.x *= x;
        this.y *= y;
        this.width *= x;
        this.height *= y;
        return this;
    }

    contains(x: number, y: number): boolean {
        return this.x <= x && x <= (this.x + this.width) && this.y <= y && y <= (this.y + this.height);
        // A little more complicated than usual due to proper handling of negative widths/heights
        // x -= this.x;
        // if (this.width >= 0) {
        //     if (x < 0 || x > this.width) {
        //         return false;
        //     }
        // } else if (x > 0 || x < this.width) {
        //     return false;
        // }
        //
        // y -= this.y;
        // if (this.height >= 0) {
        //     if (y < 0 || y > this.height) {
        //         return false;
        //     }
        // } else if (y > 0 || y < this.height) {
        //     return false;
        // }
        //
        // return true;
    }

    relative(rx: number, ry: number): [number, number] {
        return [this.x + rx * this.width, this.y + ry * this.height];
    }

    get empty(): boolean {
        return this.width <= 0 || this.height <= 0;
    }

    overlaps(rc: Recta): boolean {
        return this.x <= rc.right && rc.x <= this.right && this.y <= rc.bottom && rc.y <= this.bottom;
    }

    writeToArray(arr: number[], start: number) {
        arr[start++] = this.x;
        arr[start++] = this.y;
        arr[start++] = this.width;
        arr[start++] = this.height;
    }

    readFromArray(arr: number[], start: number) {
        this.x = arr[start++];
        this.y = arr[start++];
        this.width = arr[start++];
        this.height = arr[start++];
    }

    expand(dx: number, dy: number): this {
        this.x -= dx;
        this.y -= dy;
        this.width += dx * 2;
        this.height += dy * 2;
        return this;
    }

    toString() {
        return `Rect(${this.x}, ${this.y}, w: ${this.width}, h: ${this.height})`;
    }

    equals(other: Recta) {
        return this.x === other.x && this.y === other.y &&
            this.width === other.width && this.height === other.height;
    }

    transform(matrix: Matrix2D): this {
        const v = TEMP_VEC2;
        matrix.transform(this.x, this.y, v);
        const x0 = v.x;
        const y0 = v.y;
        matrix.transform(this.right, this.y, v);
        const x1 = v.x;
        const y1 = v.y;
        matrix.transform(this.right, this.bottom, v);
        const x2 = v.x;
        const y2 = v.y;
        matrix.transform(this.x, this.bottom, v);
        const x3 = v.x;
        const y3 = v.y;
        this.x = Math.min(x0, x1, x2, x3);
        this.y = Math.min(y0, y1, y2, y3);
        this.width = Math.max(x0, x1, x2, x3) - this.x;
        this.height = Math.max(y0, y1, y2, y3) - this.y;
        return this;
    }
}