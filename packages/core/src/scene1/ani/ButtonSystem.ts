import {Button, Button_Data, ButtonSkin} from "./Button";
import {Transform2D, Transform2D_Data} from "../display/Transform2D";
import {Entity} from "../../ecs/Entity";
import {Interactive} from "./Interactive";
import {MovieClip2D, MovieClip2D_Data} from "../display/MovieClip2D";
import {Cursor} from "../../app/GameView";
import {Color4, reach, reachDelta} from "@highduck/math";
import {Engine} from "../../Engine";
import {EventData, EventReceiver} from "../EventReceiver";
import {InteractiveManagerEvent} from "./InteractiveManager";
import {Time} from "../../app/Time";
import {getComponents} from "../../ecs/World";

function initBaseTransform(btn: Button_Data, transform: Transform2D_Data) {
    btn.baseColorMultiplier.copyFrom(transform.colorMultiplier);
    btn.baseColorOffset.copyFrom(transform.colorOffset);
    btn.baseScale.copyFrom(transform.scale);
    btn.baseSkew.copyFrom(transform.skew);
}

function startPostTween(btn: Button_Data) {
    btn.timePost = Math.max(1 - 0.3 * Math.random(), btn.timePost);
}

function handleBackButton(btn: Button_Data) {
    btn.clicked.emit(undefined);
    startPostTween(btn);
}

function onOver(e: Entity) {
    const btn = e.tryGet(Button);
    if (btn !== undefined) {
        Engine.current.audio.playSound(btn.skin.sfxOver);
    }
}

function onOut(e: Entity) {
    const btn = e.tryGet(Button);
    const interactive = e.tryGet(Interactive);
    if (btn !== undefined) {
        if (interactive !== undefined && interactive.pushed) {
            startPostTween(btn);
        }
        Engine.current.audio.playSound(btn.skin.sfxOut);
    }
}

function onDown(e: Entity) {
    const btn = e.tryGet(Button);
    if (btn !== undefined) {
        Engine.current.audio.playSound(btn.skin.sfxDown);
    }
}

function onClicked(e: Entity) {
    const btn = e.tryGet(Button);
    if (btn !== undefined) {
        Engine.current.audio.playSound(btn.skin.sfxClick);
        startPostTween(btn);
        btn.clicked.emit(e);

        // TODO:
        // if (e.name) {
        //     analytics_event("click", e.name);
        // }
    }
}

function onBackButton(data: EventData<unknown>): void {
    const e = data.currentTarget;
    const btn = e.tryGet(Button);
    if (btn !== undefined && btn.asBackButton) {
        handleBackButton(btn);
        data.processed = true;
    }
}

function initEvents(e: Entity) {
    const interactive = e.getOrCreate(Interactive);
    interactive.onOver.on(onOver);
    interactive.onOut.on(onOut);
    interactive.onDown.on(onDown);
    interactive.onClicked.on(onClicked);
    e.getOrCreate(EventReceiver).hub.on(InteractiveManagerEvent.BackButton, onBackButton);
}

const PUSH_COLOR_0 = new Color4(1, 1, 1, 1);
const PUSH_COLOR_1 = new Color4(0.55, 0.55, 0.55, 1);
const OVER_COLOR_0 = new Color4(0, 0, 0, 0);
const OVER_COLOR_1 = new Color4(0.1, 0.1, 0.1, 0);

function applySkin(skin: ButtonSkin, btn: Button_Data, transform: Transform2D_Data) {
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

function updateMovieFrame(mc: MovieClip2D_Data, interactive: Interactive) {
    let frame = 0;
    if (interactive.over || interactive.pushed) {
        frame = 1;
        if (interactive.pushed && interactive.over) {
            frame = 2;
        }
    }
    mc.gotoAndStop(frame);
}

export class ButtonSystem {
    constructor(readonly engine: Engine) {
    }

    process() {
        const dt = Time.UI.dt;
        const components = getComponents(Interactive);
        for (let i = 0; i < components.length; ++i) {
            const interactive = components[i];
            const e = interactive.entity;
            const btn = e.tryGet(Button);
            if (btn === undefined) {
                continue;
            }
            const transform = e.tryGet(Transform2D);
            if (!btn.initialized) {
                btn.initialized = true;
                interactive.cursor = Cursor.Button;
                if (transform !== undefined) {
                    initBaseTransform(btn, transform);
                }
                initEvents(e);
            }
            const skin = btn.skin;

            btn.timeOver = reachDelta(btn.timeOver,
                interactive.over ? 1.0 : 0.0,
                dt * skin.overSpeedForward,
                -dt * skin.overSpeedBackward);

            btn.timePush = reachDelta(btn.timePush,
                interactive.pushed ? 1.0 : 0.0,
                dt * skin.pushSpeedForward,
                -dt * skin.pushSpeedBackward);

            btn.timePost = reach(btn.timePost, 0.0, 2.0 * dt);

            if (transform !== undefined) {
                applySkin(skin, btn, transform);
            }

            if (btn.movieFrames) {
                const mc = e.tryGet(MovieClip2D);
                if (mc !== undefined) {
                    updateMovieFrame(mc, interactive);
                }
            }
        }
    }
}