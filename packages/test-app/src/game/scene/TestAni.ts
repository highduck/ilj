import {Ani, AniResource, AssetRef, Engine, Entity} from "@highduck/core";

export class TestAni {

    ani: AssetRef<Ani> = AniResource.get("tests");

    constructor() {
        const engine = Engine.current;
        const test = engine.aniFactory.createFromLibrary("tests", "test");
        if (test) {
            test.name = "Flash Scene Test";
            Entity.root.append(test);
        }
    }
}