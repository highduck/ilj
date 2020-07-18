import {Rect} from "@highduck/math";
import {ComponentTypeA} from "../../ecs";

// export const Bounds2D = createClassComponent(class Bounds2D {
//     readonly rc = new Rect();
// });

export const Bounds2D = new ComponentTypeA(Rect);
