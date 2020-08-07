import {Engine} from "../../Engine";
import {Button_Data} from "./Button";
import {InteractiveComponent, MovieClip2D_Data, Transform2D_Data} from "../..";
import {Color4} from "@highduck/math";

export class ButtonStyle {
    sfxOver = "sfx/btn_over";
    sfxOut = "sfx/btn_out";
    sfxDown = "sfx/btn_down";
    sfxClick = "sfx/btn_click";

    onOut() {
        Engine.current.audio.playSound(this.sfxOut);
    }

    onDown() {
        Engine.current.audio.playSound(this.sfxDown);
    }

    onClick() {
        Engine.current.audio.playSound(this.sfxClick);
    }

    applySkin(ei: number, btn: Button_Data, transform: Transform2D_Data) {

    }
}


function updateMovieFrame(mc: MovieClip2D_Data, interactive: InteractiveComponent) {
    let frame = 0;
    if (interactive.over || interactive.pushed) {
        frame = 1;
        if (interactive.pushed && interactive.over) {
            frame = 2;
        }
    }
    mc.gotoAndStop(frame);
}

const PUSH_COLOR_0 = new Color4(1, 1, 1, 1);
const PUSH_COLOR_1 = new Color4(0.55, 0.55, 0.55, 1);
const OVER_COLOR_0 = new Color4(0, 0, 0, 0);
const OVER_COLOR_1 = new Color4(0.1, 0.1, 0.1, 0);

export class ButtonClassicAnimator extends ButtonStyle {
    overSpeedForward = 8.0;
    overSpeedBackward = 8.0;
    pushSpeedForward = 8.0;
    pushSpeedBackward = 8.0;

    static readonly instance = new ButtonClassicAnimator();

    applySkin(ei: number, btn: Button_Data, transform: Transform2D_Data) {
        const over = btn.timeOver;
        const push = btn.timePush;
        const post = btn.timePost;
        const pi = Math.PI;

        const sx = 1.0 + 0.5 * Math.sin((1.0 - post) * pi * 5.0) * post;
        const sy = 1.0 + 0.5 * Math.sin((1.0 - post) * pi) * Math.cos((1.0 - post) * pi * 5.0) * post;

        transform.colorMultiplier.copyFrom(PUSH_COLOR_0).lerp(PUSH_COLOR_1, push).multiply(btn.baseColorMultiplier);
        transform.colorOffset.copyFrom(OVER_COLOR_0).lerp(OVER_COLOR_1, over).add(btn.baseColorOffset);

        transform.scale.x = btn.baseScale.x * sx;
        transform.scale.y = btn.baseScale.y * sy;
    }
}

