// import {Color32_ARGB, Recta, Vec2} from "@highduck/math";
// import {Drawer} from "../../drawer/Drawer";
// import {Display2D, Display2DComponent} from "./Display2D";
// import {ComponentTypeA} from "../../ecs";
// import {AssetRef, Sprite, Texture} from "../..";
//
// export class DisplayTileComponent extends Display2DComponent {
//
//     sprite:AssetRef<Sprite|Texture> = AssetRef.NONE;
//     readonly offset = new Vec2();
//     readonly rect = new Recta();
//     readonly size = new Vec2();
//
//     constructor() {
//         super();
//     }
//
//     draw(drawer: Drawer) {
//         if(this.sprite.data === null) {
//             return;
//         }
//         if(this.sprite.data instanceof Sprite) {
//             if(this.sprite.data.texture.data === null) {
//                 return;
//             }
//             drawer.state.setTexture(this.sprite.data.texture.data);
//             drawer.state.setTextureCoordsRect(this.sprite.data.tex);
//         }
//         else if(this.sprite.data instanceof Texture) {
//             drawer.state.setTexture(this.sprite.data);
//         }
//
//         const fx = this.offset.x % this.size.x;
//         const fy = this.offset.y % this.size.y;
//         for(let cx = 0; cx < )
//         drawer.quadFast(this.rect.x,
//             this.rect.y, this.rect.width, this.rect.height,
//             this.colors[0], this.colors[1], this.colors[2], this.colors[3]);
//     }
//
//     getBounds(out: Recta): void {
//         out.copyFrom(this.rect);
//     }
//
//     setGradientVertical(top: Color32_ARGB, bottom: Color32_ARGB) {
//         this.colors[0] = this.colors[1] = top;
//         this.colors[2] = this.colors[3] = bottom;
//     }
//
//     setGradientHorizontal(left: Color32_ARGB, right: Color32_ARGB) {
//         this.colors[0] = this.colors[3] = left;
//         this.colors[1] = this.colors[2] = right;
//     }
// }
//
// export const DisplayTile = new ComponentTypeA(DisplayTileComponent, Display2D);