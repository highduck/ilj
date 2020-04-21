import {declTypeID} from "../../util/TypeID";
import {Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {Entity} from "../../ecs/Entity";

export class Camera2D {
    // static main: Entity;
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;
    enabled = true;
    order = 0;

    root?: Entity = undefined;
    contentScale = 1;
    clearColorEnabled = true;
    readonly clearColor = new Color4();
    readonly viewport = new Rect(0, 0, 1, 1);
    readonly relativeOrigin = new Vec2();
    // TODO: move contentScale from view to Some special Canvas component or fit in camera
    syncContentScale = true;

    debugGizmoFills = false;
    debugGizmoHitTarget = false;
    debugGizmoPointer = false;
    debugGizmoSelf = false;

    readonly matrix = new Matrix2D();
    readonly inverseMatrix = new Matrix2D();
    readonly screenRect = new Rect();
    readonly worldRect = new Rect();
    interactive = false;
}