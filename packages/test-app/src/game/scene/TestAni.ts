import {Ani, AssetRef, Engine, Resources, Entity} from "@highduck/core";

export class TestAni {

    ani: AssetRef<Ani> = Resources.get(Ani, "tests");

    constructor() {
        const engine = Engine.current;
        const test = engine.aniFactory.createFromLibrary("tests", "test");
        if (test) {
            test.name = "Flash Scene Test";
            Entity.root.append(test);
        }
    }
}