import {Entity} from "../../ecs/Entity";
import {Transform2D} from "./Transform2D";
import {Display2D} from "./Display2D";
import {Filters2D} from "./Filters2D";
import {Matrix2D, Rect, Vec2} from "@highduck/math";
import {DrawingState} from "../../drawer/DrawingState";
import {Engine} from "../../Engine";
import {FilterType} from "@highduck/anijson";
import {drawCameraDebugGizmos} from "./SceneDebug";
import {Bounds2D} from "./Bounds2D";
import {Camera2D} from "./Camera2D";

const TMP_V2 = new Vec2();
const TEMP_RECT = new Rect();

export function invalidateTransform(engine: Engine) {
    const w = engine.world;
    const transforms = w.components(Transform2D)
    for (let i = 0; i < transforms.length; ++i) {
        transforms[i].invalidateMatrix();
    }
}

export class DisplaySystem {

    activeLayers = 0x1;
    drawer = this.engine.drawer;
    state = this.engine.drawer.state;

    // objectsAA = 0;

    private _currentCamera!: Camera2D;

    constructor(readonly engine: Engine) {
    }

    process() {
        // this.objectsAA = 0;

        const w = this.engine.world;
        const graphics = this.engine.graphics;
        const rc = graphics.currentFramebufferRect;
        const drawer = this.engine.drawer;
        const cameras = this.engine.cameraOrderSystem.cameras;

        for (let i = 0; i < cameras.length; ++i) {
            const camera = cameras[i];
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
            camera.calcMatrix(camera.debugDrawScale, camera.matrix);
            camera.worldRect.copyFrom(camera.screenRect).transform(camera.matrix);
            this._currentCamera = camera;

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

                if (process.env.NODE_ENV === 'development') {
                    drawCameraDebugGizmos(camera, root);
                }

                drawer.state.restoreMatrix();
                drawer.state.restoreScissors();
            }
        }

        // this.engine.statsGraph.add(this.objectsAA);
    }

    draw(e: Entity) {

        if (this.processFilters(e)) {
            return;
        }

        if (!e.visible || (e.layerMask & this.activeLayers) == 0) {
            return;
        }
        const transform = e.tryGet(Transform2D);
        if (transform !== undefined) {
            if (transform.alpha <= 0) {
                return;
            }

            DisplaySystem.beginTransform(this.state, transform);
        }

        let visibleCheck = true;
        const bounds = e.tryGet(Bounds2D);
        if (bounds !== undefined && this._currentCamera.occlusionEnabled) {
            const worldRect = TEMP_RECT.copyFrom(bounds.rc);
            const drawer = Engine.current.drawer;
            worldRect.transform(drawer.state.matrix);
            const screen = this._currentCamera.screenRect;
            visibleCheck = worldRect.right > screen.x &&
                worldRect.x < screen.right &&
                worldRect.bottom > screen.y &&
                worldRect.y < screen.bottom;
        }
        if (visibleCheck) {
            const display = e.tryGet(Display2D);
            if (display !== undefined) {
                display.draw(this.drawer);
                // ++this.objectsAA;
            }

            let child = e.childFirst;
            while (child !== undefined) {
                this.draw(child);
                child = child.siblingNext;
            }
        }

        if (transform !== undefined) {
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

    // enterNode(e: Entity): boolean {
    //     if (this.processFilters(e)) {
    //         return false;
    //     }
    //
    //     if (!e.visible || (e.layerMask & this.activeLayers) == 0) {
    //         return false;
    //     }
    //
    //     const transform = e.tryGet(Transform2D);
    //     if (transform !== undefined) {
    //         if (transform.alpha <= 0) {
    //             return false;
    //         }
    //
    //         DisplaySystem.beginTransform(this.state, transform);
    //     }
    //
    //     return true;
    // }
    //
    // drawNode(e: Entity) {
    //     const display = e.tryGet(Display2D);
    //     if (display !== undefined) {
    //         display.draw(this.drawer);
    //         ++this.objectsAA;
    //     }
    // }
    //
    // exitNode(e: Entity) {
    //     const transform = e.tryGet(Transform2D);
    //     if (transform !== undefined) {
    //         DisplaySystem.endTransform(this.state, transform);
    //     }
    // }
    //
    // draw2(e: Entity) {
    //     let current = e.childFirst;
    //     let prev = e;
    //     let depth = 1;
    //     while (current !== undefined) {
    //         this.drawNode(current);
    //         // if (depth === max_depth) {
    //         //     //yield current and his siblings;
    //         //     prev = current;
    //         //     current = current.parent;
    //         //     --depth;
    //         // } else
    //         if (current.childFirst !== undefined && (prev === current.parent || prev === current.siblingPrev)) {
    //             prev = current;
    //             current = current.childFirst;
    //             ++depth;
    //             this.enterNode(current);
    //             // at this point, we know prev is a child of current
    //         } else if (current.siblingNext !== undefined) {
    //             this.exitNode(current);
    //             prev = current;
    //             current = current.siblingNext;
    //             this.enterNode(current);
    //             // exhausted the parent's children
    //         } else {
    //             this.exitNode(current);
    //             prev = current;
    //             current = current.parent;
    //             --depth;
    //         }
    //     }
    // }

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
                for (let i = 0; i < filters.filters.length; ++i) {
                    const data = filters.filters[i];
                    if (data.type === FilterType.DropShadow) {
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
                    } else if (data.type === FilterType.Glow) {
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

}