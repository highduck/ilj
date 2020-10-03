import {Signal} from "../../util/Signal";
import {Color4, Vec2} from "@highduck/math";
import {ComponentTypeA} from "../..";
import {ButtonClassicAnimator} from "./ButtonStyle";

export class Button_Data {
    style = ButtonClassicAnimator.instance;

    readonly clicked = new Signal();

    asBackButton = false;

    initialized = false;
    timeOver = NaN;
    timePush = NaN;
    timePost = NaN;

    readonly baseSkew = new Vec2(0.0, 0.0);
    readonly baseScale = new Vec2(1.0, 1.0);
    readonly baseColorMultiplier = new Color4(1.0, 1.0, 1.0, 1.0);
    readonly baseColorOffset = new Color4(0.0, 0.0, 0.0, 0.0);

    constructor() {
        this.timeOver = 0.0;
        this.timePush = 0.0;
        this.timePost = 0.0;
    }
}

export const Button = new ComponentTypeA(Button_Data);