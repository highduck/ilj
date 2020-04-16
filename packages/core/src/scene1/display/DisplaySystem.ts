import {Entity} from "../../ecs/Entity";
import {Transform2D} from "./Transform2D";
import {Display2D} from "./Display2D";
import {Filters2D} from "./Filters2D";
import {FilterType} from "../ani/AniJson";
import {Vec2, Rect, Matrix2D} from "@highduck/math";
import {DrawingState} from "../../drawer/DrawingState";
import {Engine} from "../../Engine";
import {debugCameraGizmo, debugDrawFill, debugDrawHitTarget, debugDrawPointer} from "./SceneDebug";

const TMP_V2 = new Vec2();
const TEMP_RECT = new Rect();

export function invalidateTransform(engine: Engine) {
    const w = engine.world;
    for (const transform of w.query(Transform2D)) {
        transform.invalidateMatrix();
    }
}

export class DisplaySystem {

    activeLayers = 0x1;
    drawer = this.engine.drawer;
    state = this.engine.drawer.state;

    constructor(readonly engine: Engine) {
    }

    process() {
        const w = this.engine.world;
        const graphics = this.engine.graphics;
        const rc = graphics.currentFramebufferRect;
        const drawer = this.engine.drawer;
        const cameras = this.engine.cameraOrderSystem.cameras;

        for (const camera of cameras) {
            // TODO: delegate camera props update to camera-system (on addition to ordering)
            // 1. update camera props
            if (camera.syncContentScale) {
                camera.contentScale = this.engine.view.contentScale;
            }
            camera.screenRect.set(
                rc.x + rc.width * camera.viewport.x,
                rc.y + rc.height * camera.viewport.y,
                rc.width * camera.viewport.width,
                rc.height * camera.viewport.height,
            );
            const screen = camera.screenRect;
            Transform2D.getWorldMatrix(camera.entity, camera.matrix);
            camera.matrix.scale(1 / camera.contentScale, 1 / camera.contentScale);
            camera.matrix.translate(
                -screen.x - camera.relativeOrigin.x * screen.width,
                -screen.y - camera.relativeOrigin.y * screen.height
            );

            camera.worldRect.copyFrom(screen).transform(camera.matrix);

            camera.inverseMatrix.copyFrom(camera.matrix);
            camera.inverseMatrix.inverse();

            if (camera.enabled) {
                // 2. draw camera view
                drawer.state.pushScissors(camera.screenRect);
                if (camera.clearColorEnabled) {
                    drawer.invalidateForce();
                    graphics.clear(camera.clearColor);
                }
                drawer.state.saveMatrix().concatMatrix(camera.inverseMatrix);
                const root = camera.root ?? w.root;
                this.draw(root);
                if (camera.debugGizmoFills) {
                    debugDrawFill(root, drawer);
                }
                if (camera.debugGizmoHitTarget) {
                    const hitTarget = this.engine.interactiveManager.hitTarget;
                    if (hitTarget !== undefined) {
                        debugDrawHitTarget(hitTarget, root, drawer);
                    }
                }
                if (camera.debugGizmoPointer) {
                    debugDrawPointer(this.engine, camera);
                }
                if (camera.debugGizmoSelf) {
                    debugCameraGizmo(camera, drawer);
                }
                drawer.state.restoreMatrix();
                drawer.state.restoreScissors();
            }
        }
    }

    static beginTransform(state: DrawingState, transform: Transform2D) {
        state.saveTransform();
        state.concatMatrix(transform.matrix);
        state.combineColor(transform.colorMultiplier, transform.colorOffset);

        if (transform.scissors !== undefined) {
            transform.getWorldScissors(state.matrix, TEMP_RECT);
            state.pushScissors(TEMP_RECT);
        }
    }

    static endTransform(state: DrawingState, transform: Transform2D) {
        if (transform.scissors !== undefined) {
            state.restoreScissors();
        }
        state.restoreTransform();
    }

    processFilters(e: Entity): boolean {
        const state = this.state;
        const filters = e.tryGet(Filters2D);
        if (filters) {
            if (filters.enabled && !filters.processing) {
                const colorMultiplier = state.colorMultiplier;
                const colorOffset = state.colorOffset;
                for (const data of filters.filters) {
                    if (data.type == FilterType.DropShadow) {
                        filters.processing = true;
                        state.saveTransform()
                            .translate(data.offset[0], data.offset[1]);

                        colorMultiplier.r = 0; // keep alpha
                        colorMultiplier.g = 0; // keep alpha
                        colorMultiplier.b = 0; // keep alpha
                        // colorOffset.argb32 = data.color;
                        //colorOffset.a = 0; // keep color
                        state.offsetColor(data.color);

                        this.draw(e);

                        state.restoreTransform();

                        filters.processing = false;
                    } else if (data.type == FilterType.Glow) {
                        filters.processing = true;

                        state.saveColor();
                        colorMultiplier.r = 0; // keep alpha
                        colorMultiplier.g = 0; // keep alpha
                        colorMultiplier.b = 0; // keep alpha
                        colorOffset.argb32 = data.color;
                        colorOffset.a = 0; // keep color
                        //state.offsetColor(data.color);

                        const segments = Math.min(
                            12,
                            8 * Math.max(Math.trunc(Math.ceil(data.blur[0] + data.blur[1]) / 2), 1)
                        );
                        const da = Math.PI * 2 / segments;
                        let a = 0.0;

                        for (let i = 0; i < segments; ++i) {
                            state.saveMatrix().translate(data.blur[0] * Math.cos(a), data.blur[1] * Math.sin(a));
                            this.draw(e);
                            state.restoreMatrix();
                            a += da;
                        }
                        state.restoreColor();

                        filters.processing = false;
                    }
                }
            }
        }
        return false;
    }

    draw(e: Entity) {
        if (this.processFilters(e)) {
            return;
        }

        if (!e.visible || (e.layerMask & this.activeLayers) == 0) {
            return;
        }
        const transform = e.tryGet(Transform2D);
        if (transform) {
            if (transform.alpha <= 0) {
                return;
            }

            DisplaySystem.beginTransform(this.state, transform);
        }
//
//    events.emit({PreDraw, this, nullptr});

        const display = e.tryGet(Display2D);
        if (display) {
            display.draw(this.drawer);
        }
        //
        // if (ecs::has<script_holder>(e)) {
        //     auto& holder = ecs::get<script_holder>(e);
        //     for (auto& script : holder.list) {
        //         if (script) {
        //             script->draw();
        //         }
        //     }
        // }

//    events.emit({OnDraw, this, nullptr});

        let child = e.childFirst;
        while (child !== undefined) {
            this.draw(child);
            child = child.siblingNext;
        }

        // if (ecs::has<script_holder>(e)) {
        //     auto& scripts = ecs::get<script_holder>(e).list;
        //     for (auto& script : scripts) {
        //         script->gui_gizmo();
        //     }
        // }

        if (transform) {
            DisplaySystem.endTransform(this.state, transform);
        }
    }

    static hitTest(e: Entity, x: number, y: number): Entity | undefined {
        if (!e.visible || !e.touchable) {
            return undefined;
        }

        const transform = e.components.get(Transform2D.TYPE_ID) as Transform2D | undefined;
        if (transform !== undefined) {
            if (transform.scissors !== undefined && !transform.scissors.contains(x, y)) {
                return undefined;
            }

            if (transform.hitArea !== undefined) {
                return transform.hitArea.contains(x, y) ? e : undefined;
            }
        }

        let it = e.childLast;
        while (it !== undefined) {
            const childTransform = it.components.get(Transform2D.TYPE_ID) as Transform2D | undefined;
            const matrix = childTransform?.matrix ?? Matrix2D.IDENTITY;
            if (matrix.transformInverse(x, y, TMP_V2)) {
                const hit = DisplaySystem.hitTest(it, TMP_V2.x, TMP_V2.y);
                if (hit) {
                    return hit;
                }
            }
            it = it.siblingPrev;
        }

        const display = e.components.get(Display2D.TYPE_ID) as Display2D | undefined;
        if (display && display.hitTest(x, y)) {
            return e;
        }

        return undefined;
    }
}