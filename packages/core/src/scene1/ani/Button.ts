import {Signal} from "../../util/Signal";
import {Color4, Vec2} from "@highduck/math";
import {declTypeID} from "../../util/TypeID";

export class ButtonSkin {
    sfxOver = "sfx/btn_over";
    sfxOut = "sfx/btn_out";
    sfxDown = "sfx/btn_down";
    sfxClick = "sfx/btn_click";

    overSpeedForward = 8.0;
    overSpeedBackward = 8.0;
    pushSpeedForward = 8.0;
    pushSpeedBackward = 8.0;

    //const basic_ease_t& over_ease{easing::P3_OUT};
    //const basic_ease_t& push_ease{easing::P3_OUT};

    static classic = new ButtonSkin();
}

export class Button {
    static TYPE_ID = declTypeID();

    skin: ButtonSkin = ButtonSkin.classic;
    readonly clicked = new Signal();

    asBackButton = false;

    movieFrames = true;
    initialized = false;
    timeOver = 0.0;
    timePush = 0.0;
    timePost = 0.0;

    readonly baseSkew = new Vec2(0, 0);
    readonly baseScale = new Vec2(1, 1);
    readonly baseColorMultiplier = new Color4(1, 1, 1, 1);
    readonly baseColorOffset = new Color4(0, 0, 0, 0);

    // onClick(handler: ()=>void):this {
    //     this.clicked.on(handler);
    //     return this;
    // }
}