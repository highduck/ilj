import {declTypeID} from "../../util/TypeID";
import {Color4, Matrix2D, Rect, Vec2} from "@highduck/math";
import {Entity} from "../../ecs/Entity";
import {Transform2D} from "./Transform2D";

export class Camera2D {
    // static main: Entity;
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;
    enabled = true;
    order = 0;

    root: Entity = Entity.root;
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

    calcMatrix(scale: number, out: Matrix2D) {
        const screen = this.screenRect;
        const transform = this.entity.searchRootComponent(Transform2D);
        out.copyFrom(transform === undefined ? Matrix2D.IDENTITY : transform.worldMatrix);
        scale *= this.contentScale;
        out.scale(1 / scale, 1 / scale);
        out.translate(
            -screen.x - this.relativeOrigin.x * screen.width,
            -screen.y - this.relativeOrigin.y * screen.height
        );
    }
}