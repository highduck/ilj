import {DisplayQuad, DisplayText, Engine, Entity, Filters2D, Transform2D} from "@highduck/core";
import {FilterType} from "@highduck/anijson";

export class Entities {

    root: Entity;
    cont: Entity;
    bg: Entity;
    text: Entity;

    constructor() {
        const engine = Engine.current;
        const r = engine.root;
        this.root = r.create();
        this.root.name = "Entities Demo";
        this.root.set(Transform2D);

        this.cont = this.root.create();
        this.cont.set(Transform2D);

        this.bg = this.cont.create();
        this.bg.set(Transform2D);
        const quad = this.bg.set(DisplayQuad);
        quad.rect.set(-100, -100, 200, 200);
        quad.colors[0] = 0xFF00FF00;
        quad.colors[1] = 0xFFFF00FF;
        quad.colors[2] = 0xFF00FF00;
        quad.colors[3] = 0xFFFF00FF;

        this.text = this.cont.create();
        this.text.set(Transform2D);
        const txt = this.text.set(DisplayText);
        txt.format.alignment.set(0.5, 0.5);
        txt.format.font = "Comfortaa-Regular";
        txt.format.size = 64;
        txt.format.lineHeight = 64;
        txt.text = "Hello, ECS!";

        const f = this.text.set(Filters2D);
        f.filters.push({
            type: FilterType.DropShadow,
            quality: 1,
            color: 0x77111111,
            blur: [4, 4],
            offset: [8, 8]
        });
        f.filters.push({
            type: FilterType.Glow,
            quality: 1,
            color: 0xFF993333,
            blur: [2, 2],
            offset: [0, 0]
        });
    }

    update() {
        const engine = Engine.current;

        const transform = this.cont.get(Transform2D);
        transform.x = engine.view.reference.width / 2;
        transform.y = engine.view.reference.height / 2;

        const time = engine.time.total;
        const off = this.text.get(Filters2D).filters[0].offset;
        off[0] = 5 * Math.cos(time);
        off[1] = 5 * Math.sin(time);
    }
}