import {delay, Engine, ObservableValue} from "@highduck/core";
import {AdBannerMode, BaseAds} from "./BaseAds";

const AD_DURATION = 2000;
const LOAD_TIME = 5000;
const PREVIEW_MODE = process.env.NODE_ENV === 'development';

export class FakeAds implements BaseAds {
    readonly isAvailable = true;

    readonly rewardVideoReady = new ObservableValue(false);
    rewardVideoLoading = false;

    _banner = AdBannerMode.Disabled;
    _showBanner = true;
    _showFS = false;

    constructor() {
        const engine = Engine.current;
        engine.onRenderFinish.on(() => {
            const drawer = engine.drawer;
            const rc = engine.view.drawable;
            const w = rc.width;
            const h = 50 * w / 320; // 320x50
            drawer.state.setEmptyTexture();
            if (PREVIEW_MODE) {
                if (this._showBanner) {
                    if (this._banner === AdBannerMode.Bottom) {
                        drawer.quadColor(0, rc.height - h, w, h, 0x77FFFFFF);
                    } else if (this._banner === AdBannerMode.Top) {
                        drawer.quadColor(0, 0, w, h, 0x77FFFFFF);
                    }
                }
                if (this._showFS) {
                    drawer.quadColor(0, 0, rc.width, rc.height, 0x77000000);
                }
            }
        });
    }

    async setBanner(mode: AdBannerMode) {
        this._banner = mode;
    }

    async loadVideoReward() {
        if (this.rewardVideoLoading || this.rewardVideoReady.value) {
            return;
        }
        this.rewardVideoLoading = true;
        if (PREVIEW_MODE) {
            await delay(LOAD_TIME);
        }
        this.rewardVideoLoading = false;
        this.rewardVideoReady.value = true;
    }

    async playVideoReward(): Promise<void> {
        let rewarded = false;
        if (this.rewardVideoReady.value && !this.rewardVideoLoading) {
            try {
                this._showFS = true;
                if (PREVIEW_MODE) {
                    await delay(AD_DURATION);
                }
                this._showFS = false;

                rewarded = true;
            } catch {
            }
            this.rewardVideoReady.value = false;
            //this.loadVideoReward();
        }
        if (!rewarded) {
            throw new Error();
        }
    }

    interstitialLoaded: boolean = true;
    interstitialLoading: boolean = false;

    async loadInterstitial() {
        if (this.interstitialLoaded || this.interstitialLoading) {
            return;
        }
        this.interstitialLoading = true;
        if (PREVIEW_MODE) {
            await delay(LOAD_TIME);
        }
        this.interstitialLoading = false;
        this.interstitialLoaded = true;
    }

    async playInterstitial(): Promise<void> {
        if (this.interstitialLoaded && !this.interstitialLoading) {
            try {
                this._showFS = true;
                if (PREVIEW_MODE) {
                    await delay(AD_DURATION);
                }
                this._showFS = false;
            } catch {
            }
            this.interstitialLoaded = false;
            //this.loadInterstitial();
        }
    }
}