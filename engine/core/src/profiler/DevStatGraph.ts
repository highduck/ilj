import {Font} from "../rtfont/Font";
import {Drawer} from "../drawer/Drawer";

const MAX_COUNT = 3 * 60;

export class DevStatGraph {

    readonly values = new Int32Array(MAX_COUNT);
    minTotal = 0;
    maxTotal = 0;
    delta = 0;
    threshold = 0;
    height = 60;
    index = 0;

    constructor(readonly name: string) {
    }

    add(value: number) {
        if (value < this.minTotal) {
            this.minTotal = value;
        }
        if (value > this.maxTotal) {
            this.maxTotal = value;
        }
        this.values[this.index++] = value;
        if (this.index >= MAX_COUNT) {
            this.index = 0;
        }

        this.delta = this.maxTotal - this.minTotal;
    }

    drawBackground(drawer: Drawer) {
        const pointsDistance = 2;
        const right = MAX_COUNT * pointsDistance;

        drawer.quadColor(0, 0, right, this.height, 0x77000000);

        const y = this.calcY(this.threshold);
        drawer.quadColor(0, y, right, 2, 0x77FFFF00);
    }

    drawGraph(drawer: Drawer) {
        const sz = 2;
        let x = 0;
        let prevY = this.calcY(this.values[this.index]);

        for (let i = 0; i < MAX_COUNT; ++i) {
            let idx = this.index + i;
            if (idx >= MAX_COUNT) {
                idx -= MAX_COUNT;
            }
            const v0 = this.values[idx];
            const y0 = this.calcY(v0);
            const plY = prevY < y0 ? prevY : y0;
            const plH = prevY > y0 ? (prevY - y0) : (y0 - prevY);
            drawer.quadFast(x - 0.5 * sz, plY - 0.5 * sz, sz, plH + sz, true);

            x += sz;
            prevY = y0;
        }
    }

    calcY(value: number) {
        const delta = this.delta;
        const v = delta > 0 ? (+(delta - (value - this.minTotal)) / +delta) : 1.0;
        return Math.trunc(v * +this.height) | 0;
    }

    drawLabels(font: Font) {
        const fontSize = 16;

        font.draw(this.name, fontSize, 0, 0, fontSize, 0);
        font.draw(this.maxTotal.toString(), fontSize, 0, fontSize, fontSize, 0);
        font.draw(this.minTotal.toString(), fontSize, 0, this.height - fontSize, fontSize, 0);
    }

    drawLabelCurrent(font: Font) {
        const pointsDistance = 2;
        const right = MAX_COUNT * pointsDistance;
        const fontSize = 16;

        let lastIndex = this.index;
        if (--lastIndex < 0) {
            lastIndex += MAX_COUNT;
        }
        const value = this.values[lastIndex];
        const y = this.calcY(value);
        font.draw(value.toString(), fontSize, right, y - fontSize / 2, fontSize, 0);
    }
}