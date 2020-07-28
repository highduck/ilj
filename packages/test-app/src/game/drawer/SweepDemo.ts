import {Color32_ARGB, lerp, Recta, sweepCircles, SweepTestResult, Vec2, Vec3} from "@highduck/math";
import {Engine} from "@highduck/core";

const SWEEP_RES = new SweepTestResult();

export class SweepDemo {

    readonly a0 = new Recta(100, 100, 100, 20);
    readonly a1 = new Recta(100, 300, 100, 20);

    readonly b0 = new Recta(50, 200, 100, 100);
    readonly b1 = new Recta(50, 200, 100, 100);

    readonly ray0 = new Vec2(400, 400);
    readonly rayDir = new Vec2(-50, -50);

    readonly c = new Vec3(300, 300, 40);
    readonly c2 = new Vec2(350, 400);

    c2_x = 200;
    c2_y = 200;
    c2_r = 80;

    c2_x2 = 350;
    c2_y2 = 350;

    constructor() {
        const engine = Engine.current;
        engine.onUpdate.on(() => this.update());
        engine.onRender.on(() => this.draw());
    }

    update() {
        const engine = Engine.current;
        const inter = engine.interactiveManager;
        const pointer = inter.pointerScreenSpace;
        // const dt = engine.time.delta;
        this.b1.x = pointer.x;
        this.b1.y = pointer.y;
        if (inter.pointerDown) {
            this.b0.x = pointer.x;
            this.b0.y = pointer.y;
        }

        this.c2_x2 = pointer.x;
        this.c2_y2 = pointer.y;
        if (inter.pointerDown) {
            this.c2_x = pointer.x;
            this.c2_y = pointer.y;
        }

    }


    draw() {
        const engine = Engine.current;
        const drawer = engine.drawer;

        //sweepRects(this.a0, this.a1, this.b0, this.b1, SWEEP_RES);
        // drawPath(a0, a1, 0xFF0000FF);
        // fillRect(a0, 0xFFFFFFFF);
        // fillRect(a1, 0x77FFFFFF);
        //
        // drawPath(b0, b1, 0xFF00FF00);
        // fillRect(b0, 0xFFFFFFFF);
        // fillRect(b1, 0x77FFFFFF);

        // if (SWEEP_RES.hit) {
        //     const color = 0x77FFFF00;
        //     const rc = this.a0.lerp(a1, SWEEP_RES.u0);
        //     fillRect(rc, color);
        //     drawRectFace(rc, info.nx, info.ny);
        //     rc = b0.lerp(b1, info.u0);
        //     fillRect(rc, color);
        //     drawRectFace(rc, -info.nx, -info.ny);
        // }


        // const dir = new Vec2(this.ray.dx + b0.x - b1.x, ray.dy + b0.y - b1.y);
        // info = intersectRayRect(this.b0, this.ray0, ray.dx + b0.x - b1.x, ray.dy + b0.y - b1.y, SWEEP_RES);
        // drawRay(ray);
        // if (info.ray && info.u0 <= 1) {
        //     drawPoint(ray.x + ray.dx * info.u0, ray.y + ray.dy * info.u0, 0xFFFF0000);
        //     fillRect(b0.lerp(b1, info.u0), 0x77FFFF00);
        // }

        drawer.line(this.c.x, this.c.y, this.c2.x, this.c2.y, 0x7700FF00, 0x7700FF00, 2, 2);
        this.fillCircle(this.c.x, this.c.y, this.c.z, 0xFFFFFFFF);
        this.fillCircle(this.c2.x, this.c2.y, this.c.z, 0x77FFFFFF);
        // info = SweepTest.circleRect(c, new Vector2(c2.x - c.x, c2.y - c.y), b0, new Vector2(b1.x - b0.x, b1.y - b0.y));
        // if (info.hit) {
        //     var cx = MathUtil.lerp(c.x, c2.x, info.u0);
        //     var cy = MathUtil.lerp(c.y, c2.y, info.u0);
        //     lineCircle(cx, cy, c.r, 0xFFFFFF00);
        //
        //     fillRect(b0.lerp(b1, info.u0), 0x77FFFF00);
        //
        //     drawer.line2(cx, cy, cx + info.nx * 10, cy + info.ny * 10, 0xFF000099, 0xFF000099, 3, 1);
        // }

        // drawer.lineColor.color = 0x7700FF00;
        drawer.line(this.c2_x, this.c2_y, this.c2_x2, this.c2_y2, 0x7700FF00, 0x7700FF00, 2, 2);
        this.fillCircle(this.c2_x, this.c2_y, this.c2_r, 0xFFFFFFFF);
        this.fillCircle(this.c2_x2, this.c2_y2, this.c2_r, 0x77FFFFFF);
        const c2 = new Vec3(this.c2_x, this.c2_y, this.c2_r);
        const d = new Vec2(-this.c2.x + this.c.x + this.c2_x2 - this.c2_x, -this.c2.y + this.c.y + this.c2_y2 - this.c2_y);
        sweepCircles(
            this.c, c2, d,
            SWEEP_RES
        );
        if (SWEEP_RES.hit) {
            this.fillCircle(
                lerp(this.c2_x, this.c2_x2, SWEEP_RES.u0),
                lerp(this.c2_y, this.c2_y2, SWEEP_RES.u0),
                this.c2_r,
                0xFFFFFF00
            );

            this.fillCircle(
                lerp(this.c.x, this.c2.x, SWEEP_RES.u0),
                lerp(this.c.y, this.c2.y, SWEEP_RES.u0),
                this.c.z,
                0xFFFFFF00
            );
        }
    }

    // fillRect(rc: Rect, color: ARGB32) {
    //     drawer.quadColor(rc.x, rc.y, rc.width, rc.height, color);
    // }

    // drawPath(rc0: Rect, rc1: Rect, color: ARGB32) {
    //     drawer.line(rc0.x, rc0.y, rc1.x, rc1.y, color);
    //     drawer.line(rc0.right, rc0.y, rc1.right, rc1.y, color);
    //     drawer.line(rc0.right, rc0.bottom, rc1.right, rc1.bottom, color);
    //     drawer.line(rc0.x, rc0.bottom, rc1.x, rc1.bottom, color);
    // }
    //
    // drawRectFace(rc: Rect, nx: Float, ny: Float) {
    //     var color = 0xFFFF0000;
    //     if (nx < 0) {
    //         drawer.line(rc.x, rc.y, rc.x, rc.bottom, color);
    //     }
    //     if (nx > 0) {
    //         drawer.line(rc.right, rc.y, rc.right, rc.bottom, color);
    //     }
    //     if (ny < 0) {
    //         drawer.line(rc.x, rc.y, rc.right, rc.y, color);
    //     }
    //     if (ny > 0) {
    //         drawer.line(rc.x, rc.bottom, rc.right, rc.bottom, color);
    //     }
    // }

    fillCircle(x: number, y: number, r: number, color: Color32_ARGB) {
        Engine.current.drawer.fillCircle(x, y, r, color, 0xFFFFFFFF, 24);
    }

    lineCircle(x: number, y: number, r: number, color: Color32_ARGB) {
        // drawer.lineCircle(x, y, r, color);
    }

    // drawRay(ray: Ray) {
    //     var color = 0xFF000099;
    //     drawer.line2(ray.position.x, ray.position.y, ray.end.x, ray.end.y, color, color, 3, 1);
    // }
    //
    // drawPoint(x: Float, y: Float, color: ARGB32) {
    //     fillCircle(x, y, 2, color);
    // }
}