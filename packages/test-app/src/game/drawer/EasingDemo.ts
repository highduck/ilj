import {Alignment, Engine, BitmapFont, BitmapFontResource, TextFormat} from "@highduck/core";
import * as Easing from "@highduck/math";
import {EaseFunction, Recta} from "@highduck/math";

class EaseFunc {
    easeIn: EaseFunction;
    easeOut: EaseFunction;
    easeInOut: EaseFunction;
    easeOutIn: EaseFunction;

    constructor(public name: string,
                public fn: EaseFunction) {
        this.easeIn = fn;
        this.easeOut = Easing.easeOut(fn);
        this.easeInOut = Easing.easeInOut(fn);
        this.easeOutIn = Easing.easeOutIn(fn);
    }
}

export class EasingDemo {

    font = BitmapFontResource.get("Comfortaa-Regular");
    tf = new TextFormat(16, Alignment.Center);
    cx: number = 0;
    cy: number = 0;
    ci: number = 0;

    plotSize: number = 170.0;
    axisSize: number = 30.0;
    space: number = 20.0;

    easings: EaseFunc[] = [
        // new EaseFunc("Linear", Easing.linear),
        // new EaseFunc("Step", Easing.step),
        // new EaseFunc("Quad", Easing.quadIn),
        // new EaseFunc("Cubic", Easing.cubicIn),
        // new EaseFunc("Quart", Easing.quartIn),
        // new EaseFunc("Quint", t=>Easing.polynom(t, 5)),
        new EaseFunc("Circ", Easing.circIn),
        new EaseFunc("Expo", Easing.expoIn),
        // new EaseFunc("Sine", Easing.sine),
        new EaseFunc("Back", Easing.backIn),
        new EaseFunc("Elastic", Easing.elasticIn),
        new EaseFunc("Bounce", Easing.bounceIn),
    ];

    constructor() {
        this.tf.shadow = true;
        this.tf.shadowOffset.set(0, 2);
    }

    draw() {
        const engine = Engine.current;
        const drawer = engine.drawer;
        drawer.state.setEmptyTexture();
        const scale = engine.view.contentScale;
        drawer.state.saveMatrix().scale(scale, scale);
        {
            this.restart();
            for (const e of this.easings) {
                this.drawNext(e.easeIn);
                this.drawNext(e.easeOut);
                this.drawNext(e.easeInOut);
                this.drawNext(e.easeOutIn);
            }

            const font = this.font.data;
            if (font) {
                this.restart();
                for (const e of this.easings) {
                    this.drawNextText(font, e.name + " In");
                    this.drawNextText(font, e.name + " Out");
                    this.drawNextText(font, e.name + " In-Out");
                    this.drawNextText(font, e.name + " Out-In");
                }
            }
        }
        drawer.state.restoreMatrix();
        drawer.state.setEmptyTexture();
    }

    private drawEasingCurve(fn: Easing.EaseFunction) {
        const engine = Engine.current;
        const drawer = engine.drawer;
        const axisSize = this.axisSize;
        const size = this.plotSize - axisSize;

        drawer.quadColor4(0, 0, size, size,
            0x77000000, 0x77000000,
            0xCC000000, 0xCC000000);

        let t = engine.time.total;
        t -= Math.floor(t);
        t = Math.min(1, t * 1.5);

        // linear
        drawer.line(
            0,
            size,
            size * t,
            size * (1 - t),
            0x33FFFFFF, 0x33FFFFFF,
            1.0, 1.0
        );
        drawer.line(
            size * t,
            size * (1 - t),
            size,
            0,
            0x11FFFFFF, 0x11FFFFFF,
            1.0, 1.0
        );
        const stressLineW = Math.max(1, 8 * Math.abs(t - fn(t)));
        drawer.line(
            size * t,
            size * (1 - t),
            size * t,
            size * (1 - fn(t)),
            0x77FFFF00, 0x7700FF00,
            stressLineW, stressLineW
        );

        drawer.fillCircle(size * t, size * (1 - t), 4, 0x00FFFFFF, 0xFFFFFFFF, 8);

        const dt = 1.0 / 100;
        for (let r = 0; r <= 1; r += dt) {
            const col = r < t ? 0xFFFFFFFF : 0x77FFFFFF;
            const w = r < t ? 2 : 1;
            drawer.line(
                size * r,
                size * (1 - fn(r)),
                size * (r + dt),
                size * (1 - fn(r + dt)),
                col, col,
                w, w
            );
        }

        // function
        drawer.fillCircle(size * t, size * (1 - fn(t)), 4, 0xFFFFFF00, 0xFF00FF00, 8);

        // function-y
        drawer.fillCircle(size + axisSize / 2, size * (1 - fn(t)), 8, 0xFF000000, 0xFFFFFFFF, 4);
    }

    private drawNext(fn: EaseFunction) {
        const engine = Engine.current;
        const drawer = engine.drawer;
        drawer.state.saveMatrix().translate(this.cx, this.cy);
        {
            this.drawEasingCurve(fn);
        }
        drawer.state.restoreMatrix();
        this.advance();
    }

    private restart() {
        this.cx = this.space;
        this.cy = this.space + 20;
        this.ci = 0;
    }

    private advance() {
        this.cx += this.plotSize + this.space;
        ++this.ci;
        if (this.ci == 4) {
            this.ci = 0;
            this.cx = this.space;
            this.cy += this.plotSize + this.space;
        }
    }

    private drawNextText(fnt: BitmapFont, name: string) {
        const engine = Engine.current;
        const drawer = engine.drawer;
        drawer.state.saveMatrix().translate(this.cx, this.cy);
        {
            fnt.drawText(name, this.tf,
                new Recta(0, -this.space - 10, this.plotSize - this.axisSize, this.space));
        }
        drawer.state.restoreMatrix();
        this.advance();
    }
}