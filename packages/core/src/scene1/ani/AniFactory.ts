import {Entity} from "../../ecs/Entity";
import {Ani, AniResource, findLinkageRef} from "./Ani";
import {Transform2D} from "../display/Transform2D";
import {DisplaySprite, DisplaySpriteComponent} from "../display/DisplaySprite";
import {Display2D} from "../display/Display2D";
import {SpriteResource} from "../Sprite";
import {Matrix2D, Recta} from "@highduck/math";
import {DisplayText} from "../display/DisplayText";
import {MovieClip2D, MovieClipTarget} from "../display/MovieClip2D";
import {Interactive} from "./Interactive";
import {Button} from "./Button";
import {NodeJson} from "@highduck/anijson";
import {FontResource} from "../..";

export class AniFactory {

    constructor() {
    }

    applyData(entity: Entity, data: NodeJson) {
        if(data.id !== undefined) {
            entity.name = data.id;
        }

        if (data.i !== undefined) {
            entity.getOrCreate(MovieClipTarget).keyAnimation = data.i;
        }

        const transform = entity.get(Transform2D);
        if (data.p !== undefined) {
            transform.position.setTuple(data.p);
        }
        if (data.s !== undefined) {
            transform.scale.setTuple(data.s);
        }
        if (data.r !== undefined) {
            transform.skew.setTuple(data.r);
        }
        if (data.cm !== undefined) {
            transform.colorMultiplier.setTuple(data.cm);
        }
        if (data.co !== undefined) {
            transform.colorOffset.setTuple(data.co);
        }

        if (data.clipRect) {
            transform.flagScissors = true;
            transform.scissors.setTuple(data.clipRect);
        }

        if (data.hitRect) {
            transform.flagHitArea = true;
            transform.hitArea.setTuple(data.hitRect);
        }

        if (data.touchable !== undefined) {
            entity.touchable = data.touchable;
        }

        if (data.v !== undefined) {
            entity.visible = data.v;
        }

        if (data.tf) {
            const tf = entity.getOrCreate(DisplayText);
            tf.text = data.tf.text;
            tf.rect.setTuple(data.tf.rect);

            tf.font = FontResource.get(data.tf.face);
            tf.format.size = data.tf.size;
            tf.format.alignment.setTuple(data.tf.alignment);
            tf.format.lineSpacing = data.tf.lineSpacing;
            tf.format.lineHeight = data.tf.lineHeight;
            tf.format.shadow = false;
            tf.format.color = data.tf.color;
        }

        if (data.mc) {
            const mov = entity.set(MovieClip2D);
            mov.data = data.mc;
            mov.fps = data.mc.f ?? 24;
        }

        let sprite: DisplaySpriteComponent | undefined;
        const display = entity.tryGet(Display2D);

        if (display !== undefined && display instanceof DisplaySpriteComponent) {
            sprite = display;
        }

        if (data.spr && !sprite) {
            sprite = entity.set(DisplaySprite);
            sprite.sprite = SpriteResource.get(data.spr);
            if (data.scaleGrid) {
                sprite.scaleGrid = new Recta();
                sprite.scaleGrid.setTuple(data.scaleGrid);
            }
        }

        if (sprite && sprite.scaleGrid && data.s) {
            sprite.scale.x = data.s[0];
            sprite.scale.y = data.s[1];
        }

        if (data.button !== undefined) {
            entity.set(Interactive);
            entity.set(Button);
        }

        // if (data.filters) {
        //     entity.getOrCreate(Filters2D).filters = data.filters;
        // }
    }

    createAndMerge(ani: Ani, data: NodeJson | undefined, over: NodeJson | undefined): Entity {
        const entity = Entity.create();
        entity.set(Transform2D);
        if (data) {
            this.applyData(entity, data);
        }
        if (over) {
            this.applyData(entity, over);
        }
        if (data && data._) {
            for (let i = 0; i < data._.length; ++i) {
                const child = data._[i];
                const e = this.createAndMerge(ani, ani.get(child.ref!), child);
                entity.appendStrict(e);
            }
        }

        return entity;
    }

    extendBounds(file: Ani, data: NodeJson, bounds: Recta, matrix: Matrix2D) {
        // if (data.spr) {
        //     const spr = SpriteResource.get(data.spr).data;
        //     if (spr) {
        //         // TODO:
        //         // bounds = combine(bounds, points_box(
        //         //     matrix.transform(spr->rect.position),
        //         //     matrix.transform(spr->rect.right_bottom())
        //         // ));
        //     }
        // }
        // if (data.C) {
        //     for (const child of data.C) {
        //         const symbol = child.ref ? file.get(child.ref) : child;
        //         if (symbol) {
        //             // TODO:
        //             //this.extend_bounds(file, symbol, bounds, matrix * child.matrix);
        //         }
        //     }
        // }
    }

    create(linkage: string, parent?: Entity): Entity | null {
        const ref = findLinkageRef(linkage);
        if (ref !== undefined) {
            const entity = this.createFromAni(ref.library, ref.ref);
            if (entity !== null) {
                if (parent !== undefined) {
                    parent.appendStrict(entity);
                }
                return entity;
            }
        } else {
            console.warn("[Ani] global linkage not found: " + linkage);
        }
        return null;
    }

    createFromAni(library: Ani, ref: string): Entity | null {
        const data = library.get(ref);
        if (data) {
            return this.createAndMerge(library, data, undefined);
        }
        console.warn(`SG Object ${ref} not found in library ${library}`);
        return null;
    }

    createScene(library: string, index: number = 0): Entity | null {
        const data = AniResource.data(library);
        if (data !== null) {
            const scenes = data.json.scenes;
            const ids = Object.keys(scenes);
            const sceneId = ids[index % ids.length];
            console.log(sceneId);
            const libraryName = scenes[sceneId];
            console.log(libraryName);
            return this.createFromAni(data, libraryName);
        }
        console.warn(`SG not found: ${library}`);
        return null;
    }

    createFromLibrary(library: string, path: string): Entity | null {
        const data = AniResource.data(library);
        if (data !== null) {
            return this.createFromAni(data, path);
        }
        console.warn(`SG not found: ${library}`);
        return null;
    }

    getBounds(library: string, name: string): Recta {
        const file = AniResource.data(library);
        if (file) {
            const data = file.get(name);
            if (data) {
                const rc = new Recta();
                // TODO:
                // this.extend_bounds(file, data, rc, data.matrix);
                return rc;
            }
        }
        return new Recta();
    }
}