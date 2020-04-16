import {Button, ButtonSkin} from "./Button";
import {Transform2D} from "../display/Transform2D";
import {Entity} from "../../ecs/Entity";
import {Interactive} from "./Interactive";
import {MovieClip2D} from "../display/MovieClip2D";
import {Cursor} from "../../app/GameView";
import {reach, reachDelta, Color4} from "@highduck/math";
import {Engine} from "../../Engine";
import {EventReceiver} from "../EventReceiver";
import {InteractiveManagerEvent} from "./InteractiveManager";

function startPostTween(btn: Button) {
    btn.timePost = Math.max(1 - 0.3 * Math.random(), btn.timePost);
}

function handleBackButton(btn: Button) {
    btn.clicked.emit(undefined);
    startPostTween(btn);
}

function initBaseTransform(btn: Button, transform: Transform2D) {
    btn.baseColorMultiplier.copyFrom(transform.colorMultiplier);
    btn.baseColorOffset.copyFrom(transform.colorOffset);
    btn.baseScale.copyFrom(transform.scale);
    btn.baseSkew.copyFrom(transform.skew);
}

function initEvents(e: Entity) {
    const interactive = e.getOrCreate(Interactive);
    interactive.onOver.on(e => {
        const btn = e.tryGet(Button);
        if (btn) {
            e.engine.audio.playSound(btn.skin.sfxOver);
        }
    });
    interactive.onOut.on(e => {
        const btn = e.tryGet(Button);
        const interactive = e.tryGet(Interactive);
        if (btn) {
            if (interactive && interactive.pushed) {
                startPostTween(btn);
            }
            e.engine.audio.playSound(btn.skin.sfxOut);
        }
    });
    interactive.onDown.on(e => {
        const btn = e.tryGet(Button);
        if (btn) {
            e.engine.audio.playSound(btn.skin.sfxDown);
        }
    });
    interactive.onClicked.on((e: Entity) => {
        const btn = e.tryGet(Button);
        if (btn) {
            e.engine.audio.playSound(btn.skin.sfxClick);
            startPostTween(btn);
            btn.clicked.emit(e);
            if (e.name) {
                // TODO:
                // analytics_event("click", e.name);
            }
        }
    });
    e.getOrCreate(EventReceiver).hub.on(InteractiveManagerEvent.BackButton, (ev) => {
        const btn = e.tryGet(Button);
        if (btn !== undefined && btn.asBackButton) {
            handleBackButton(btn);
            ev.processed = true;
        }
    });
}

const PUSH_COLOR_0 = new Color4(1, 1, 1, 1);
const PUSH_COLOR_1 = new Color4(0.55, 0.55, 0.55, 1);
const OVER_COLOR_0 = new Color4(0, 0, 0, 0);
const OVER_COLOR_1 = new Color4(0.1, 0.1, 0.1, 0);

function applySkin(skin: ButtonSkin, btn: Button, transform: Transform2D) {
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

function updateMovieFrame(mc: MovieClip2D, interactive: Interactive) {
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
        for (const e of this.engine.world.query(Button, Interactive).entities()) {
            const dt = e.dt;
            const btn = e.get(Button);
            const interactive = e.get(Interactive);
            const transform = e.tryGet(Transform2D);
            if (!btn.initialized) {
                btn.initialized = true;
                interactive.cursor = Cursor.Button;
                if (transform) {
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

            if (transform) {
                applySkin(skin, btn, transform);
            }

            if (btn.movieFrames) {
                const mc = e.tryGet(MovieClip2D);
                if (mc) {
                    updateMovieFrame(mc, interactive);
                }
            }
        }
    }
}