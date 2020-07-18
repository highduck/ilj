import {Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {Transform2D, Transform2D_Data} from "./Transform2D";
import {ComponentTypeA, Entity} from "../../ecs";

export class Camera2DComponent {
    enabled = true;
    order = 0;

    root = Entity.root;
    contentScale = 1;
    clearColorEnabled = false;
    readonly clearColor = new Color4();
    readonly viewport = new Rect(0, 0, 1, 1);
    readonly relativeOrigin = new Vec2();
    // TODO: move contentScale from view to Some special Canvas component or fit in camera
    syncContentScale = true;

    debugOcclusion = false;
    debugGizmoFills = false;
    debugGizmoHitTarget = false;
    debugGizmoPointer = false;
    debugGizmoSelf = false;
    debugDrawScale = 1;

    readonly matrix = new Matrix2D();
    readonly inverseMatrix = new Matrix2D();
    readonly screenRect = new Rect();
    readonly worldRect = new Rect();
    interactive = false;
    occlusionEnabled = true;

    calcMatrix(root: Entity, scale: number, out: Matrix2D) {
        const screen = this.screenRect;
        const transform = root.searchRootComponent(Transform2D) ?? Transform2D_Data.IDENTITY;
        out.copyFrom(transform.worldMatrix);
        scale *= this.contentScale;
        out.scale(1 / scale, 1 / scale);
        out.translate(
            -screen.x - this.relativeOrigin.x * screen.width,
            -screen.y - this.relativeOrigin.y * screen.height
        );
    }
}

export const Camera2D = new ComponentTypeA(Camera2DComponent);