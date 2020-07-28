import {Signal} from "../../util/Signal";
import {Color4, Vec2} from "@highduck/math";
import {ComponentTypeA} from "../..";

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

    static readonly classic = new ButtonSkin();
}

export class Button_Data {
    skin = ButtonSkin.classic;
    readonly clicked = new Signal();

    asBackButton = false;

    // TODO: movieFrames initialization
    movieFrames = false;

    initialized = false;
    timeOver = 0.0;
    timePush = 0.0;
    timePost = 0.0;

    readonly baseSkew = new Vec2(0.0, 0.0);
    readonly baseScale = new Vec2(1.0, 1.0);
    readonly baseColorMultiplier = new Color4(1.0, 1.0, 1.0, 1.0);
    readonly baseColorOffset = new Color4(0.0, 0.0, 0.0, 0.0);

    // onClick(handler: ()=>void):this {
    //     this.clicked.on(handler);
    //     return this;
    // }
}

export const Button = new ComponentTypeA(Button_Data);

const __prefetch_button_data_map = new Button_Data();
__prefetch_button_data_map.clicked.on(() => {
});
__prefetch_button_data_map.asBackButton = true;
__prefetch_button_data_map.initialized = true;
__prefetch_button_data_map.timeOver = Math.random();
__prefetch_button_data_map.timePush = Math.random();
__prefetch_button_data_map.timePost = Math.random();

__prefetch_button_data_map.baseSkew.set(Math.random(), Math.random());
__prefetch_button_data_map.baseScale.set(Math.random(), Math.random());
__prefetch_button_data_map.baseColorMultiplier.set(Math.random(), Math.random(), Math.random(), Math.random());
__prefetch_button_data_map.baseColorOffset.set(Math.random(), Math.random(), Math.random(), Math.random());