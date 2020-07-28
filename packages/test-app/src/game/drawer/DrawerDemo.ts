import {AssetRef, BitmapFont, BitmapFontResource, Engine, Texture} from "@highduck/core";
import {Poly2Tri} from "@highduck/polykit";

class ExampleMesh2D {

    positions = new Float32Array([
        -10, -10,
        0, -15,
        10, -10,
        10, 10,
        -10, 10
    ]);

    colors = new Uint32Array([
        0xFF00FF00,
        0xFFFF0000,
        0xFF00FF00,
        0x770000FF,
        0x770000FF
    ]);

    indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3,
        0, 3, 4
    ]);
}

export class DrawerDemo {
    exampleMesh2D = new ExampleMesh2D();
    polyKitMesh = new ExampleMesh2D();
    customTexture = new Texture(Engine.current.graphics);
    readonly font: AssetRef<BitmapFont> = BitmapFontResource.get("Comfortaa-Regular");

    constructor() {
        this.customTexture.uploadPixels(4, 4, new Uint8Array(new Uint32Array([
            0x00000000, 0x00000000, 0x00000000, 0x00000000,
            0x00000000, 0xFFFFFFFF, 0xFFFFFFFF, 0x00000000,
            0x00000000, 0xFF777777, 0xFF777777, 0x00000000,
            0x00000000, 0x00000000, 0x00000000, 0x00000000,
        ]).buffer, 0));

        this.createPolyKitMesh();
    }

    draw(testQuadsCount: number) {
        const engine = Engine.current;
        const drawer = engine.drawer;
        const w = engine.graphics.framebufferWidth;
        const h = engine.graphics.framebufferHeight;
        this.drawRandomQuads(w, h, testQuadsCount);
        this.drawSimpleQuads();
        this.drawMesh2D();

        drawer.state.saveMatrix().translate(w / 2, h / 2);
        this.drawSpinner();
        drawer.state.restoreMatrix();

        drawer.state.saveMatrix().translate(w / 2, h * 3 / 4);
        this.drawPolyKit();
        drawer.state.restoreMatrix();

        drawer.state.saveMatrix().translate(w / 2, h / 4);
        this.drawText();
        drawer.state.restoreMatrix();
    }

    drawRandomQuads(width: number, height: number, count: number) {
        const drawer = Engine.current.drawer;
        drawer.state.setEmptyTexture();
        drawer.prepare();
        for (let i = 0; i < count; ++i) {
            drawer.quadFast(
                width * Math.random() - 1,
                height * Math.random() - 1,
                2, 2,
                true
            );
        }
    }

    drawSimpleQuads() {
        const engine = Engine.current;
        const time = engine.time.total;
        const drawer = engine.drawer;

        drawer.state.setTexture(this.customTexture);
        {
            drawer.quadFast(0, 0, 100, 100, true);
            drawer.quadFast(110, 0, 100, 100, false);

            drawer.state.saveTextureCoords().setTextureCoords(0.2, 0.2, 0.6, 0.6);
            drawer.state.saveMatrix().translate(220, 0);
            {
                drawer.quadFast(0, 0, 100, 100, true);
                drawer.quadFast(110, 0, 100, 100, false);
            }
            drawer.state.restoreMatrix();
            drawer.state.restoreTextureCoords();
        }

        drawer.state.setEmptyTexture();
        drawer.quadColor(110 + 5, 110 + 5, 20, 20, 0x77FF0000);
        drawer.quadColor(130 + 5, 110 + 5, 20, 20, 0x7700FF00);
        drawer.quadColor(150 + 5, 110 + 5, 20, 20, 0x770000FF);
        drawer.quadColor(110, 110, 20, 20, 0xFFFF0000);
        drawer.quadColor(130, 110, 20, 20, 0xFF00FF00);
        drawer.quadColor(150, 110, 20, 20, 0xFF0000FF);
        drawer.state.saveMatrix().translate(300, 300).rotate(-time);
        {
            drawer.quadColor4(-100, -100, 200, 200, 0xFFFF0000, 0xFF00FF00, 0xFF0000FF, 0xFFFF00FF);
        }
        drawer.state.restoreMatrix();

        drawer.state.saveTransform().translate(300, 300).rotate(time);
        {
            drawer.state.colorOffset.a = 1.0; // fully additive
            drawer.fillCircle(0, 0, 30, 0xFF000000, 0xFFFFFFFF, 3 + ((0.5 + 0.5 * Math.sin(time * 4)) * 17) | 0);
            drawer.state.matrix.translate(110, 0).scale(3, 1).rotate(time * 4);

            drawer.state.colorOffset.a = 0.5; // half additive
            drawer.fillCircle(0, 0, 30, 0xFF000000, 0xFFFFFFFF, 5);
        }
        drawer.state.restoreTransform();
    }

    drawMesh2D() {
        const engine = Engine.current;
        const drawer = engine.drawer;
        const mesh2d = this.exampleMesh2D;
        drawer.state.setEmptyTexture();
        drawer.state.saveMatrix().translate(400, 400).scale(4, 4);
        drawer.drawIndexedTriangles(mesh2d.positions, mesh2d.colors, mesh2d.indices);
        drawer.state.restoreMatrix();
    }

    private spinnerTimer = 0;

    drawSpinner() {
        const engine = Engine.current;
        const drawer = engine.drawer;
        const time = engine.time.total;
        const dt = engine.time.delta;

        drawer.state.setEmptyTexture();
        drawer.lineArc(0, 0, 50, 0, Math.PI * 2,
            24, 30, 0xFF777777, 0xFF999999);
        const sp = 2 + Math.sin(time * 3);
        this.spinnerTimer += (2.5 + sp) * dt;
        drawer.lineArc(0, 0, 50,
            this.spinnerTimer,
            this.spinnerTimer + sp,
            18, 30,
            0xFFFF0000, 0xFFFFFFFF);
        drawer.lineArc(0, 0, 50,
            this.spinnerTimer + Math.PI,
            this.spinnerTimer + Math.PI + sp,
            18, 30,
            0xFF0000FF, 0xFFFFFFFF);
    }

    createPolyKitMesh() {
        const points = [];
        const colors = [];
        points.push(0, 0);
        colors.push(0xFF00FFFF);
        for (let a = 0.0; a < 2; a += 0.1) {
            points.push(100 * Math.cos(a), 100 * Math.sin(a));
            colors.push(0xFF00FF00);
        }
        // points.push(0, 0, 100, 100, 100, 0);
        // colors.push(0xFF00FF00, 0xFF00FF00, 0xFF00FF00);
        this.polyKitMesh.positions = new Float32Array(points);
        this.polyKitMesh.colors = new Uint32Array(colors);
        this.polyKitMesh.indices = new Poly2Tri().region(points).triangulate();
    }

    drawPolyKit() {
        const engine = Engine.current;
        const drawer = engine.drawer;
        drawer.state.setEmptyTexture();
        drawer.drawIndexedTriangles(this.polyKitMesh.positions, this.polyKitMesh.colors, this.polyKitMesh.indices);
    }

    drawText() {
        const engine = Engine.current;
        const font = this.font.data;
        if (font) {
            const drawer = engine.drawer;
            drawer.state.saveColor().multiplyColor32(0xFFFF0000);
            font.draw("Hello World!", 48, 100 + 2, 100 + 2, 48, 0);
            drawer.state.restoreColor()
                .saveColor().multiplyColor32(0xFF00FFFF);
            font.draw("Hello World!", 48, 100, 100, 48, 0);
            drawer.state.restoreColor();
        }
    }
}


