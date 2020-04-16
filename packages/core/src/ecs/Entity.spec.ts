import {World} from "./World";
import {getTypeID} from "../util/TypeID";

class Name {
    static TYPE_ID: number = getTypeID(Name);
    value = "";
}

class Pos {
    static TYPE_ID: number = getTypeID(Pos);

    x = 0;
    y = 0;

    set(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }
}

class Meta {
    static TYPE_ID: number = getTypeID(Meta);
    str?: string;
}

class NotUsed {
    static TYPE_ID: number = getTypeID(NotUsed);
    str?: string;
}

class Empty {
    static TYPE_ID: number = getTypeID(Empty);
}

const w = new World({} as any);

describe("ecs.Entity", function () {

    it("creates and disposes", (): void => {
        const e = w.create();
        e.name = "FIRST";
        expect(e.isValid).toBe(true);
        // root + created entity
        expect(w.size).toStrictEqual(1 + 1);
        expect(e.world).toStrictEqual(w);
        e.dispose();
        expect(e.isValid).toBe(false);
        // only root
        expect(w.size).toStrictEqual(1);
        expect(e.world).toBeUndefined();
    });

    it("components", () => {
        for (let i = 0; i < 20; ++i) {
            const r1 = w.create();
            const r2 = w.create();
            const r3 = w.create();
            r1.name = "warmup R1";
            r2.name = "warmup R2";
            r3.name = "warmup R3";
            r1.dispose();
            r2.dispose();
            r3.dispose();
        }
        const e1 = w.create();
        e1.name = "E1";
        e1.set(Name);
        e1.set(Pos);
        e1.get(Name).value = "good-boy";
        const p = e1.tryGet(Pos);
        if (p) {
            p.set(10, 10).set(1, 1);
        }
        e1.getOrCreate(Meta).str = "AUTO";
        console.log("our Name-Pos: ", e1.passport);

        const e2 = w.create();
        e2.name = "E2";
        e2.set(Pos);
        const e3 = w.create();
        e3.name = "E3";
        e3.set(Pos);

        const pairs = [];
        for (const e of w.query(Name, Pos)) {
            pairs.push(e);
        }
        expect(pairs.length).toStrictEqual(1);
        expect(pairs[0]).toStrictEqual(e1);

        const singles = [];
        for (const e of w.query(Pos)) {
            singles.push(e);
        }
        expect(singles.length).toStrictEqual(3);
        expect(singles[0]).toStrictEqual(e1);

        e1.dispose();
        e2.dispose();
        e3.dispose();
    });

    it("not used type query", () => {
        const notUsedCollection = [...w.query(NotUsed)];
        expect(notUsedCollection.length).toStrictEqual(0);
    });

    it("type id", () => {
        w.query(Pos, Pos, Name, Empty);
        for (const c of w.maps.keys()) {
            console.log(c);
        }
    });
});

describe("ecs.Query0", function () {
    it("lists all entities", () => {
        const q = w.query();

        const e = w.create();
        expect([...q].length).toStrictEqual(2);
        e.dispose();

        expect([...q].length).toStrictEqual(1);
    });
});
