import {Disposable, Engine, Entity, EntityComponentType, FastScript, Time, Transform2D} from "@highduck/core";
import {Application} from "../";

export class VideoRewardButtonScript {
    _spinner: Entity | null = null;

    constructor(readonly entity: Entity) {
        const ads = Application.current.ads;
        if (!ads.isAvailable) {
            entity.visible = false;
        } else if (this.handle === null) {
            this.handle = ads.impl.rewardVideoReady.on((v) => this.update(v));
            // there a HACK :)
            ads.loadVideoReward();
        }
    }

    private handle: Disposable | null = null;

    private update(v: boolean) {
        if (this.entity && this.entity.isValid) {
            if (!v && !this._spinner) {
                this._spinner = Engine.current.aniFactory.create("spinner", this.entity);
                this._spinner?.set(FastScript).updated.on((e) => {
                    e.get(Transform2D).rotation += 8 * Time.UI.dt;
                });
            }
            this._spinner?.setVisible(!v);
            this.entity.touchable = v;
        }
    }

    dispose() {
        if (this.handle !== null) {
            this.handle.dispose();
            this.handle = null;
        }
    }
}

export const VideoRewardButton = new EntityComponentType(VideoRewardButtonScript);