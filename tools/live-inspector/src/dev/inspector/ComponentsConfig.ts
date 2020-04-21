import {MovieClipInspector} from "./MovieClipInspector";
import {ComponentType} from "preact";
import {Transform2DEditor} from "./Transform2DEditor";
import {
    Transform2D,
    ConstructorWithID,
    DisplaySprite,
    DisplayText,
    DisplayQuad,
    DisplayArc,
    DisplayParticles,
    MovieClip2D,
    MovieClipTarget,
    Filters2D,
    Camera2D,
    TrailRenderer,
    Trail,
    ParticleLayer,
    Button,
    Interactive,
    ParticleEmitter
} from "@highduck/core";

export interface ComponentViewProps<T = object> {
    data: T;
    config?: ComponentViewConfig;
}

export interface ComponentViewConfig {
    name: string;
    kind?: string;
    view?: ComponentType<ComponentViewProps>;
    icon?: string;
}

export const COMPONENTS_CONFIG = new Map<ConstructorWithID, ComponentViewConfig>();

export function getComponentIcon(type: ConstructorWithID): string {
    const config = COMPONENTS_CONFIG.get(type);
    if (config && config.icon) {
        return config.icon;
    }
    return "🕵";
}

COMPONENTS_CONFIG.set(Transform2D, {
    name: "Transform2D",
    icon: "🌐",
    view: Transform2DEditor,
});

COMPONENTS_CONFIG.set(Camera2D, {
    name: "Camera2D",
    icon: "🎦"
});

COMPONENTS_CONFIG.set(DisplaySprite, {
    name: "Sprite",
    kind: "Display2D",
    icon: "🧚"
});

COMPONENTS_CONFIG.set(DisplayText, {
    name: "Text",
    kind: "Display2D",
    icon: "🔤"
});

COMPONENTS_CONFIG.set(DisplayQuad, {
    name: "Quad",
    kind: "Display2D",
    icon: "🔲"
});

COMPONENTS_CONFIG.set(DisplayArc, {
    name: "Arc",
    kind: "Display2D",
    icon: "⭕"
});

COMPONENTS_CONFIG.set(ParticleLayer, {
    name: "Particle Layer",
    icon: "✨",
});

COMPONENTS_CONFIG.set(DisplayParticles, {
    name: "Particles Renderer",
    kind: "Display2D",
    icon: "🎇",
});

COMPONENTS_CONFIG.set(Trail, {
    name: "Trail",
    kind: "Display2D",
    icon: "💫",
});

COMPONENTS_CONFIG.set(TrailRenderer, {
    name: "Trail Renderer",
    kind: "Display2D",
    icon: "☄️",
});

COMPONENTS_CONFIG.set(MovieClip2D, {
    name: "MovieClip2D",
    view: MovieClipInspector,
    icon: "🎬",
});

COMPONENTS_CONFIG.set(MovieClipTarget, {
    name: "MovieClip Target",
    icon: "🎭",
});

COMPONENTS_CONFIG.set(Filters2D, {
    name: "Filters",
    icon: "💄",
});

COMPONENTS_CONFIG.set(ParticleEmitter, {
    name: "Particle Emitter",
    icon: "🕳️",
});

COMPONENTS_CONFIG.set(Interactive, {
    name: "Interactive",
    icon: "🖕",
});

COMPONENTS_CONFIG.set(Button, {
    name: "Button",
    icon: "🕹️",
});