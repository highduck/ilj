import {AdBannerMode, AdUnits, BaseAds} from "./BaseAds";
import {GoogleAds} from "./GoogleAds";
import {Engine, ObservableValue} from "@highduck/core";
import {NullAds} from "./NullAds";
import {FakeAds} from "./FakeAds";

export interface AdsControllerConfig {
    units?: AdUnits;
    interstitialRate?: number;
    fake?: boolean;
}

export class AdsController {
    removed = false;
    private interstitialCounter = 0;
    readonly impl: BaseAds;
    readonly bannerMode = new ObservableValue<AdBannerMode>(AdBannerMode.Disabled);

    constructor(readonly config: AdsControllerConfig) {
        if (config.fake) {
            this.impl = new FakeAds();
        } else if (!config.units || process.env.PLATFORM === 'web') {
            this.impl = new NullAds();
        } else {
            this.impl = new GoogleAds(config.units);
        }
    }

    get isAvailable() {
        return this.impl.isAvailable;
    }

    async fireInterstitial() {
        if (this.removed || !this.impl.isAvailable) {
            return;
        }
        const rate = this.config.interstitialRate ?? 0;
        if (rate > 0) {
            ++this.interstitialCounter;
            if (this.interstitialCounter >= rate) {
                if (this.impl.interstitialLoaded) {
                    this.interstitialCounter = 0;
                    await this.playInterstitial();
                }
                // do not wait loading, just will try next time
                this.impl.loadInterstitial().then();
            }
        }
    }

    loadVideoReward() {
        this.impl.loadVideoReward().then();
    }

    async playVideoReward(): Promise<void> {
        let error = undefined;
        if (this.impl.rewardVideoReady.value) {
            Engine.current.audio.beginMute();
            try {
                await this.impl.playVideoReward();
            } catch (err) {
                error = err;
            }
            Engine.current.audio.endMute();
        }
        if (error) {
            throw error;
        }
    }

    private async playInterstitial(): Promise<void> {
        // premium checke on caller
        // if (this.premium.value) {
        //     return;
        // }
        if (this.impl.interstitialLoaded) {
            Engine.current.audio.beginMute();
            try {
                await this.impl.playInterstitial();
            } catch {
            }
            Engine.current.audio.endMute();
        }
    }

    banner(mode: AdBannerMode) {
        if (this.removed || !this.isAvailable) {
            return;
        }
        this.impl.setBanner(mode).then();
        this.bannerMode.value = mode;
    }

    remove(value: boolean) {
        this.removed = value;
        if (value) {
            this.impl.setBanner(AdBannerMode.Disabled).then();
            this.bannerMode.value = AdBannerMode.Disabled;
        }
    }


}