import {Entity} from "../../ecs/Entity";
import {Ani, findLinkageRef} from "./Ani";
import {Transform2D} from "../display/Transform2D";
import {DisplaySprite} from "../display/DisplaySprite";
import {Display2D} from "../display/Display2D";
import {Engine} from "../../Engine";
import {Sprite} from "../Sprite";
import {Matrix2D, Rect} from "@highduck/math";
import {DisplayText} from "../display/DisplayText";
import {MovieClip2D, MovieClipTarget} from "../display/MovieClip2D";
import {Filters2D} from "../display/Filters2D";
import {Interactive} from "./Interactive";
import {Button} from "./Button";
import {Resources} from "../../util/Resources";
import {NodeJson} from "@highduck/anijson";

export class AniFactory {

    constructor(private readonly engine: Engine) {
    }

    applyData(entity: Entity, data: NodeJson, library: Ani) {
        entity.name = data.id;
        const targetKeys = entity.getOrCreate(MovieClipTarget);
        if (data.ak !== undefined) {
            targetKeys.keyAnimation = data.ak;
        }
        if (data.lk !== undefined) {
            targetKeys.keyLayer = data.lk;
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
            transform.scissors = new Rect();
            transform.scissors.setTuple(data.clipRect);
        }

        if (data.hitRect) {
            transform.hitArea = new Rect();
            transform.hitArea.setTuple(data.hitRect);
        }

        if (data.touchable !== undefined) {
            entity.touchable = data.touchable;
        }

        if (data.visible !== undefined) {
            entity.visible = data.visible;
        }

        if (data.dynamicText) {
            const dtext = entity.getOrCreate(DisplayText);
            dtext.text = data.dynamicText.text;
            dtext.rect.setTuple(data.dynamicText.rect);

            dtext.format.font = data.dynamicText.face;
            dtext.format.size = data.dynamicText.size;
            dtext.format.alignment.setTuple(data.dynamicText.alignment);
            dtext.format.lineSpacing = data.dynamicText.line_spacing;
            dtext.format.lineHeight = data.dynamicText.line_height;
            dtext.format.shadow = false;
            dtext.format.color = data.dynamicText.color;
        }

        if (data.movie) {
            const mov = entity.set(MovieClip2D);
            if (library.backReference !== undefined) {
                mov.libraryAsset = library.backReference;
                mov.movieDataSymbol = data.ref!;
            } else {
                mov.data = data.movie;
            }
        }

        let sprite: DisplaySprite | undefined;

        if (entity.has(Display2D)) {
            const display = entity.tryGet(Display2D);
            if (display instanceof DisplaySprite) {
                sprite = display as DisplaySprite;
            }
        }

        if (data.spr && !sprite) {
            sprite = entity.set(DisplaySprite);
            sprite.sprite = Resources.get(Sprite, data.spr);
            if (data.scaleGrid) {
                sprite.scaleGrid = new Rect();
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

        if (data.filters) {
            entity.getOrCreate(Filters2D).filters = data.filters;
        }
    }

    createAndMerge(ani: Ani, data?: NodeJson, over?: NodeJson): Entity {
        const entity = this.engine.world.create();
        entity.set(Transform2D);
        entity.set(MovieClipTarget);
        if (data) {
            this.applyData(entity, data, ani);
        }
        if (over) {
            this.applyData(entity, over, ani);
        }
        if (data && data.children) {
            for (const child of data.children) {
                entity.appendStrict(
                    this.createAndMerge(ani, ani.get(child.ref!), child)
                );
            }
        }

        return entity;
    }

    extendBounds(file: Ani, data: NodeJson, bounds: Rect, matrix: Matrix2D) {
        if (data.spr) {
            const spr = Resources.get(Sprite, data.spr).data;
            if (spr) {
                // TODO:
                // bounds = combine(bounds, points_box(
                //     matrix.transform(spr->rect.position),
                //     matrix.transform(spr->rect.right_bottom())
                // ));
            }
        }
        if (data.children) {
            for (const child of data.children) {
                const symbol = child.ref ? file.get(child.ref) : child;
                if (symbol) {
                    // TODO:
                    //this.extend_bounds(file, symbol, bounds, matrix * child.matrix);
                }
            }
        }
    }

    create(linkage: string, parent?: Entity): Entity | undefined {
        const ref = findLinkageRef(linkage);
        if (ref !== undefined) {
            const entity = this.createFromAni(ref.library, ref.path);
            if (entity !== undefined) {
                if (parent !== undefined) {
                    parent.appendStrict(entity);
                }
                return entity;
            }
        } else {
            console.warn("[Ani] global linkage not found: " + linkage);
        }
        return undefined;
    }

    createFromAni(library: Ani, path: string): Entity | undefined {
        const data = library.get(path);
        if (data) {
            return this.createAndMerge(library, data);
        }
        console.warn(`SG Object ${path} not found in library ${library}`);
        return undefined;
    }

    createFromLibrary(library: string, path: string): Entity | undefined {
        const asset = Resources.get(Ani, library);
        if (asset.data !== undefined) {
            return this.createFromAni(asset.data, path);
        }
        console.warn(`SG not found: ${library}`);
        return undefined;
    }

    sgGetBounds(library: string, name: string): Rect {
        const asset = Resources.get(Ani, library);
        const file = asset.data;
        if (file) {
            const data = file.get(name);
            if (data) {
                const rc = new Rect();
                // TODO:
                // this.extend_bounds(file, data, rc, data.matrix);
                return rc;
            }
        }
        return new Rect();
    }
}