import {Engine} from "./Engine";
import {Font, FontResource} from "./rtfont/Font";
import {TextFormat} from "./scene1/TextFormat";

export class DevStatGraph {

    values: number[] = [];
    min: number = 1000000;
    max: number = -1000000;

    constructor() {
    }

    add(value: number) {
        this.values.push(value);
    }

    format = new TextFormat();

    draw() {
        const start = Math.max(0, this.values.length - 400);
        this.min = 1000000;
        this.max = -1000000;
        for (let i = start; i < this.values.length; ++i) {
            const value = this.values[i];
            if (value > this.max) {
                this.max = value;
            }
            if (value < this.min) {
                this.min = value;
            }
        }

        const drawer = Engine.current.drawer;
        const font = FontResource.data("Comfortaa-Regular");
        if (font !== undefined) {
            font.draw(this.max.toString(), 16, 0, 20, 16, 0);
            font.draw(this.min.toString(), 16, 0, 20 + 200, 16, 0);
        }

        drawer.state.setEmptyTexture();
        const pointsDistance = 4;
        for (let i = start; i < this.values.length - 1; ++i) {
            const v0 = this.values[i];
            const v1 = this.values[i + 1];
            const x0 = pointsDistance * (i - start);
            const x1 = pointsDistance * (i - start + 1);
            const y0 = 200 * (1 - (v0 - this.min) / (this.max - this.min));
            const y1 = 200 * (1 - (v1 - this.min) / (this.max - this.min));
            drawer.line(x0, y0, x1, y1, 0xFFFFFFFF, 0xFFFFFFFF, 2, 2);
        }
    }

}