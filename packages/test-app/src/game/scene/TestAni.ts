import {Ani, AssetRef, Engine, Resources} from "@highduck/core";

export class TestAni {

    ani: AssetRef<Ani> = Resources.get(Ani, "tests");

    constructor() {
        const engine = Engine.current;
        const test = engine.aniFactory.createFromLibrary("tests", "test");
        if (test) {
            test.name = "Flash Scene Test";
            engine.root.append(test);
        }
    }
}