import {Button, Button_Data} from "./Button";
import {Transform2D, Transform2D_Data} from "../display/Transform2D";
import {Interactive} from "./Interactive";
import {reach, reachDelta} from "@highduck/math";
import {Engine} from "../../Engine";
import {EventData, EventReceiver} from "../EventReceiver";
import {InteractiveManagerEvent} from "./InteractiveManager";
import {Time} from "../../app/Time";
import {Entity, EntityMap} from "../../ecs";
import {Cursor} from "../../app/MouseCursor";

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
        Engine.current.audio.playSound(btn.style.sfxOver);
    }
}

function onOut(e: Entity) {
    const btn = e.tryGet(Button);
    if (btn !== undefined) {
        const interactive = e.tryGet(Interactive);
        if (interactive !== undefined && interactive.pushed) {
            startPostTween(btn);
        }
        btn.style.onOut();
    }
}

function onDown(e: Entity) {
    const btn = e.tryGet(Button);
    if (btn !== undefined) {
        btn.style.onDown();
    }
}

function onClicked(e: Entity) {
    const btn = e.tryGet(Button);
    if (btn !== undefined) {
        btn.style.onClick();
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
    interactive.cursor = Cursor.Button;
    e.getOrCreate(EventReceiver).hub.on(InteractiveManagerEvent.BackButton, onBackButton);
}

export function updateButtons() {
    const dt = Time.UI.dt;
    const entities = Button.map.keys;
    const buttons = Button.map.values;
    const interactives = Interactive.map;
    const transforms = Transform2D.map;
    for (let i = 0; i < buttons.length; ++i) {
        const ei = entities[i];
        const btn = buttons[i];
        const transform = transforms.get(ei);
        if (!btn.initialized) {
            btn.initialized = true;
            if (transform !== undefined) {
                initBaseTransform(btn, transform);
            }
            initEvents(EntityMap.get(ei)!);
        }
        const interactive = interactives.get(ei)!;
        const skin = btn.style;
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
            btn.style.applySkin(ei, btn, transform);
        }
    }
}