import {Font} from "../rtfont/Font";
import {TextFormat} from "../scene1/TextFormat";
import {Drawer} from "../drawer/Drawer";

export class DevStatGraph {

    values: number[] = [];
    minRange: number = 1000000;
    maxRange: number = -1000000;
    minTotal: number = 1000000;
    maxTotal: number = -1000000;

    threshold: undefined | number = undefined;

    height: number = 60;
    maxCount: number = 3 * 60;
    index: number = 0;

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
        if (this.index >= this.maxCount) {
            this.index = 0;
        }
    }

    private normalizeIndex(i: number): number {
        i += this.index;
        if (i < 0) {
            i += this.maxCount;
        }
        if (i >= this.maxCount) {
            i -= this.maxCount;
        }
        return i;
    }

    private getValue(i: number): number {
        return this.values[this.normalizeIndex(i)];
    }

    format = new TextFormat();

    update() {
        this.minRange = 1000000;
        this.maxRange = -1000000;
        for (let i = 0; i < this.values.length; ++i) {
            const value = this.values[i];
            if (value > this.maxRange) {
                this.maxRange = value;
            }
            if (value < this.minRange) {
                this.minRange = value;
            }
        }
    }

    drawGraph(drawer: Drawer) {

        const pointsDistance = 2;
        const sz = 2;
        const right = this.maxCount * pointsDistance;

        drawer.quadColor(0, 0, right, this.height, 0x77000000);
        if (this.threshold !== undefined && this.minTotal <= this.threshold && this.maxTotal >= this.threshold) {
            const y = this.height * (1 - (this.threshold - this.minTotal) / (this.maxTotal - this.minTotal))
            drawer.quadColor(0, y, right, 2, 0x77FFFF00);
        }

        let x = 0;
        let prevY = undefined;
        for (let i = 0; i < this.maxCount; ++i) {
            let idx = this.index + i;
            if (idx >= this.maxCount) {
                idx -= this.maxCount;
            }
            const v0 = this.values[idx];
            const y0 = this.height * (1 - (v0 - this.minTotal) / (this.maxTotal - this.minTotal));
            if (prevY !== undefined && Math.abs(prevY - y0) >= 0.00001) {
                if (prevY > y0) {
                    drawer.quadFast(x - 0.5 * sz, y0 - 0.5 * sz, sz, sz + prevY - y0, true);
                    // drawer.quadColor(x - sz, y0, sz, prevY - y0, 0xFFFF0000);
                } else {
                    drawer.quadFast(x - 0.5 * sz, prevY - 0.5 * sz, sz, sz + y0 - prevY, true);
                    // drawer.quadColor(x - sz, prevY, sz, y0 - prevY, 0xFF00FF00);
                }
            } else {
                drawer.quadFast(x - 0.5 * sz, y0 - 0.5 * sz, sz, sz, true);
            }

            x += pointsDistance;
            prevY = y0;
        }
    }

    drawLabels(font: Font) {
        const pointsDistance = 2;
        const right = this.maxCount * pointsDistance;
        const fontSize = 16;

        font.draw(this.name + ' ' + this.maxTotal, fontSize, 0, 0, fontSize, 0);
        font.draw(this.minTotal.toString(), fontSize, 0, this.height - fontSize, fontSize, 0);

        const value = this.getValue(-1);
        const y = this.height * (1 - (value - this.minTotal) / (this.maxTotal - this.minTotal))
        font.draw(this.name + ': ' + value, fontSize, right, y - fontSize / 2, fontSize, 0);
    }

}