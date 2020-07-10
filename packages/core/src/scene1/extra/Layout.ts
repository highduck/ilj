import {Rect, Vec2} from "@highduck/math";
import {Transform2D} from "../display/Transform2D";
import {Component} from "../..";

export class Layout extends Component() {
    readonly x = new Vec2();
    readonly y = new Vec2();
    readonly fillExtra = new Rect();
    fillX = false;
    fillY = false;
    alignX = false;
    alignY = false;

    static readonly space = new Rect(0, 0, 1, 1);

    aligned(rel_x = 0.0, abs_x = 0.0, rel_y = 0.0, abs_y = 0.0): this {
        this.horizontal(rel_x, abs_x);
        this.vertical(rel_y, abs_y);
        return this;
    }

    hard(x: number, y: number): this {
        const transform = this.entity.get(Transform2D);
        this.horizontal(x, transform.position.x - (Layout.space.x + Layout.space.width * x));
        this.vertical(y, transform.position.y - (Layout.space.y + Layout.space.height * y));
        return this;
    }

    hard_y(y = 0.0): this {
        const transform = this.entity.get(Transform2D);
        this.vertical(y, transform.position.y - (Layout.space.y + Layout.space.height * y));
        return this;
    }

    horizontal(multiplier = 0.0, offset = 0.0): this {
        this.alignX = true;
        this.x.set(multiplier, offset);
        return this;
    }

    vertical(multiplier = 0.0, offset = 0.0): this {
        this.alignY = true;
        this.y.set(multiplier, offset);
        return this;
    }

    fill(horizontal = true, vertical = true): this {
        this.fillX = horizontal;
        this.fillY = vertical;
        return this;
    }

    setFillExtra(rc: Rect): this {
        this.fillExtra.copyFrom(rc);
        return this;
    }
}