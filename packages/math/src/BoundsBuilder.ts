import {Rect} from "./Rect";
import {Vec2} from "./Vec2";

const LIMIT = 1e10;
const EPSILON = 1e-6;

export class BoundsBuilder {
    x0 = LIMIT;
    y0 = LIMIT;
    x1 = -LIMIT;
    y1 = -LIMIT;

    reset(): this {
        this.x0 = LIMIT;
        this.y0 = LIMIT;
        this.x1 = -LIMIT;
        this.y1 = -LIMIT;
        return this;
    }

    copyFrom(o:BoundsBuilder):this {
        this.x0 = o.x0;
        this.y0 = o.y0;
        this.x1 = o.x1;
        this.y1 = o.y1;
        return this;
    }

    addPoint(x: number, y: number): this {
        return this.addBounds(x, y, x, y);
    }

    addBounds(l: number, t: number, r: number, b: number): this {
        if (l < this.x0) {
            this.x0 = l;
        }
        if (r > this.x1) {
            this.x1 = r;
        }
        if (t < this.y0) {
            this.y0 = t;
        }
        if (b > this.y1) {
            this.y1 = b;
        }
        return this;
    }

    addRect(x: number, y: number, width: number, height: number): this {
        return this.addBounds(x, y, x + width, y + height);
    }

    get empty(): boolean {
        return (this.x1 - this.x0) < EPSILON || (this.y1 - this.y0) < EPSILON;
    }

    getResultRect(out?: Rect): Rect {
        if (out === undefined) {
            out = new Rect();
        }
        return out.set(this.x0, this.y0, this.width, this.height);
    }

    getSize(out?: Vec2): Vec2 {
        if (out === undefined) {
            out = new Vec2();
        }
        return out.set(this.width, this.height);
    }

    get width(): number {
        return this.x1 > this.x0 ? (this.x1 - this.x0) : 0;
    }

    get height(): number {
        return this.y1 > this.y0 ? (this.y1 - this.y0) : 0;
    }
}
