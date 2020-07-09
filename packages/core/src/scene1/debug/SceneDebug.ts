import {Entity} from "../../ecs/Entity";
import {Drawer} from "../../drawer/Drawer";
import {Engine} from "../../Engine";
import {Transform2D} from "../display/Transform2D";
import {Display2D} from "../display/Display2D";
import {DisplaySystem} from "../display/DisplaySystem";
import {Color32_ARGB, Color4, Matrix2D, Rect, transformRectMatrix2D, Vec2} from "@highduck/math";
import {Camera2D} from "../display/Camera2D";
import {Bounds2D} from "../display/Bounds2D";
import {ConstructorWithID} from "../../util/TypeID";

const RECT_TMP = new Rect();
const VEC2_TMPS = [new Vec2(), new Vec2(), new Vec2(), new Vec2()];

export function drawCameraDebugGizmos(camera: Camera2D) {
    const root = camera.root ?? Entity.root;
    const drawer = Engine.current.drawer;
    drawer.state.matrix.copyFrom(Matrix2D.IDENTITY);
    drawer.state.colorMultiplier.copyFrom(Color4.ONE);
    drawer.state.colorOffset.copyFrom(Color4.ZERO);
    if (camera.debugGizmoFills) {
        drawFills(root);
    }
    if (camera.debugOcclusion) {
        drawOcclusion(root);
    }
    if (camera.debugGizmoHitTarget) {
        debugDrawHitTarget(root, drawer);
    }
    if (camera.debugGizmoPointer) {
        debugDrawPointer(camera);
    }
    if (camera.debugGizmoSelf) {
        debugCameraGizmo(camera, drawer);
    }
}

function debugDrawPointer(camera: Camera2D) {
    const engine = Engine.current;
    const v = VEC2_TMPS[0];
    const ptr = engine.interactiveManager.pointerScreenSpace;
    camera.matrix.transform(ptr.x, ptr.y, v);

    const drawer = engine.drawer;
    const t = engine.time.total;
    drawer.state.setEmptyTexture();
    drawer.fillCircle(v.x, v.y, 20 + 5 * Math.sin(t), 0x0, 0xFFFFFFFF, 10);
    if (engine.interactiveManager.pointerDown) {
        drawer.fillCircle(v.x, v.y, 40 + 10 * Math.sin(t * 8), 0xFFFFFF00, 0xFFFF0000, 10);
    }
}

function drawBox(rc: Rect, m: Matrix2D, color1: Color32_ARGB, color2: Color32_ARGB, cross: boolean = true) {
    const drawer = Engine.current.drawer;
    drawer.state.setEmptyTexture();
    VEC2_TMPS[0].set(rc.x, rc.y);
    VEC2_TMPS[1].set(rc.right, rc.y);
    VEC2_TMPS[2].set(rc.right, rc.bottom);
    VEC2_TMPS[3].set(rc.x, rc.bottom);
    m.transformWith(VEC2_TMPS[0]);
    m.transformWith(VEC2_TMPS[1]);
    m.transformWith(VEC2_TMPS[2]);
    m.transformWith(VEC2_TMPS[3]);
    drawer.line(VEC2_TMPS[0].x, VEC2_TMPS[0].y, VEC2_TMPS[1].x, VEC2_TMPS[1].y, color1, color2, 3, 1);
    drawer.line(VEC2_TMPS[1].x, VEC2_TMPS[1].y, VEC2_TMPS[2].x, VEC2_TMPS[2].y, color1, color2, 1, 3);
    drawer.line(VEC2_TMPS[2].x, VEC2_TMPS[2].y, VEC2_TMPS[3].x, VEC2_TMPS[3].y, color1, color2, 3, 1);
    drawer.line(VEC2_TMPS[3].x, VEC2_TMPS[3].y, VEC2_TMPS[0].x, VEC2_TMPS[0].y, color1, color2, 1, 3);
    if (cross) {
        drawer.line(VEC2_TMPS[0].x, VEC2_TMPS[0].y, VEC2_TMPS[2].x, VEC2_TMPS[2].y, color1, color2, 3, 3);
        drawer.line(VEC2_TMPS[3].x, VEC2_TMPS[3].y, VEC2_TMPS[1].x, VEC2_TMPS[1].y, color1, color2, 1, 1);
    }
}

function debugDrawHitTarget(cameraRoot: Entity, drawer: Drawer) {
    const target = Engine.current.interactiveManager.hitTarget;
    if (target === undefined) {
        return;
    }
    let color = 0xFFFFFFFF;
    const transform = target.tryGet(Transform2D);
    if (transform !== undefined && transform.hitArea !== undefined) {
        RECT_TMP.copyFrom(transform.hitArea);
        color = 0xFF99FF00;
    } else {
        const display = target.tryGet(Display2D);
        if (display !== undefined) {
            display.getBounds(RECT_TMP);
        } else {
            return;
        }
    }
    const matrix = target.searchRootComponent(Transform2D)?.worldMatrix ?? Matrix2D.IDENTITY;
    drawBox(RECT_TMP, matrix, 0xFF000000, color);
}

function traverseSceneGraph<T extends object>(e: Entity, ctor: ConstructorWithID<T>, parentTransform: Transform2D, callback: (component: T, transform: Transform2D) => void) {
    if (!e.visible) {
        return;
    }

    const transform = e.tryGet(Transform2D);
    if (transform !== undefined) {
        if (transform.colorMultiplier.a <= 0.0) {
            return;
        }
        parentTransform = transform;
    }

    const component = e.tryGet(ctor);
    if (component !== undefined) {
        callback(component, parentTransform);
    }

    let child = e.childFirst;
    while (child !== undefined) {
        traverseSceneGraph(child, ctor, parentTransform, callback);
        child = child.siblingNext;
    }
}

function drawFills(e: Entity) {
    const drawer = Engine.current.drawer;
    drawer.state.setEmptyTexture();
    drawer.state.saveTransform();
    drawer.state.colorMultiplier.set(1, 1, 1, 0.25);
    drawer.state.colorOffset.set(0, 0, 0, 0);
    traverseSceneGraph(e, Display2D, Transform2D.IDENTITY, (display, transform) => {
        const bounds = display.getBounds(RECT_TMP);
        if (!bounds.empty) {
            drawer.state.matrix.copyFrom(transform.worldMatrix);
            drawer.quadFast(bounds.x, bounds.y, bounds.width, bounds.height, true);
        }
    });
    drawer.state.restoreTransform();
}

function drawOcclusion(e: Entity) {
    const drawer = Engine.current.drawer;
    const cameraRect = DisplaySystem._currentCamera.worldRect;
    drawer.state.setEmptyTexture();
    drawer.state.saveTransform();
    drawer.state.colorOffset.set(0, 0, 0, 0);
    traverseSceneGraph(e, Bounds2D, Transform2D.IDENTITY, (bounds, transform) => {
        const worldRect = RECT_TMP;
        transformRectMatrix2D(bounds.rc, transform.worldMatrix, worldRect);

        const occluded = worldRect.right <= cameraRect.x || worldRect.x >= cameraRect.right ||
            worldRect.bottom <= cameraRect.y || worldRect.y >= cameraRect.bottom;

        const worldColor = occluded ? 0x77FF0000 : 0x7700FF00;
        drawBox(worldRect, Matrix2D.IDENTITY, worldColor, worldColor, false);
        const boundsColor = occluded ? 0x77770000 : 0x77007700;
        drawBox(bounds.rc, transform.worldMatrix, boundsColor, boundsColor, false);
    });
    drawer.state.restoreTransform();
}

function debugCameraGizmo(camera: Camera2D, drawer: Drawer) {
    RECT_TMP.copyFrom(camera.worldRect);
    RECT_TMP.expand(-10, -10);
    drawBox(RECT_TMP, Matrix2D.IDENTITY, 0xFFFFFFFF, 0xFF000000);

    const v = VEC2_TMPS[0];
    v.x = camera.screenRect.x + camera.screenRect.width * camera.relativeOrigin.x;
    v.y = camera.screenRect.y + camera.screenRect.height * camera.relativeOrigin.y;
    camera.matrix.transformWith(v);
    drawer.fillCircle(v.x, v.y, 10, 0x00FFFFFF, 0x44FFFFFF, 7);
    drawer.line(v.x - 20, v.y, v.x + 20, v.y, 0xFF000000, 0xFFFFFFFF, 1, 3);
    drawer.line(v.x, v.y - 20, v.x, v.y + 20, 0xFF000000, 0xFFFFFFFF, 3, 1);
}