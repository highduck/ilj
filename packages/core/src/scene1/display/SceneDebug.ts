import {Entity} from "../../ecs/Entity";
import {Drawer} from "../../drawer/Drawer";
import {Engine} from "../../Engine";
import {Transform2D} from "./Transform2D";
import {Display2D} from "./Display2D";
import {DisplaySystem} from "./DisplaySystem";
import {Matrix2D, Rect, Vec2} from "@highduck/math";
import {Camera2D} from "./Camera2D";
import {Bounds2D} from "./Bounds2D";

const MATRIX_TMP = new Matrix2D();
const RECT_TMP = new Rect();
const RECT_TMP2 = new Rect();
const VEC2_TMPS = [new Vec2(), new Vec2(), new Vec2(), new Vec2()];

export function drawCameraDebugGizmos(camera: Camera2D, root: Entity) {
    const drawer = Engine.current.drawer;
    if (camera.debugGizmoFills) {
        debugDrawFill(root, drawer);
    }
    if (camera.debugGizmoBounds) {
        debugDrawBounds(root, drawer);
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

function debugDrawHitTarget(cameraRoot: Entity, drawer: Drawer) {
    const target = Engine.current.interactiveManager.hitTarget;
    if (target === undefined) {
        return;
    }
    const display = target.tryGet(Display2D);
    if (display === undefined) {
        return;
    }
    drawer.state.setEmptyTexture();
    display.getBounds(RECT_TMP);
    VEC2_TMPS[0].set(RECT_TMP.x, RECT_TMP.y);
    VEC2_TMPS[1].set(RECT_TMP.right, RECT_TMP.y);
    VEC2_TMPS[2].set(RECT_TMP.right, RECT_TMP.bottom);
    VEC2_TMPS[3].set(RECT_TMP.x, RECT_TMP.bottom);
    Transform2D.localToLocal(target, cameraRoot, VEC2_TMPS[0], VEC2_TMPS[0]);
    Transform2D.localToLocal(target, cameraRoot, VEC2_TMPS[1], VEC2_TMPS[1]);
    Transform2D.localToLocal(target, cameraRoot, VEC2_TMPS[2], VEC2_TMPS[2]);
    Transform2D.localToLocal(target, cameraRoot, VEC2_TMPS[3], VEC2_TMPS[3]);
    drawer.line(VEC2_TMPS[0].x, VEC2_TMPS[0].y, VEC2_TMPS[1].x, VEC2_TMPS[1].y, 0xFF000000, 0xFFFFFFFF, 3, 1);
    drawer.line(VEC2_TMPS[1].x, VEC2_TMPS[1].y, VEC2_TMPS[2].x, VEC2_TMPS[2].y, 0xFF000000, 0xFFFFFFFF, 1, 3);
    drawer.line(VEC2_TMPS[2].x, VEC2_TMPS[2].y, VEC2_TMPS[3].x, VEC2_TMPS[3].y, 0xFF000000, 0xFFFFFFFF, 3, 1);
    drawer.line(VEC2_TMPS[3].x, VEC2_TMPS[3].y, VEC2_TMPS[0].x, VEC2_TMPS[0].y, 0xFF000000, 0xFFFFFFFF, 1, 3);
    drawer.line(VEC2_TMPS[0].x, VEC2_TMPS[0].y, VEC2_TMPS[2].x, VEC2_TMPS[2].y, 0xFF000000, 0xFFFFFFFF, 3, 3);
    drawer.line(VEC2_TMPS[3].x, VEC2_TMPS[3].y, VEC2_TMPS[1].x, VEC2_TMPS[1].y, 0xFF000000, 0xFFFFFFFF, 1, 1);
}

function debugDrawFill(e: Entity, drawer: Drawer) {
    if (!e.visible) {
        return;
    }

    const transform = e.tryGet(Transform2D);
    if (transform !== undefined) {
        if (transform.colorMultiplier.a <= 0.0) {
            return;
        }

        DisplaySystem.beginTransform(drawer.state, transform);
    }

    const display = e.tryGet(Display2D);
    if (display) {
        display.getBounds(RECT_TMP);
        if (!RECT_TMP.empty) {
            drawer.state.setEmptyTexture();
            drawer.state.saveColor();
            drawer.state.colorMultiplier.set(1, 1, 1, 0.25);
            drawer.state.colorOffset.fill(0);
            drawer.quadFast(RECT_TMP.x, RECT_TMP.y, RECT_TMP.width, RECT_TMP.height, true);
            drawer.state.restoreColor();
        }
    }

    let child = e.childFirst;
    while (child !== undefined) {
        debugDrawFill(child, drawer);
        child = child.siblingNext;
    }

    if (transform) {
        DisplaySystem.endTransform(drawer.state, transform);
    }
}

function debugDrawBounds(e: Entity, drawer: Drawer) {
    const transform = e.tryGet(Transform2D);
    if (transform !== undefined) {
        DisplaySystem.beginTransform(drawer.state, transform);
    }

    const bounds = e.tryGet(Bounds2D);
    if (bounds !== undefined) {
        RECT_TMP.copyFrom(bounds.rc);

        RECT_TMP2.copyFrom(bounds.rc);
        const drawer = Engine.current.drawer;
        RECT_TMP2.transform(drawer.state.matrix);
        const screenRect = drawer.state.scissors;
        const visibleCheck = RECT_TMP2.right > screenRect.x &&
            RECT_TMP2.x < screenRect.right &&
            RECT_TMP2.bottom > screenRect.y &&
            RECT_TMP2.y < screenRect.bottom;

        //RECT_TMP.transform(drawer.state.matrix);
        drawer.state.setEmptyTexture();
        drawer.state.saveColor();
        if (visibleCheck) {
            drawer.state.colorMultiplier.set(0, 1, 0, 0.25);
        } else {
            drawer.state.colorMultiplier.set(1, 0, 0, 0.25);
        }
        drawer.state.colorOffset.fill(0);
        drawer.quadFast(RECT_TMP.x, RECT_TMP.y, RECT_TMP.width, RECT_TMP.height, true);
        drawer.state.restoreColor();
    }

    let child = e.childFirst;
    while (child !== undefined) {
        debugDrawBounds(child, drawer);
        child = child.siblingNext;
    }

    if (transform) {
        DisplaySystem.endTransform(drawer.state, transform);
    }
}

function debugCameraGizmo(camera: Camera2D, drawer: Drawer) {
    const m = MATRIX_TMP;
    camera.calcMatrix(1, m);
    drawer.state.setEmptyTexture();
    RECT_TMP.copyFrom(camera.screenRect);
    RECT_TMP.expand(-10, -10);
    VEC2_TMPS[0].set(RECT_TMP.x, RECT_TMP.y);
    VEC2_TMPS[1].set(RECT_TMP.right, RECT_TMP.y);
    VEC2_TMPS[2].set(RECT_TMP.right, RECT_TMP.bottom);
    VEC2_TMPS[3].set(RECT_TMP.x, RECT_TMP.bottom);
    m.transform(RECT_TMP.x, RECT_TMP.y, VEC2_TMPS[0]);
    m.transform(RECT_TMP.right, RECT_TMP.y, VEC2_TMPS[1]);
    m.transform(RECT_TMP.right, RECT_TMP.bottom, VEC2_TMPS[2]);
    m.transform(RECT_TMP.x, RECT_TMP.bottom, VEC2_TMPS[3]);
    drawer.line(VEC2_TMPS[0].x, VEC2_TMPS[0].y, VEC2_TMPS[1].x, VEC2_TMPS[1].y, 0xFF000000, 0xFFFFFFFF, 3, 1);
    drawer.line(VEC2_TMPS[1].x, VEC2_TMPS[1].y, VEC2_TMPS[2].x, VEC2_TMPS[2].y, 0xFF000000, 0xFFFFFFFF, 1, 3);
    drawer.line(VEC2_TMPS[2].x, VEC2_TMPS[2].y, VEC2_TMPS[3].x, VEC2_TMPS[3].y, 0xFF000000, 0xFFFFFFFF, 3, 1);
    drawer.line(VEC2_TMPS[3].x, VEC2_TMPS[3].y, VEC2_TMPS[0].x, VEC2_TMPS[0].y, 0xFF000000, 0xFFFFFFFF, 1, 3);
    drawer.line(VEC2_TMPS[0].x, VEC2_TMPS[0].y, VEC2_TMPS[2].x, VEC2_TMPS[2].y, 0xFF000000, 0xFFFFFFFF, 3, 3);
    drawer.line(VEC2_TMPS[3].x, VEC2_TMPS[3].y, VEC2_TMPS[1].x, VEC2_TMPS[1].y, 0xFF000000, 0xFFFFFFFF, 1, 1);

    camera.matrix.transform(
        camera.screenRect.x + camera.screenRect.width * camera.relativeOrigin.x,
        camera.screenRect.y + camera.screenRect.height * camera.relativeOrigin.y,
        VEC2_TMPS[0]
    );
    drawer.fillCircle(VEC2_TMPS[0].x, VEC2_TMPS[0].y, 40, 0x00FFFFFF, 0x44FFFFFF, 7);
    drawer.line(VEC2_TMPS[0].x - 20, VEC2_TMPS[0].y, VEC2_TMPS[0].x + 20, VEC2_TMPS[0].y, 0xFF000000, 0xFFFFFFFF, 1, 3);
    drawer.line(VEC2_TMPS[0].x, VEC2_TMPS[0].y - 20, VEC2_TMPS[0].x, VEC2_TMPS[0].y + 20, 0xFF000000, 0xFFFFFFFF, 3, 1);
}