import {Rect} from "@highduck/math";
import {declTypeID} from "../../util/TypeID";

export class Bounds2D {
    static TYPE_ID = declTypeID();

    readonly rc = new Rect();
}